import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Delete } from 'lucide-react';

interface DialPadProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onConfirm: () => void;
}

const DialPad: React.FC<DialPadProps> = ({ onInput, onClear, onConfirm }) => {
  const buttons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map(btn => (
        <Button
          key={btn}
          variant="outline"
          className="h-16 text-xl rounded-lg"
          onClick={() => onInput(btn)}
        >
          {btn}
        </Button>
      ))}
      <Button variant="outline" className="h-16 rounded-lg" onClick={onClear}>
        <Delete className="h-6 w-6" />
      </Button>
      <Button className="h-16 col-span-2 text-xl rounded-lg" onClick={onConfirm}>
        Confirm
      </Button>
    </div>
  );
};

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (code: string) => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [code, setCode] = useState('');

  const handleInput = (value: string) => {
    setCode(prev => prev + value);
  };

  const handleClear = () => {
    setCode('');
  };

  const handleConfirm = () => {
    onAddProduct(code);
    setCode('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-4">
            <Input
              placeholder="Enter SKU or Barcode"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="text-center text-3xl h-20 rounded-lg shadow-inner"
            />
            <DialPad
              onInput={handleInput}
              onClear={handleClear}
              onConfirm={handleConfirm}
            />
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}; 