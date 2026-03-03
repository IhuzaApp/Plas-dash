import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSearchProductNames, useAddProductName } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ProductName {
  id: string;
  name: string;
  description: string;
  barcode?: string;
  sku?: string;
  image: string;
  create_at: string;
}

interface ProductNameAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  onProductSelect?: (product: ProductName) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ProductNameAutocomplete: React.FC<ProductNameAutocompleteProps> = ({
  value,
  onValueChange,
  onProductSelect,
  placeholder = 'Search or add product name...',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDescription, setNewProductDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults, isLoading: isSearching } = useSearchProductNames(searchTerm);
  const addProductNameMutation = useAddProductName();

  // Update search term when value changes
  useEffect(() => {
    if (value && !open) {
      setSearchTerm(value);
    }
  }, [value, open]);

  const handleSelect = (selectedValue: string) => {
    const selectedProduct = searchResults?.productNames.find(
      product => product.id === selectedValue
    );

    if (selectedProduct) {
      onValueChange(selectedProduct.name);
      onProductSelect?.(selectedProduct);
      setOpen(false);
      setSearchTerm(selectedProduct.name);
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProductName.trim()) {
      toast.error('Product name is required');
      return;
    }

    setIsAddingNew(true);
    try {
      const result = await addProductNameMutation.mutateAsync({
        name: newProductName.trim(),
        description: newProductDescription.trim() || undefined,
        barcode: undefined,
        sku: undefined,
        image: '',
      });

      if (result.insert_productNames_one) {
        const newProduct = result.insert_productNames_one;
        onValueChange(newProduct.name);
        onProductSelect?.(newProduct);
        setOpen(false);
        setSearchTerm(newProduct.name);
        toast.success('Product name added successfully!');

        // Reset form
        setNewProductName('');
        setNewProductDescription('');
      }
    } catch (error) {
      console.error('Error adding product name:', error);
      toast.error('Failed to add product name');
    } finally {
      setIsAddingNew(false);
    }
  };

  const handleInputChange = (inputValue: string) => {
    setSearchTerm(inputValue);
    onValueChange(inputValue);

    // If input is empty, close the popover
    if (!inputValue.trim()) {
      setOpen(false);
    } else if (!open) {
      setOpen(true);
    }
  };

  // Filter products based on search term
  const filteredProducts = React.useMemo(() => {
    if (!searchResults?.productNames) return [];

    return searchResults.productNames.filter(
      product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description &&
          product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchResults?.productNames, searchTerm]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={searchTerm}
            onChange={e => handleInputChange(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {isSearching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          )}
          {!isSearching && filteredProducts.length === 0 && searchTerm.length > 0 && (
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-2">No product found. Add a new one:</p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Product name"
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewProduct();
                    }
                  }}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newProductDescription}
                  onChange={e => setNewProductDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleAddNewProduct}
                  disabled={isAddingNew || !newProductName.trim()}
                  size="sm"
                  className="w-full"
                >
                  {isAddingNew ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add &quot;{newProductName}&quot;
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {!isSearching && filteredProducts.length > 0 && (
            <div className="py-1">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleSelect(product.id)}
                  className="flex items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === product.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    {product.description && (
                      <span className="text-xs text-muted-foreground">{product.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProductNameAutocomplete;
