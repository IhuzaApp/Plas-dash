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

  // Returns a compact stock / promotion badge element for a product card
  const getStockBadge = (product: Product) => {
    const qty = product.quantity;
    const isPromo = !!(product as any).on_promotion || !!(product as any).promotion_price;

    if (qty !== undefined && qty <= 0) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide bg-red-500 text-white">
          <XCircle className="h-2.5 w-2.5" /> Out of Stock
        </span>
      );
    }
    if (qty !== undefined && qty <= 5) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide bg-amber-400 text-white">
          <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
        </span>
      );
    }
    if (isPromo) {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide bg-emerald-500 text-white">
          <Tag className="h-2.5 w-2.5" /> Promotion
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wide bg-emerald-500 text-white">
        <CheckCircle className="h-2.5 w-2.5" /> In Stock
      </span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                        {/* Image banner — shows image if available, falls back to SVG icon on null or load error */}
                        <div className="relative w-full h-28 mb-3 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                          {product.ProductName?.image ? (
                            <img
                              src={product.ProductName.image}
                              alt={product.ProductName.name}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                              onError={e => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          {/* SVG fallback — visible when image is null or broken */}
                          <div
                            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-600"
                            style={{ display: product.ProductName?.image ? 'none' : 'flex' }}
                          >
                            <ShoppingBag className="h-8 w-8 opacity-50" />
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-50">No Image</span>
                          </div>
                          {/* Category badge top-left */}
                          <Badge className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white border-none font-bold text-[9px] uppercase">
                            {product.category || 'Retail'}
                          </Badge>
                          {/* Stock badge bottom-right */}
                          <div className="absolute bottom-2 right-2">
                            {getStockBadge(product)}
                          </div>
                        </div>

                        <p className="font-extrabold text-xs text-slate-800 dark:text-slate-100 line-clamp-2">
                          {product.ProductName?.name || 'Unknown Product'}
                        </p>

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
                        {/* Product thumbnail — shows image, falls back to icon on null or error */}
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center flex-shrink-0 relative">
                          {product.ProductName?.image ? (
                            <img
                              src={product.ProductName.image}
                              alt={product.ProductName.name}
                              className="w-full h-full object-cover"
                              onError={e => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="absolute inset-0 flex items-center justify-center text-slate-400"
                            style={{ display: product.ProductName?.image ? 'none' : 'flex' }}
                          >
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        </div>
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
