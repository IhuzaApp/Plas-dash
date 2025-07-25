import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, Search, Plus } from 'lucide-react';
import { Product } from '@/hooks/useGraphql';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';

interface ProductSelectionCardProps {
  products: Product[];
  isLoading: boolean;
  onAddProductToCart: (product: Product) => void;
  onAddProductManually: () => void;
}

export const ProductSelectionCard: React.FC<ProductSelectionCardProps> = ({
  products,
  isLoading,
  onAddProductToCart,
  onAddProductManually,
}) => {
  const [productSearch, setProductSearch] = useState('');
  const { data: systemConfig } = useSystemConfig();

  const filteredProducts = products.filter(
    product =>
      product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.description?.toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.category as unknown as string)?.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={onAddProductManually}>Add Manually</Button>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3 border rounded-lg hover:bg-accent/20 cursor-pointer transition-colors"
                  onClick={() => onAddProductToCart(product)}
                >
                  <div className="flex flex-col space-y-2">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {(product.category as unknown as string) || 'No Category'} •{' '}
                        {product.measurement_unit || 'unit'}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrencyWithConfig(
                          parseFloat(product.final_price || product.price || '0'),
                          systemConfig
                        )}
                      </p>
                    </div>
                    <Button size="sm" className="w-full bg-black text-white hover:bg-gray-800">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>No products found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
