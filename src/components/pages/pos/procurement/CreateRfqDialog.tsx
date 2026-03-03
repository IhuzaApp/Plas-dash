'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { DUMMY_SUPPLIERS, DUMMY_PRODUCTS } from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export function CreateRfqDialog({ children }: { children: React.ReactNode }) {
  const { data: systemConfig } = useSystemConfig();
  const currency = systemConfig?.currency || '$';

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, proposedPrice: 0 }]);

  // Only show products from the selected supplier
  const availableProducts = useMemo(() => {
    if (!supplierId) return [];
    return DUMMY_PRODUCTS.filter(p => p.supplierId === supplierId);
  }, [supplierId]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1, proposedPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];

    if (field === 'productId') {
      const product = availableProducts.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        proposedPrice: product ? product.unitPrice : 0,
        // Automatically set quantity to min order if it's currently 1 and min order is higher
        quantity:
          product && newItems[index].quantity < product.minOrderQuantity
            ? product.minOrderQuantity
            : newItems[index].quantity,
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setItems(newItems);
  };

  const totalEstimatedCost = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.proposedPrice, 0);
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, save to DB here
    console.log({ supplierId, expiryDate, notes, items, totalEstimatedCost });
    setOpen(false);
    // Reset form
    setSupplierId('');
    setExpiryDate('');
    setNotes('');
    setItems([{ productId: '', quantity: 1, proposedPrice: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Request for Quotation</DialogTitle>
          <DialogDescription>
            Draft a new RFQ and send it to your supplier for pricing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={supplierId}
                onValueChange={val => {
                  setSupplierId(val);
                  // Reset items when supplier changes since products are supplier-specific
                  setItems([{ productId: '', quantity: 1, proposedPrice: 0 }]);
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                  {DUMMY_SUPPLIERS.filter(s => s.status === 'Active').map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Valid Until</Label>
              <Input
                id="expiry"
                type="date"
                required
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Products</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={!supplierId}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Row
              </Button>
            </div>

            {!supplierId ? (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md text-center">
                Please select a supplier first to view their products.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const selectedProduct = availableProducts.find(p => p.id === item.productId);
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 border rounded-md bg-muted/20"
                    >
                      <div className="grid grid-cols-12 gap-3 flex-1">
                        <div className="col-span-12 sm:col-span-5 space-y-1">
                          <Label className="text-xs text-muted-foreground">Product</Label>
                          <Select
                            value={item.productId}
                            onValueChange={val => handleItemChange(index, 'productId', val)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.stockUnit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedProduct && (
                            <div className="text-[10px] text-muted-foreground">
                              Min Order: {selectedProduct.minOrderQuantity}
                            </div>
                          )}
                        </div>

                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <Label className="text-xs text-muted-foreground">Quantity</Label>
                          <Input
                            type="number"
                            min={selectedProduct ? selectedProduct.minOrderQuantity : 1}
                            required
                            value={item.quantity || ''}
                            onChange={e =>
                              handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2 space-y-1">
                          <Label className="text-xs text-muted-foreground">Target Price</Label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                              {currency}
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-6"
                              required
                              value={item.proposedPrice || ''}
                              onChange={e =>
                                handleItemChange(
                                  index,
                                  'proposedPrice',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="col-span-4 sm:col-span-3 space-y-1">
                          <Label className="text-xs text-muted-foreground">Subtotal</Label>
                          <div className="h-9 flex items-center font-medium px-3 bg-muted/50 rounded-md border border-transparent">
                            {currency}
                            {(item.quantity * item.proposedPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 shrink-0 mt-5"
                        onClick={() => handleRemoveItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {supplierId && (
              <div className="flex justify-end pt-2 pr-12">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                  <p className="text-xl font-bold">
                    {currency}
                    {totalEstimatedCost.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Requirements</Label>
            <Textarea
              id="notes"
              placeholder="Add any specific requirements, delivery instructions, or terms..."
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!supplierId || items.some(i => !i.productId || i.quantity <= 0)}
            >
              Send RFQ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
