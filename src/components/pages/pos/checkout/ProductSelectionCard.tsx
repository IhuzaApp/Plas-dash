import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  ScanBarcode, 
  LayoutGrid, 
  List, 
  Tag, 
  ShieldCheck, 
  Warehouse,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Product } from '@/hooks/useGraphql';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';

interface ProductSelectionCardProps {
  products: Product[];
  isLoading: boolean;
  onAddProductToCart: (product: Product) => void;
  onAddProductManually: () => void;
  onScanProduct: () => void;
}

export const ProductSelectionCard: React.FC<ProductSelectionCardProps> = ({
  products,
  isLoading,
  onAddProductToCart,
  onAddProductManually,
  onScanProduct,
}) => {
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: systemConfig } = useSystemConfig();

  // Extract unique categories dynamically from products list
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return ['All', ...Array.from(new Set(cats))];
  }, [products]);

  // Filter products based on search term and category tag
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const name = product.ProductName?.name || '';
      const desc = product.ProductName?.description || '';
      const sku = product.ProductName?.sku || '';
      const barcode = product.ProductName?.barcode || '';
      const category = product.category || '';

      const matchesSearch =
        name.toLowerCase().includes(productSearch.toLowerCase()) ||
        desc.toLowerCase().includes(productSearch.toLowerCase()) ||
        sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        barcode.toLowerCase().includes(productSearch.toLowerCase()) ||
        category.toLowerCase().includes(productSearch.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, selectedCategory]);

  const renderProductDetails = (product: Product) => {
    const categoryLower = (product.category || '').toLowerCase();
    const isBakery = categoryLower.includes('bakery') || categoryLower.includes('bread') || categoryLower.includes('cake') || categoryLower.includes('pastry');
    const isElectronics = categoryLower.includes('electro') || categoryLower.includes('appliance') || categoryLower.includes('tech') || categoryLower.includes('phone') || categoryLower.includes('tv');
    const isFurniture = categoryLower.includes('furniture') || categoryLower.includes('interior') || categoryLower.includes('decor') || categoryLower.includes('home') || categoryLower.includes('chair') || categoryLower.includes('sofa');

    let specText = '';
    let specIcon = null;

    if (isElectronics) {
      specText = '1 Year Warranty';
      specIcon = <ShieldCheck className="h-3.5 w-3.5 text-blue-500 mr-1 inline-block" />;
    } else if (isFurniture) {
      specText = 'Interior / Decor Spec';
      specIcon = <Warehouse className="h-3.5 w-3.5 text-violet-500 mr-1 inline-block" />;
    } else if (isBakery) {
      specText = 'Freshly Baked';
      specIcon = <ShoppingBag className="h-3.5 w-3.5 text-amber-500 mr-1 inline-block" />;
    }

    return (
      <div className="flex flex-col gap-1 text-[11px] mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
        {/* Stock Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Inventory:</span>
          {product.quantity !== undefined ? (
            product.quantity <= 0 ? (
              <span className="font-bold text-red-500 flex items-center">
                <XCircle className="h-3 w-3 mr-0.5" /> Out of stock
              </span>
            ) : product.quantity <= 5 ? (
              <span className="font-bold text-amber-500 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-0.5" /> Low Stock ({product.quantity})
              </span>
            ) : (
              <span className="font-bold text-emerald-500 flex items-center">
                <CheckCircle className="h-3 w-3 mr-0.5" /> {product.quantity} available
              </span>
            )
          ) : (
            <span className="font-semibold text-slate-500">In Stock</span>
          )}
        </div>

        {/* Dynamic Vertical Specs */}
        {specText && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Class:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
              {specIcon}
              {specText}
            </span>
          </div>
        )}

        {/* Code representation */}
        {(product.ProductName?.sku || product.ProductName?.barcode) && (
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
            <span>SKU/Barcode:</span>
            <span className="font-mono truncate max-w-[100px]" title={product.ProductName.sku || product.ProductName.barcode}>
              {product.ProductName.sku || product.ProductName.barcode}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="lg:col-span-3 shadow-xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Products Catalogue
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select products to add to current checkout cart
            </p>
          </div>

          {/* Grid / Dense Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg self-start">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls block */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by name, SKU, barcode, category..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="pl-10 h-10 border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              type="button"
              variant="outline" 
              onClick={onScanProduct}
              className="h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold"
            >
              <ScanBarcode className="h-4 w-4 mr-2 text-primary" />
              Scan Barcode
            </Button>
            <Button 
              type="button"
              onClick={onAddProductManually}
              className="h-10 bg-primary hover:bg-primary/90 text-white font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Manually
            </Button>
          </div>
        </div>

        {/* Scrollable Categories List */}
        {categories.length > 1 && (
          <ScrollArea className="w-full whitespace-nowrap pb-2 border-b border-slate-100 dark:border-slate-900">
            <div className="flex space-x-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  {cat === 'All' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Products lists */}
        {isLoading ? (
          <div className="p-16 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="font-bold text-sm">Loading products catalogue...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <ScrollArea className="h-[620px] pr-2">
            {viewMode === 'grid' ? (
              /* Grid Layout Mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;
                  return (
                    <div
                      key={product.id}
                      className={`relative flex flex-col justify-between p-4 border rounded-xl bg-white dark:bg-slate-900 transition-all hover:shadow-lg group ${
                        isOutOfStock 
                          ? 'border-slate-100 dark:border-slate-900 opacity-60 pointer-events-none'
                          : 'border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary cursor-pointer'
                      }`}
                      onClick={() => !isOutOfStock && onAddProductToCart(product)}
                    >
                      <div>
                        {/* Image banner */}
                        {product.ProductName?.image ? (
                          <div className="relative w-full h-28 mb-3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950">
                            <img
                              src={product.ProductName.image}
                              alt={product.ProductName.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                            />
                            <Badge className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white border-none font-bold text-[9px] uppercase">
                              {product.category || 'Retail'}
                            </Badge>
                          </div>
                        ) : (
                          <div className="w-full h-12 mb-2 rounded-lg bg-slate-50 dark:bg-slate-950/55 flex items-center justify-between px-3 border border-slate-100 dark:border-slate-900">
                            <Badge className="bg-slate-900/80 backdrop-blur-sm text-white border-none font-bold text-[9px] uppercase">
                              {product.category || 'General'}
                            </Badge>
                          </div>
                        )}

                        <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                          {product.ProductName?.name || 'Unknown Product'}
                        </p>
                        {product.ProductName?.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {product.ProductName.description}
                          </p>
                        )}

                        {renderProductDetails(product)}
                      </div>

                      {/* Add button & price */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-sm font-black text-primary">
                          {formatCurrencyWithConfig(parseFloat(product.price || '0'), systemConfig)}
                        </span>
                        <Button 
                          type="button"
                          size="sm" 
                          disabled={isOutOfStock}
                          className="bg-primary text-white hover:bg-primary/90 font-bold text-xs px-2.5 h-8 gap-1 shadow-md shadow-primary/10"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Dense List Layout Mode */
              <div className="space-y-2">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-slate-900 hover:shadow-md transition-all group ${
                        isOutOfStock 
                          ? 'border-slate-100 dark:border-slate-900 opacity-60 pointer-events-none'
                          : 'border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary cursor-pointer'
                      }`}
                      onClick={() => !isOutOfStock && onAddProductToCart(product)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {product.ProductName?.image ? (
                          <img
                            src={product.ProductName.image}
                            alt={product.ProductName.name}
                            className="w-12 h-12 object-cover rounded-md bg-slate-100 dark:bg-slate-950 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-950 rounded-md flex items-center justify-center flex-shrink-0 text-slate-400">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-sm text-slate-850 dark:text-slate-100 truncate">
                              {product.ProductName?.name || 'Unknown Product'}
                            </p>
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-none font-bold text-[8px] uppercase py-0.5 px-1.5 h-4">
                              {product.category || 'Retail'}
                            </Badge>
                          </div>
                          
                          {/* Subtitles & specs in linear fashion */}
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            SKU/Barcode: <span className="font-mono text-slate-600 dark:text-slate-350">{product.ProductName?.sku || product.ProductName?.barcode || 'N/A'}</span>
                            {product.measurement_unit && ` • Unit: ${product.measurement_unit}`}
                          </p>
                        </div>
                      </div>

                      {/* Stock alerts & pricing info aligned to right */}
                      <div className="flex items-center space-x-6 pl-4">
                        <div className="text-right hidden sm:block">
                          {product.quantity !== undefined ? (
                            product.quantity <= 0 ? (
                              <span className="text-[10px] font-bold text-red-500">Out of Stock</span>
                            ) : product.quantity <= 5 ? (
                              <span className="text-[10px] font-bold text-amber-500">Low ({product.quantity})</span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-500">{product.quantity} units</span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400">Available</span>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800 dark:text-white">
                            {formatCurrencyWithConfig(parseFloat(product.price || '0'), systemConfig)}
                          </p>
                        </div>

                        <Button 
                          type="button"
                          size="sm" 
                          disabled={isOutOfStock}
                          className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-8"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="p-16 text-center text-muted-foreground border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <ShoppingBag className="mx-auto h-12 w-12 mb-3 text-slate-350 dark:text-slate-700" />
            <p className="font-bold text-sm">No products found matching your search</p>
            <p className="text-xs text-muted-foreground mt-1">Try refining your keyword query or changing category filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
