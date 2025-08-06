import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScanBarcode, Check, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanSuccess: (barcode: string) => void;
  scanType?: 'barcode' | 'qrcode';
  title?: string;
  description?: string;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  open,
  onOpenChange,
  onScanSuccess,
  scanType = 'barcode',
  title,
  description,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualInputMode, setManualInputMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  // Refs for video element and code reader
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('/Assets/sound/storescannerbeep.mp3');
    audioRef.current.volume = 0.5; // Set volume to 50%
  }, []);

  // Function to play scan sound
  const playScanSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.play().catch(error => {
        console.log('Audio play failed:', error);
      });
    }
  };

  // Start scanning when dialog opens
  useEffect(() => {
    if (open && !manualInputMode) {
      startScanning();
    }
  }, [open, manualInputMode]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    setScanError(null);
    setScannedCode(null);
    setManualInputMode(false);
    setManualCode('');
    setHasScanned(false);
    setIsScanning(true);

    try {
      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);

      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }

      // Initialize code reader
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      // Start scanning
      const videoElement = videoRef.current;
      if (videoElement) {
        const result = await codeReaderRef.current.decodeFromVideoDevice(
          selectedCamera || undefined,
          videoElement,
          (result, error) => {
            if (result && !hasScanned) {
              setScannedCode(result.getText());
              setIsScanning(false);

              // Stop the code reader to prevent multiple scans
              if (codeReaderRef.current) {
                codeReaderRef.current.reset();
              }

              // Play scan sound
              playScanSound();

              toast.success(`Scanned ${scanType}: ${result.getText()}`);
              setHasScanned(true);

              // Automatically close dialog and return the scanned code
              setTimeout(() => {
                onScanSuccess(result.getText());
                onOpenChange(false);
                setScannedCode(null);
                setHasScanned(false);
              }, 1000); // Small delay to show success message
            }
            if (error && error.name !== 'NotFoundException') {
              setScanError(error.message);
            }
          }
        );

        // Set timeout for scanning
        const timeout = setTimeout(() => {
          if (isScanning) {
            setScanError('Scanning timeout. Please try again or enter manually.');
            setIsScanning(false);
          }
        }, 30000); // 30 seconds timeout

        setScanTimeout(timeout);
      }
    } catch (error) {
      console.error('Scanning error:', error);
      setScanError('Failed to start camera. Please check camera permissions.');
      setIsScanning(false);
    }
  };

  const handleManualCodeSubmit = async () => {
    if (!manualCode.trim()) return;

    setScannedCode(manualCode);
    setManualInputMode(false);

    // Play scan sound
    playScanSound();

    toast.success(`Manual ${scanType}: ${manualCode}`);

    // Automatically close dialog and return the manual code
    setTimeout(() => {
      onScanSuccess(manualCode);
      onOpenChange(false);
      setScannedCode(null);
      setHasScanned(false);
    }, 1000); // Small delay to show success message
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    setIsScanning(false);
    setScanError(null);
  };

  const handleDone = () => {
    if (scannedCode) {
      onScanSuccess(scannedCode);
    }
    onOpenChange(false);
    setScannedCode(null);
    setHasScanned(false);
  };

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
    setScannedCode(null);
    setHasScanned(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {title || `Scanning ${scanType === 'barcode' ? 'Barcode' : 'QR Code'}`}
          </DialogTitle>
          <DialogDescription>
            {description ||
              `Point your camera at the ${scanType === 'barcode' ? 'barcode' : 'QR code'} to scan it.`}
          </DialogDescription>
        </DialogHeader>

        {/* Camera Selection */}
        {availableCameras.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium">Select Camera:</label>
            <Select value={selectedCamera} onValueChange={setSelectedCamera}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose camera" />
              </SelectTrigger>
              <SelectContent>
                {availableCameras.map((camera, index) => (
                  <SelectItem key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${index + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="py-6">
          {isScanning ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative w-full h-[300px] bg-black rounded-md overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>
                  </div>
                </div>
              </div>

              {scanError && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md">
                  {scanError}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setManualInputMode(true)}
                      className="text-xs"
                    >
                      📝 Enter Manually Instead
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-sm text-center text-muted-foreground">
                <p>
                  Position the {scanType === 'barcode' ? 'barcode' : 'QR code'} within the frame
                </p>
              </div>
            </div>
          ) : manualInputMode ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-full h-[200px] bg-blue-50 flex items-center justify-center rounded-md border-2 border-blue-200">
                <div className="flex flex-col items-center gap-2">
                  <ScanBarcode className="h-12 w-12 text-blue-500" />
                  <p className="text-sm text-blue-700 font-medium">Manual Input</p>
                  <p className="text-xs text-blue-600 text-center">
                    Enter the {scanType === 'barcode' ? 'barcode' : 'QR code'} manually
                  </p>
                </div>
              </div>

              <div className="w-full space-y-2">
                <Input
                  placeholder={`Enter ${scanType === 'barcode' ? 'barcode' : 'QR code'} number`}
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  className="text-center font-mono"
                />
                <Button
                  onClick={handleManualCodeSubmit}
                  disabled={!manualCode.trim()}
                  className="w-full"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Link Code to Product
                </Button>
              </div>
            </div>
          ) : scannedCode ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-full h-[200px] bg-green-50 flex items-center justify-center rounded-md border-2 border-green-200">
                <div className="flex flex-col items-center gap-2">
                  <Check className="h-12 w-12 text-green-500" />
                  <p className="text-sm text-green-700 font-medium">Scan Successful!</p>
                  <p className="text-xs text-green-600 font-mono bg-green-100 px-2 py-1 rounded">
                    {scannedCode}
                  </p>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Code has been linked to the product
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Initializing camera...</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isScanning}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
