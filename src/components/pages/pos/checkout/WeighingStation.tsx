import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  Scale, 
  Search, 
  Printer, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  UtensilsCrossed,
  Beef,
  Apple
} from 'lucide-react';
import { Product } from '@/hooks/useGraphql';

interface WeighingStationProps {
  products: Product[];
  shopId: string;
  shopName?: string;
}

interface WeighedItemHistory {
  code: string;
  productId: string;
  productName: string;
  price: number;
  weight: number;
  totalPrice: number;
  timestamp: string;
  status: 'pending' | 'redeemed';
}

const CODE39_PATTERNS: Record<string, string> = {
  '0': '111221211',
  '1': '211211112',
  '2': '112211112',
  '3': '212211111',
  '4': '111221112',
  '5': '211221111',
  '6': '112221111',
  '7': '111211212',
  '8': '211211211',
  '9': '112211211',
  '*': '112121211',
};

// Generates Code 39 barcode SVG
export const generateBarcodeSVG = (code: string) => {
  const formattedCode = `*${code}*`;
  let svgContent = '';
  let x = 10;
  const narrowWidth = 2;
  const wideWidth = 5;
  const height = 45;

  for (let c = 0; c < formattedCode.length; c++) {
    const char = formattedCode[c];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['*'];

    for (let i = 0; i < pattern.length; i++) {
      const barWidth = pattern[i] === '2' ? wideWidth : narrowWidth;
      const isBlack = i % 2 === 0;

      if (isBlack) {
        svgContent += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="black" />`;
      }
      x += barWidth;
    }
    x += narrowWidth; // Inter-character gap
  }

  return `
    <svg width="${x + 10}" height="${height + 15}" xmlns="http://www.w3.org/2000/svg" style="background: white; padding: 2px;">
      ${svgContent}
      <text x="${x / 2 + 5}" y="${height + 12}" font-family="monospace" font-size="10" text-anchor="middle" fill="black">${code}</text>
    </svg>
  `;
};

export const WeighingStation: React.FC<WeighingStationProps> = ({
  products,
  shopId,
  shopName = 'Supermarket'
}) => {
  const { toast } = useToast();
  const { data: systemConfig } = useSystemConfig();

  // State Variables
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [weightInput, setWeightInput] = useState('0.000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [recentCodes, setRecentCodes] = useState<WeighedItemHistory[]>([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [numpadBuffer, setNumpadBuffer] = useState('');

  // Filter unique categories
  const categories = useMemo(() => {
    const cats = products
      .map(p => p.category)
      .filter((cat): cat is string => Boolean(cat));
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  // Filter products by category, search query, and check for weight-based unit
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = product.ProductName?.name || '';
      const sku = product.ProductName?.sku || '';
      const category = product.category || '';
      const unit = (product.measurement_unit || '').toLowerCase();

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' || category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Load history from localStorage and set up real-time listener for code statuses
  useEffect(() => {
    const loadHistory = () => {
      const stored = localStorage.getItem(`weighed_history_${shopId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as WeighedItemHistory[];
          setRecentCodes(parsed);
        } catch (e) {
          console.error('Failed to parse history:', e);
        }
      }
    };
    loadHistory();
  }, [shopId]);

  // Real-time Firestore sync of the status of generated codes in history
  useEffect(() => {
    if (recentCodes.length === 0) return;

    // Listen to changes for each code in the recent list
    const unsubscribes = recentCodes.map(item => {
      const docRef = doc(db, 'weighed_items', shopId, 'items', item.code);
      return onSnapshot(docRef, (snapshot) => {
        if (!snapshot.exists()) {
          // If deleted (redeemed and removed from Firestore), update status to redeemed
          setRecentCodes(prev =>
            prev.map(c => c.code === item.code ? { ...c, status: 'redeemed' as const } : c)
          );
        } else {
          const data = snapshot.data();
          if (data && data.status !== item.status) {
            setRecentCodes(prev =>
              prev.map(c => c.code === item.code ? { ...c, status: data.status } : c)
            );
          }
        }
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [recentCodes.length, shopId]);

  // Save history to localStorage
  const saveHistory = (updatedHistory: WeighedItemHistory[]) => {
    localStorage.setItem(`weighed_history_${shopId}`, JSON.stringify(updatedHistory));
    setRecentCodes(updatedHistory);
  };

  // Generate Unique 6-digit Scale Code
  const generateUniqueCode = async (): Promise<string> => {
    let attempts = 0;
    while (attempts < 15) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const docRef = doc(db, 'weighed_items', shopId, 'items', code);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return code;
      }
      attempts++;
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Handle generating scale code
  const handleGenerateLabel = async () => {
    if (!selectedProduct) {
      toast({
        title: 'Error',
        description: 'Please select a product first.',
        variant: 'destructive',
      });
      return;
    }

    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: 'Invalid weight',
        description: 'Please enter a valid weight greater than 0 kg.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const code = await generateUniqueCode();
      const pricePerKg = parseFloat(selectedProduct.price || '0');
      const totalPrice = pricePerKg * weight;
      const timestamp = new Date().toISOString();

      const docData = {
        code,
        productId: selectedProduct.id,
        productName: selectedProduct.ProductName?.name || 'Unknown Item',
        price: pricePerKg,
        weight,
        totalPrice,
        measurementUnit: selectedProduct.measurement_unit || 'kg',
        timestamp,
        status: 'pending' as const,
        shopId,
        image: selectedProduct.ProductName?.image || '',
      };

      // Save to Firestore: weighed_items/{shopId}/items/{code}
      const docRef = doc(db, 'weighed_items', shopId, 'items', code);
      await setDoc(docRef, docData);

      // Play Beep Sound for print simulation
      try {
        const audio = new Audio('/Assets/sound/storescannerbeep.mp3');
        audio.play().catch(() => {});
      } catch (e) {}

      // Save in history (max 10 items)
      const newHistoryItem: WeighedItemHistory = {
        code,
        productId: selectedProduct.id,
        productName: docData.productName,
        price: pricePerKg,
        weight,
        totalPrice,
        timestamp,
        status: 'pending',
      };

      const updatedHistory = [newHistoryItem, ...recentCodes.slice(0, 9)];
      saveHistory(updatedHistory);

      setGeneratedCode(code);
      setShowSuccessDialog(true);

      toast({
        title: 'Scale Label Generated',
        description: `Code ${code} generated successfully for ${docData.productName}.`,
      });
    } catch (error) {
      console.error('Failed to generate scale label:', error);
      toast({
        title: 'Generation Failed',
        description: 'An error occurred while generating the code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Presets and Adjusters
  const adjustWeight = (amount: number) => {
    const current = parseFloat(weightInput) || 0;
    setWeightInput(Math.max(0, current + amount).toFixed(3));
  };

  const setWeightPreset = (preset: number) => {
    setWeightInput(preset.toFixed(3));
  };

  // Helper for Category Icons
  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('bakery') || lower.includes('bread') || lower.includes('pastry')) {
      return <UtensilsCrossed className="h-3 w-3" />;
    }
    if (lower.includes('meat') || lower.includes('butcher') || lower.includes('beef') || lower.includes('chicken')) {
      return <Beef className="h-3 w-3" />;
    }
    if (lower.includes('produce') || lower.includes('vegetable') || lower.includes('fruit') || lower.includes('veg')) {
      return <Apple className="h-3 w-3" />;
    }
    return <ShoppingBag className="h-3 w-3" />;
  };

  // Thermal Label Print — barcode + code only
  const printScaleLabel = (item: WeighedItemHistory) => {
    const barcodeSVG = generateBarcodeSVG(item.code);
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scale Label - ${item.code}</title>
        <style>
          @page { size: 58mm 25mm; margin: 0; }
          body {
            margin: 0;
            padding: 4px 6px;
            width: 58mm;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .barcode-wrap { display: flex; justify-content: center; }
        </style>
      </head>
      <body>
        <div class="barcode-wrap">
          ${barcodeSVG}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=300,height=180');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  // Numpad helpers
  const numpadPress = (key: string) => {
    if (key === 'backspace') {
      setNumpadBuffer(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setNumpadBuffer('');
    } else if (key === '.') {
      if (!numpadBuffer.includes('.')) setNumpadBuffer(prev => prev + '.');
    } else {
      // Limit to reasonable length
      if (numpadBuffer.length < 7) setNumpadBuffer(prev => prev + key);
    }
  };

  const numpadConfirm = () => {
    const val = parseFloat(numpadBuffer);
    if (!isNaN(val) && val > 0) {
      setWeightInput(val.toFixed(3));
    }
    setShowNumpad(false);
    setNumpadBuffer('');
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    // Reset weight when product is changed to avoid mistakes
    setWeightInput('0.000');
  };

  const pricePerKg = selectedProduct ? parseFloat(selectedProduct.price || '0') : 0;
  const currentWeight = parseFloat(weightInput) || 0;
  const calculatedTotal = pricePerKg * currentWeight;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Left: Product Selector */}
      <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg flex flex-col h-[740px]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-extrabold flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Weighing Station Catalogue
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Select a product to weigh from the departments below
              </p>
            </div>
            <button
              type="button"
              disabled={!selectedProduct}
              onClick={() => {
                setNumpadBuffer(weightInput !== '0.000' ? weightInput : '');
                setShowNumpad(true);
              }}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-extrabold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              title="Open numeric keyboard to enter weight"
            >
              <span className="text-base leading-none">⌨</span>
              <span className="leading-tight text-left">
                Enter<br />
                <span className="text-[10px] font-bold opacity-80">Weight (kg)</span>
              </span>
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search bakery, meat, vegetables..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            />
          </div>

          {/* Categories Tab Row */}
          {categories.length > 1 && (
            <ScrollArea className="w-full whitespace-nowrap pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex space-x-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                    {cat === 'All' ? 'All Sections' : cat}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Products Grid */}
          <ScrollArea className="flex-1 pr-2">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts.map(product => {
                  const isSelected = selectedProduct?.id === product.id;
                  const isKg = (product.measurement_unit || '').toLowerCase().includes('kg');
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all hover:shadow-md flex flex-col justify-between h-32 ${
                        isSelected
                          ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md ring-1 ring-primary'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-350 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 line-clamp-2">
                            {product.ProductName?.name || 'Unknown Item'}
                          </p>
                          {isKg ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/25 border-none font-bold text-[8px] px-1 shrink-0 h-4">
                              KG Unit
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border-none font-bold text-[8px] px-1 shrink-0 h-4">
                              {product.measurement_unit || 'Unit'}
                            </Badge>
                          )}
                        </div>
                        {product.ProductName?.sku && (
                          <p className="text-[9px] font-mono text-slate-400 mt-1">
                            SKU: {product.ProductName.sku}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-2">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Price / {product.measurement_unit || 'kg'}</span>
                        <span className="font-black text-xs text-primary">
                          {formatCurrencyWithConfig(parseFloat(product.price || '0'), systemConfig)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400">
                <ShoppingBag className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p className="font-bold text-sm">No weighable products found</p>
                <p className="text-xs text-muted-foreground mt-0.5">Try refining your department filters or search query</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: Scale Panel & Label Generator */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-[740px]">
        
        {/* Weighing Scale simulator */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg flex-1 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="h-4 w-4" />
              Weight Simulator Panel
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Product Info Indicator */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider mb-1">
                  Weighing Target Item
                </span>
                {selectedProduct ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                        {selectedProduct.ProductName?.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Base Price: {formatCurrencyWithConfig(pricePerKg, systemConfig)} / {selectedProduct.measurement_unit || 'kg'}
                      </p>
                    </div>
                    {selectedProduct.ProductName?.image && (
                      <img
                        src={selectedProduct.ProductName.image}
                        alt="Product"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-850"
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-xs font-semibold text-slate-400 py-1.5 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    Please select a product from the catalogue first
                  </div>
                )}
              </div>

              {/* Digital LED Screen display */}
              <div className="bg-slate-950 text-emerald-400 font-mono text-5xl py-6 px-4 rounded-xl border border-slate-800 text-center shadow-inner tracking-widest relative overflow-hidden">
                <div className="absolute top-2 left-3 text-[9px] text-emerald-600 uppercase font-bold font-sans">
                  Digital Scale Ready
                </div>
                <div className="absolute top-2 right-3 text-[9px] text-emerald-600 uppercase font-bold font-sans">
                  NET WEIGHT
                </div>
                {currentWeight.toFixed(3)}{' '}
                <span className="text-2xl text-emerald-600 font-sans">kg</span>
              </div>

              {/* Simulation weight inputs */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Adjust Weight (Simulator slider)</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {currentWeight.toFixed(3)} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="0.000"
                  max="10.000"
                  step="0.005"
                  value={weightInput}
                  disabled={!selectedProduct}
                  onChange={e => setWeightInput(e.target.value)}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                />

                {/* Preset weight selectors */}
                <div className="grid grid-cols-5 gap-1.5">
                  {[0.25, 0.5, 1.0, 1.5, 2.5].map(preset => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!selectedProduct}
                      onClick={() => setWeightPreset(preset)}
                      className="text-[10px] font-bold py-1 h-7 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      {preset.toFixed(2)} kg
                    </Button>
                  ))}
                </div>

                {/* Manual incremental buttons and input */}
                <div className="flex gap-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selectedProduct}
                    onClick={() => adjustWeight(-0.1)}
                    className="h-8 text-[11px] font-bold"
                  >
                    -100g
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!selectedProduct}
                    onClick={() => adjustWeight(0.1)}
                    className="h-8 text-[11px] font-bold"
                  >
                    +100g
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      disabled={!selectedProduct}
                      value={weightInput}
                      onChange={e => setWeightInput(e.target.value)}
                      className="h-8 text-xs text-center font-bold font-mono pl-4 pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={!selectedProduct}
                    onClick={() => setWeightInput('0.000')}
                    className="h-8 w-8 hover:bg-slate-50 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700"
                    title="Reset Scale"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!selectedProduct}
                    onClick={() => {
                      setNumpadBuffer(weightInput !== '0.000' ? weightInput : '');
                      setShowNumpad(true);
                    }}
                    className="h-8 px-2 text-[10px] font-bold border-primary/40 text-primary hover:bg-primary/5 whitespace-nowrap"
                    title="Open numeric keyboard"
                  >
                    ⌨ Enter Weight
                  </Button>
                </div>
              </div>
            </div>

            {/* Calculations & Submit button */}
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-900 pt-4 mt-auto">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Calculated Scale Price</span>
                <span className="text-lg font-black text-primary">
                  {formatCurrencyWithConfig(calculatedTotal, systemConfig)}
                </span>
              </div>
              <Button
                type="button"
                onClick={handleGenerateLabel}
                disabled={!selectedProduct || currentWeight <= 0 || isGenerating}
                className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold h-11 flex items-center justify-center gap-2 shadow-md shadow-primary/10"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Syncing Firestore...
                  </span>
                ) : (
                  <>
                    <Printer className="h-4 w-4" />
                    Generate Scale Label
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* History of generated labels */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-md h-[250px] flex flex-col">
          <CardHeader className="py-2.5 border-b border-slate-100 dark:border-slate-900 shrink-0">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Scale Session History (Today)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            <ScrollArea className="h-[190px] pr-2">
              <div className="space-y-2">
                {recentCodes.map(item => (
                  <div
                    key={item.code}
                    className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 hover:shadow-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-slate-800 dark:text-white">
                          #{item.code}
                        </span>
                        <Badge className={`text-[8px] font-bold border-none py-0 px-1.5 h-4 flex items-center ${
                          item.status === 'pending'
                            ? 'bg-emerald-500/10 text-emerald-500 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {item.status === 'pending' ? 'Active' : 'Redeemed'}
                        </Badge>
                      </div>
                      <h5 className="font-bold text-[10px] text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                        {item.productName}
                      </h5>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {item.weight.toFixed(3)} kg • {formatCurrencyWithConfig(item.totalPrice, systemConfig)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => printScaleLabel(item)}
                      className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                      title="Reprint Scale Label"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {recentCodes.length === 0 && (
                  <div className="text-center py-8 text-[11px] text-slate-400">
                    No barcodes generated at this scale station yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Numeric Keypad Modal for touchscreen weight entry */}
      {showNumpad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 pb-4">
              <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200 text-center mb-1 uppercase tracking-wider">
                Enter Weight (kg)
              </h3>

              {/* Weight display */}
              <div className="bg-slate-950 text-emerald-400 font-mono text-4xl py-5 px-4 rounded-xl text-center tracking-widest mb-4 border border-slate-800 relative">
                <span className="absolute top-2 left-3 text-[9px] text-emerald-700 font-bold uppercase font-sans">KG</span>
                {numpadBuffer || '0'}
              </div>

              {/* Numpad grid */}
              <div className="grid grid-cols-3 gap-2">
                {['7','8','9','4','5','6','1','2','3'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => numpadPress(k)}
                    className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  >
                    {k}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => numpadPress('.')}
                  className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => numpadPress('0')}
                  className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => numpadPress('backspace')}
                  className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-base font-bold hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  ⌫
                </button>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => { setShowNumpad(false); setNumpadBuffer(''); }}
                  className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={numpadConfirm}
                  disabled={!numpadBuffer || numpadBuffer === '.' || parseFloat(numpadBuffer) <= 0}
                  className="h-11 rounded-xl bg-primary text-white font-extrabold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  ✓ Enter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog showing the generated scale code */}
      {showSuccessDialog && generatedCode && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="pb-3 text-center border-b border-slate-100 dark:border-slate-900">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 mb-2">
                <CheckCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-black text-slate-850 dark:text-slate-100">
                Weighing Registered!
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                The item has been weighed and synced to POS terminals.
              </p>
            </CardHeader>
            <CardContent className="p-6 space-y-5 text-center">
              
              {/* Product recap */}
              <div className="text-center">
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase">
                  {selectedProduct.ProductName?.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  {currentWeight.toFixed(3)} kg @ {formatCurrencyWithConfig(pricePerKg, systemConfig)}/kg
                </p>
                <p className="text-sm font-black text-primary mt-1">
                  Total: {formatCurrencyWithConfig(calculatedTotal, systemConfig)}
                </p>
              </div>

              {/* Big Digital Code display */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-150 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Scale Code (Redemption Digits)
                </span>
                <div className="font-mono text-4xl font-black text-slate-900 dark:text-white tracking-widest select-all">
                  {generatedCode}
                </div>
                
                {/* Simulated Barcode */}
                <div className="flex justify-center pt-2">
                  <div dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(generatedCode) }} />
                </div>
              </div>

              {/* Info note */}
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Sticker label can be scanned or code can be typed manually at checkout. Scale codes are reusable once checkout transaction is completed.
              </p>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const item = recentCodes.find(c => c.code === generatedCode);
                    if (item) printScaleLabel(item);
                  }}
                  className="font-bold text-xs h-9 gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5 text-primary" />
                  Print Label
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowSuccessDialog(false);
                    // Clear scale for next item
                    setSelectedProduct(null);
                    setWeightInput('0.000');
                  }}
                  className="bg-primary text-white hover:bg-primary/90 font-bold text-xs h-9 flex items-center justify-center gap-1"
                >
                  Done
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
