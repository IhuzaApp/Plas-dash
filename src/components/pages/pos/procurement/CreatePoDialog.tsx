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

export function CreatePoDialog({ children }: { children: React.ReactNode }) {
    const { data: systemConfig } = useSystemConfig();
    const currency = systemConfig?.currency || '$';

    const [open, setOpen] = useState(false);
    const [supplierId, setSupplierId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [taxPercentage, setTaxPercentage] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ productId: '', quantity: 1, unitCost: 0 }]);

    // Filter products based on selected supplier
    const availableProducts = useMemo(() => {
        if (!supplierId) return [];
        return DUMMY_PRODUCTS.filter(p => p.supplierId === supplierId);
    }, [supplierId]);

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, unitCost: 0 }]);
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
                unitCost: product ? product.unitPrice : 0,
                quantity: product && newItems[index].quantity < product.minOrderQuantity ? product.minOrderQuantity : newItems[index].quantity
            };
        } else {
            newItems[index] = { ...newItems[index], [field]: value };
        }

        setItems(newItems);
    };

    const calculation = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
        const discountAmount = discount || 0;
        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
        const taxAmount = subtotalAfterDiscount * ((taxPercentage || 0) / 100);
        const total = subtotalAfterDiscount + taxAmount;

        return { subtotal, discountAmount, taxAmount, total };
    }, [items, discount, taxPercentage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Console log mock submission
        console.log({
            supplierId, expectedDate, paymentTerms, taxPercentage, discount, notes, items,
            totalAmount: calculation.total
        });
        setOpen(false);
        // Reset state
        setSupplierId('');
        setExpectedDate('');
        setPaymentTerms('');
        setTaxPercentage(0);
        setDiscount(0);
        setNotes('');
        setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                        Generate a new PO for stock replenishment.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Supplier</Label>
                            <Select
                                value={supplierId}
                                onValueChange={(val) => {
                                    setSupplierId(val);
                                    // Set default payment terms based on supplier
                                    const supplier = DUMMY_SUPPLIERS.find(s => s.id === val);
                                    if (supplier) setPaymentTerms(supplier.paymentTerms || '');
                                    // Reset items list
                                    setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
                                }}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select supplier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {DUMMY_SUPPLIERS.filter(s => s.status === 'Active').map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expectedDate">Expected Delivery</Label>
                            <Input
                                id="expectedDate"
                                type="date"
                                required
                                value={expectedDate}
                                onChange={(e) => setExpectedDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paymentTerms">Payment Terms</Label>
                            <Select value={paymentTerms} onValueChange={setPaymentTerms} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select terms..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash on Delivery</SelectItem>
                                    <SelectItem value="30 Days">Net 30 Days</SelectItem>
                                    <SelectItem value="60 Days">Net 60 Days</SelectItem>
                                    <SelectItem value="Custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Products Ordered</Label>
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
                                Please select a supplier first to view available products.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => {
                                    const selectedProduct = availableProducts.find(p => p.id === item.productId);
                                    return (
                                        <div key={index} className="flex items-start gap-3 p-3 border rounded-md bg-muted/20">
                                            <div className="grid grid-cols-12 gap-3 flex-1">
                                                <div className="col-span-12 sm:col-span-5 space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Product</Label>
                                                    <Select
                                                        value={item.productId}
                                                        onValueChange={(val) => handleItemChange(index, 'productId', val)}
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select product" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableProducts.map((product) => (
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
                                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </div>

                                                <div className="col-span-4 sm:col-span-2 space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Unit Cost</Label>
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
                                                            value={item.unitCost || ''}
                                                            onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-4 sm:col-span-3 space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Subtotal</Label>
                                                    <div className="h-9 flex items-center justify-end font-medium px-3 bg-muted/50 rounded-md border border-transparent">
                                                        {currency}{(item.quantity * item.unitCost).toFixed(2)}
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
                            <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Global Modifiers */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="taxPercentage" className="text-xs">Tax Percentage (%)</Label>
                                            <Input
                                                id="taxPercentage"
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={taxPercentage || ''}
                                                onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="discount" className="text-xs">Discount Amount ({currency})</Label>
                                            <Input
                                                id="discount"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={discount || ''}
                                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-xs">Internal Notes</Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Optional delivery instructions..."
                                            className="resize-none"
                                            rows={2}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Cost Summary Summary */}
                                <div className="bg-muted/30 p-4 rounded-md space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Subtotal:</span>
                                        <span>{currency}{calculation.subtotal.toFixed(2)}</span>
                                    </div>
                                    {calculation.discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-sm text-rose-600">
                                            <span>Discount:</span>
                                            <span>-{currency}{calculation.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Tax ({taxPercentage}%):</span>
                                        <span>{currency}{calculation.taxAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-border my-2" />
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Total:</span>
                                        <span className="text-primary">{currency}{calculation.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!supplierId || items.some(i => !i.productId || i.quantity <= 0)}>
                            Confirm Order
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
