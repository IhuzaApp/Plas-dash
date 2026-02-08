import React, { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export interface ProductNameImportRow {
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
}

function parseCSV(text: string): ProductNameImportRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const hasHeader = /name|barcode|sku|description/.test(header);
  const start = hasHeader ? 1 : 0;
  const rows: ProductNameImportRow[] = [];
  const sep = text.includes('\t') ? '\t' : ',';
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(sep).map(p => p.replace(/^"|"$/g, '').trim());
    const name = parts[0] ?? '';
    if (!name) continue;
    rows.push({
      name,
      description: parts[1] ?? undefined,
      barcode: parts[2] ?? undefined,
      sku: parts[3] ?? undefined,
    });
  }
  return rows;
}

interface ImportProductNamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ProductNameImportRow[]) => Promise<void>;
  isLoading?: boolean;
}

export function ImportProductNamesDialog({
  open,
  onOpenChange,
  onImport,
  isLoading = false,
}: ImportProductNamesDialogProps) {
  const [pasteValue, setPasteValue] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        setPasteValue(text);
        setParseError(null);
      };
      reader.readAsText(file);
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const handleImport = async () => {
    setParseError(null);
    const rows = parseCSV(pasteValue);
    if (rows.length === 0) {
      setParseError('No valid rows. Use: name, description, barcode, sku (one per line or CSV header).');
      return;
    }
    await onImport(rows);
    setPasteValue('');
    onOpenChange(false);
  };

  const previewRows = pasteValue ? parseCSV(pasteValue) : [];
  const canImport = previewRows.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import product names</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file or paste text. First column is name; optional: description, barcode, sku.
        </p>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            {isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to select'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">CSV, TXT, or Excel</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Or paste CSV/text</label>
          <Textarea
            placeholder="name, description, barcode, sku&#10;Apple, Fresh fruit, 123, SKU001"
            value={pasteValue}
            onChange={e => {
              setPasteValue(e.target.value);
              setParseError(null);
            }}
            rows={4}
            className="font-mono text-sm"
            disabled={isLoading}
          />
          {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          {previewRows.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <FileText className="inline h-4 w-4 mr-1" />
              {previewRows.length} row(s) to import
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import {previewRows.length > 0 ? `(${previewRows.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
