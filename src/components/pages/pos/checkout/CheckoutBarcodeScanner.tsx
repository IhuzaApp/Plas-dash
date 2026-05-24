'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScanBarcode, Camera } from 'lucide-react';
import { toast } from 'sonner';

// Quagga types
declare global {
  interface Window {
    Quagga: any;
  }
}

interface CheckoutBarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (code: string) => void;
  title?: string;
}

export default function CheckoutBarcodeScanner({
  open,
  onOpenChange,
  onScanSuccess,
  title = 'Scan Product Code',
}: CheckoutBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [containerMounted, setContainerMounted] = useState(false);

  const videoRef = useRef<HTMLDivElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Quagga dynamically
  useEffect(() => {
    if (open && containerMounted && !window.Quagga) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js';
      script.onload = () => {
        console.log('Quagga loaded successfully');
        if (open && containerMounted) {
          initializeScanner();
        }
      };
      script.onerror = () => {
        console.error('Failed to load Quagga');
        setScanError('Failed to load scanner library');
      };
      document.head.appendChild(script);
    } else if (open && containerMounted && window.Quagga) {
      initializeScanner();
    }

    return () => {
      if (window.Quagga) {
        try {
          window.Quagga.stop();
        } catch (e) {
          console.warn('Quagga stop error:', e);
        }
      }
    };
  }, [open, containerMounted]);

  const initializeScanner = useCallback(async () => {
    try {
      console.log('Initializing Quagga scanner for checkout...');

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('Available cameras:', videoDevices.length);
      setAvailableCameras(videoDevices);

      if (videoDevices.length > 0) {
        const firstCamera = videoDevices[0].deviceId;
        setSelectedCamera(firstCamera);
        console.log('Using camera:', firstCamera);

        // Start scanning
        startScanning(firstCamera);
      } else {
        throw new Error('No cameras found');
      }
    } catch (error) {
      console.error('Scanner initialization error:', error);
      setScanError('Failed to initialize camera. Please check camera permissions.');
    }
  }, []);

  const startScanning = useCallback(
    (cameraId: string) => {
      if (!window.Quagga || !videoRef.current) {
        console.error('Quagga not loaded or video element not found');
        return;
      }

      try {
        console.log('Starting Quagga scanner with camera:', cameraId);
        setIsScanning(true);
        setScanError(null);
        setHasScanned(false);

        // Configure Quagga
        window.Quagga.init(
          {
            inputStream: {
              name: 'Live',
              type: 'LiveStream',
              target: videoRef.current,
              constraints: {
                width: { min: 640 },
                height: { min: 480 },
                facingMode: 'environment',
                deviceId: cameraId,
              },
            },
            decoder: {
              readers: [
                'code_128_reader',
                'ean_reader',
                'ean_8_reader',
                'code_39_reader',
                'code_39_vin_reader',
                'codabar_reader',
                'upc_reader',
                'upc_e_reader',
                'i2of5_reader',
              ],
            },
            locate: true,
          },
          (err: any) => {
            if (err) {
              console.error('Quagga initialization error:', err);
              setScanError(`Scanner error: ${err.message}`);
              setIsScanning(false);
              return;
            }

            console.log('Quagga started successfully');

            // Start processing
            window.Quagga.start();

            // Set timeout
            scanTimeoutRef.current = setTimeout(() => {
              if (isScanning) {
                console.log('Scan timeout reached');
                setScanError('Scanning timeout. Please try again.');
                setIsScanning(false);
                try {
                  window.Quagga.stop();
                } catch (e) {
                  console.warn('Quagga stop error:', e);
                }
              }
            }, 30000);
          }
        );

        // Listen for scan results
        window.Quagga.onDetected((result: any) => {
          if (hasScanned) return;

          const code = result.codeResult.code;
          console.log('Product code detected:', code);
          console.log('Code format:', result.codeResult.format);

          setScannedCode(code);
          setIsScanning(false);
          setHasScanned(true);

          // Stop Quagga
          try {
            window.Quagga.stop();
          } catch (e) {
            console.warn('Quagga stop error:', e);
          }

          // Play success sound
          playScanSound();

          toast.success(`Product scanned: ${code}`);

          // Return result
          setTimeout(() => {
            onScanSuccess(code);
            onOpenChange(false);
            setScannedCode(null);
            setHasScanned(false);
          }, 1000);
        });

        // Listen for errors
        window.Quagga.onProcessed((result: any) => {
          if (result) {
            console.log('Frame processed');
          }
        });
      } catch (error) {
        console.error('Error starting scanner:', error);
        setScanError('Failed to start scanner. Please try again.');
        setIsScanning(false);
      }
    },
    [hasScanned, onScanSuccess, onOpenChange]
  );

  const stopScanning = useCallback(() => {
    if (window.Quagga) {
      try {
        window.Quagga.stop();
      } catch (e) {
        console.warn('Quagga stop error:', e);
      }
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    setIsScanning(false);
  }, []);

  const handleCameraChange = useCallback(
    (cameraId: string) => {
      if (isScanning) {
        stopScanning();
      }
      setSelectedCamera(cameraId);
      setTimeout(() => startScanning(cameraId), 500);
    },
    [isScanning, stopScanning, startScanning]
  );

  const handleRetry = useCallback(() => {
    setScanError(null);
    if (selectedCamera) {
      startScanning(selectedCamera);
    }
  }, [selectedCamera, startScanning]);

  const playScanSound = useCallback(() => {
    try {
      const audio = new Audio('/Assets/sound/storescannerbeep.mp3');
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing scan sound:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.Quagga) {
        try {
          window.Quagga.stop();
        } catch (e) {
          console.warn('Quagga stop error:', e);
        }
      }
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      stopScanning();
      setScannedCode(null);
      setScanError(null);
      setHasScanned(false);
    }
  }, [open, stopScanning]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes scan-laser {
            0% { top: 15%; opacity: 0.3; }
            50% { top: 85%; opacity: 1; }
            100% { top: 15%; opacity: 0.3; }
          }
          .scanner-laser {
            animation: scan-laser 2.2s infinite linear;
          }
          .quagga-video-container video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
          .quagga-video-container canvas {
            display: none !important;
          }
        `,
          }}
        />

        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-900">
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-850 dark:text-slate-100">
            <ScanBarcode className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Camera Selection */}
          {availableCameras.length > 1 && (
            <div className="space-y-1.5">
              <Label
                htmlFor="camera-select"
                className="text-xs font-bold text-slate-500 uppercase tracking-wide"
              >
                Select Camera Source
              </Label>
              <Select value={selectedCamera} onValueChange={handleCameraChange}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 rounded-xl">
                  <SelectValue placeholder="Choose camera source" />
                </SelectTrigger>
                <SelectContent className="border border-slate-150 dark:border-slate-800 rounded-xl">
                  {availableCameras.map(camera => (
                    <SelectItem
                      key={camera.deviceId}
                      value={camera.deviceId}
                      className="font-semibold text-xs py-2 rounded-lg cursor-pointer"
                    >
                      {camera.label || `Camera ${camera.deviceId.slice(0, 8)}...`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Video / Camera Container */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
            <div
              ref={el => {
                (videoRef as any).current = el;
                if (el && !containerMounted) {
                  setContainerMounted(true);
                } else if (!el && containerMounted) {
                  setContainerMounted(false);
                }
              }}
              className="quagga-video-container w-full h-72 bg-slate-950 relative flex items-center justify-center"
            >
              {/* Corner target brackets */}
              <div className="absolute top-5 left-5 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md z-20 opacity-80" />
              <div className="absolute top-5 right-5 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md z-20 opacity-80" />
              <div className="absolute bottom-5 left-5 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md z-20 opacity-80" />
              <div className="absolute bottom-5 right-5 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md z-20 opacity-80" />

              {/* Red Laser scanning effect */}
              {isScanning && (
                <div className="absolute left-6 right-6 h-[3px] bg-red-500 scanner-laser z-20 shadow-[0_0_12px_#ef4444]" />
              )}

              {!isScanning && !scannedCode && !scanError && (
                <div className="absolute inset-0 flex items-center justify-center text-white z-20 bg-slate-950/70 backdrop-blur-sm">
                  <div className="text-center p-6">
                    <Camera className="h-10 w-10 mx-auto mb-2 text-slate-400 animate-pulse" />
                    <p className="text-xs font-bold text-slate-300">
                      Camera preview will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Scanning status banner */}
            {isScanning && (
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center z-20">
                <div className="text-white text-xs font-bold bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800 shadow-lg text-center flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  Focus camera on the barcode or SKU
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {scannedCode && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/80 backdrop-blur-sm z-30 transition-all duration-300">
                <div className="text-white text-center p-6 rounded-2xl max-w-xs scale-105 transform duration-300">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/35">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="text-base font-extrabold tracking-tight">Product Found!</div>
                  <div className="text-xs text-emerald-300 font-mono mt-1 break-all bg-emerald-900/50 px-3 py-1 rounded-lg mt-2">
                    {scannedCode}
                  </div>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {scanError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 backdrop-blur-sm z-30 transition-all duration-300">
                <div className="text-white text-center p-6 rounded-2xl max-w-xs scale-105 transform duration-300">
                  <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/35">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <div className="text-base font-extrabold tracking-tight">Scanner Interrupted</div>
                  <div className="text-[11px] text-red-300 mt-2 line-clamp-2">{scanError}</div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons under scanner viewport */}
          {scanError && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                onClick={handleRetry}
                className="bg-primary hover:bg-primary/90 text-white font-extrabold shadow-md flex items-center justify-center gap-1.5 text-xs px-5 py-2.5 rounded-xl transition-all hover:scale-105"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89"
                  />
                </svg>
                Retry Scan
              </Button>
            </div>
          )}

          {/* Guidelines */}
          <div className="text-xs text-center text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-900">
            Ensure good lighting and hold the code steadily in front of the lens.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
