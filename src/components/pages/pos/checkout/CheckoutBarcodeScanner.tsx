'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  title = 'Scan Product Code'
}: CheckoutBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');

  const videoRef = useRef<HTMLDivElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Quagga dynamically
  useEffect(() => {
    if (open && !window.Quagga) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js';
      script.onload = () => {
        console.log('Quagga loaded successfully');
        if (open) {
          initializeScanner();
        }
      };
      script.onerror = () => {
        console.error('Failed to load Quagga');
        setScanError('Failed to load scanner library');
      };
      document.head.appendChild(script);
    } else if (open && window.Quagga) {
      initializeScanner();
    }

    return () => {
      if (window.Quagga) {
        window.Quagga.stop();
      }
    };
  }, [open]);

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

  const startScanning = useCallback((cameraId: string) => {
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
      window.Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: 'environment',
            deviceId: cameraId
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
            'i2of5_reader'
          ]
        },
        locate: true
      }, (err: any) => {
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
            window.Quagga.stop();
          }
        }, 30000);
      });

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
        window.Quagga.stop();
        
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
  }, [hasScanned, onScanSuccess, onOpenChange]);

  const stopScanning = useCallback(() => {
    if (window.Quagga) {
      window.Quagga.stop();
    }
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    setIsScanning(false);
  }, []);

  const handleCameraChange = useCallback((cameraId: string) => {
    if (isScanning) {
      stopScanning();
    }
    setSelectedCamera(cameraId);
    setTimeout(() => startScanning(cameraId), 500);
  }, [isScanning, stopScanning, startScanning]);

  const handleRetry = useCallback(() => {
    setScanError(null);
    if (selectedCamera) {
      startScanning(selectedCamera);
    }
  }, [selectedCamera, startScanning]);

  const playScanSound = useCallback(() => {
    try {
      const audio = new Audio('/Assets/sounds/scan-success.mp3');
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Error playing scan sound:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.Quagga) {
        window.Quagga.stop();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Selection */}
          {availableCameras.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="camera-select">Select Camera</Label>
              <Select value={selectedCamera} onValueChange={handleCameraChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select camera" />
                </SelectTrigger>
                <SelectContent>
                  {availableCameras.map((camera) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${camera.deviceId.slice(0, 8)}...`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Video Container */}
          <div className="relative">
            <div
              ref={videoRef}
              className="w-full h-64 bg-black rounded-lg overflow-hidden relative"
            >
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera preview will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-sm bg-black/50 px-3 py-1 rounded text-center">
                  <div className="mb-1">🔍 Focus on the product code</div>
                  <div className="text-xs opacity-80">Scanner is active</div>
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {scannedCode && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                <div className="text-white text-center bg-green-600 px-4 py-2 rounded">
                  <div className="text-lg font-bold">✓ Scanned!</div>
                  <div className="text-sm">{scannedCode}</div>
                </div>
              </div>
            )}
          </div>

          {/* Status and Controls */}
          <div className="space-y-2">
            {scanError && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {scanError}
              </div>
            )}

            {isScanning && (
              <div className="text-blue-500 text-sm text-center">
                🔍 Scanning for product code...
              </div>
            )}

            {scanError && (
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="text-xs"
                >
                  🔄 Retry Scanner
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-center text-muted-foreground">
            <p className="mb-1">
              🔍 Point camera at the product barcode or SKU
            </p>
            <p className="text-xs opacity-70">
              Ensure good lighting and hold steady
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 