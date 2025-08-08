import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScanBarcode, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutBarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductFound: (product: any) => void;
  products: any[];
  isLoading?: boolean;
}

const CheckoutBarcodeScanner: React.FC<CheckoutBarcodeScannerProps> = ({
  open,
  onOpenChange,
  onProductFound,
  products,
  isLoading = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualInputMode, setManualInputMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [hasScanned, setHasScanned] = useState(false);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-index products for faster search
  const productIndex = useMemo(() => {
    const index: { [key: string]: any } = {};
    const nameIndex: { [key: string]: any } = {};
    
    products.forEach(product => {
      if (product.ProductName?.sku) {
        index[product.ProductName.sku] = product;
      }
      if (product.ProductName?.barcode) {
        index[product.ProductName.barcode] = product;
      }
      if (product.ProductName?.name) {
        nameIndex[product.ProductName.name.toLowerCase()] = product;
      }
    });
    
    return { exact: index, names: nameIndex };
  }, [products]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/Assets/sound/storescannerbeep.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Play scan sound
  const playScanSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }
  };

  // Start scanning when dialog opens
  useEffect(() => {
    if (open && !isScanning) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        startScanning();
      }, 100);
      return () => clearTimeout(timer);
    } else if (!open) {
      stopScanning();
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (isLoading) return;

    try {
      setIsScanning(true);
      setScanError(null);
      setHasScanned(false);
      setManualInputMode(false);

      codeReaderRef.current = new BrowserMultiFormatReader();

      // Get available video devices
      const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();
      setAvailableCameras(videoInputDevices);

      if (videoInputDevices.length === 0) {
        throw new Error('No cameras found');
      }

      // Use first camera by default
      const deviceId = selectedCamera || videoInputDevices[0].deviceId;
      setSelectedCamera(deviceId);

      // Start scanning with optimized settings
      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result: Result | null, error: any) => {
          if (result && !hasScanned) {
            setHasScanned(true);
            playScanSound();
            
            const scannedCode = result.getText();
            handleScannedCode(scannedCode);
            
            // Auto-close after successful scan (reduced from 1000ms to 500ms)
            setTimeout(() => {
              onOpenChange(false);
            }, 500);
          }
        }
      );

      // Reduced timeout from 30 seconds to 10 seconds
      const timeout = setTimeout(() => {
        if (!hasScanned) {
          setScanError('No code detected. Please try again or use manual input.');
          setManualInputMode(true);
        }
      }, 10000); // 10 seconds timeout

      setScanTimeout(timeout);

    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanError('Camera access denied. Please use manual input.');
      setManualInputMode(true);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    setIsScanning(false);
    setHasScanned(false);
    setScanError(null);
  };

  const handleScannedCode = (code: string) => {
    if (!code.trim()) return;

    // Optimized product search - check exact matches first for speed
    const trimmedCode = code.trim();
    
    // First, try exact matches (fastest)
    let foundProduct = productIndex.exact[trimmedCode];

    // If no exact match, try case-insensitive name search (slower)
    if (!foundProduct) {
      foundProduct = productIndex.names[trimmedCode.toLowerCase()];
    }

    if (foundProduct) {
      onProductFound(foundProduct);
      toast.success(`${foundProduct.ProductName?.name} added to cart`);
    } else {
      toast.error('Product not found');
    }
  };

  const handleManualCodeSubmit = () => {
    if (manualCode.trim()) {
      playScanSound();
      handleScannedCode(manualCode.trim());
      setManualCode('');
      
      // Auto-close after manual input (reduced from 1000ms to 300ms)
      setTimeout(() => {
        onOpenChange(false);
      }, 300);
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" />
            Scan Product
          </DialogTitle>
          <DialogDescription>
            Scan a barcode or QR code to add product to cart
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Selection */}
          {availableCameras.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Camera</label>
              <select
                value={selectedCamera}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {availableCameras.map((camera) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Video Feed */}
          {!manualInputMode && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
              />
              <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-blue-500"></div>
                <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-blue-500"></div>
                <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-blue-500"></div>
                <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-blue-500"></div>
              </div>
              
              {/* Scanning Status */}
              <div className="absolute top-2 right-2">
                {isScanning && !hasScanned && (
                  <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Scanning...
                  </div>
                )}
                {hasScanned && (
                  <div className="flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    Found!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Input */}
          {manualInputMode && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Enter barcode or SKU manually</p>
                <Input
                  placeholder="Enter product code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="text-center text-lg h-12"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualCodeSubmit();
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleManualCodeSubmit}
                  disabled={!manualCode.trim()}
                  className="flex-1"
                >
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setManualInputMode(false);
                    setManualCode('');
                    startScanning();
                  }}
                >
                  Use Camera
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {scanError && !manualInputMode && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{scanError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManualInputMode(true)}
                className="mt-2"
              >
                Use Manual Input
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          )}

          {/* Action Buttons */}
          {!manualInputMode && !isLoading && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setManualInputMode(true)}
                className="flex-1"
              >
                Manual Input
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  stopScanning();
                  startScanning();
                }}
                className="flex-1"
              >
                Restart Scanner
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutBarcodeScanner; 