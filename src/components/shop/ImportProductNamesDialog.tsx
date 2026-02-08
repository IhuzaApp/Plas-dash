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
import { Upload, Loader2, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import * as XLSX from 'xlsx';

export interface ProductNameImportRow {
  name: string;
  description?: string;
  barcode?: string;
  sku?: string;
  image?: string;
}

const DB_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'barcode', label: 'Barcode', required: false },
  { key: 'sku', label: 'SKU', required: false },
  { key: 'image', label: 'Image URL', required: false },
] as const;

const SKIP = '__none__'; // Radix Select doesn't allow value=""

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const sep = text.includes('\t') ? '\t' : ',';
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === sep && !inQuotes) {
        out.push(cur.replace(/^"|"$/g, '').trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur.replace(/^"|"$/g, '').trim());
    return out;
  };
  const first = parseLine(lines[0]);
  const rawHeaders = first.map((h, i) => (h || `Column ${i + 1}`).trim());
  const seen = new Map<string, number>();
  const headers = rawHeaders.map(h => {
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    return n > 1 ? `${h} (${n})` : h;
  });
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = parts[j] ?? '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

async function parseXLSX(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return { headers: [], rows: [] };
  const json = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, defval: '' });
  if (json.length === 0) return { headers: [], rows: [] };
  const firstRow = json[0] ?? [];
  const rawHeaders = firstRow.map((h, i) => (String(h ?? '').trim() || `Column ${i + 1}`));
  const seen = new Map<string, number>();
  const headers = rawHeaders.map(h => {
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    return n > 1 ? `${h} (${n})` : h;
  });
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < json.length; i++) {
    const parts = json[i] ?? [];
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = String(parts[j] ?? '').trim();
    });
    rows.push(row);
  }
  return { headers, rows };
}

async function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const isXLSX =
    file.name.endsWith('.xlsx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (isXLSX) return parseXLSX(file);
  const text = await file.text();
  return parseCSV(text);
}

export type ColumnMapping = Record<string, string>;

interface ImportProductNamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (
    rows: ProductNameImportRow[],
    onProgress?: (current: number, total: number) => void
  ) => Promise<void>;
  isLoading?: boolean;
}

export function ImportProductNamesDialog({
  open,
  onOpenChange,
  onImport,
  isLoading = false,
}: ImportProductNamesDialogProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParseError(null);
    setImportProgress({ current: 0, total: 0 });
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setParseError(null);
      const f = acceptedFiles[0];
      setFile(f);
      try {
        const result = await parseFile(f);
        setHeaders(result.headers);
        setRows(result.rows);
        if (result.headers.length > 0 && result.rows.length > 0) {
          const auto: ColumnMapping = {};
          const lower = result.headers.map(h => h.toLowerCase());
          DB_FIELDS.forEach(({ key }) => {
            const i = lower.findIndex(
              h =>
                h === key ||
                h.replace(/\s+/g, '') === key ||
                h.includes(key) ||
                (key === 'name' && (h.includes('item') || h.includes('product') || h.includes('name')))
            );
            if (i >= 0) auto[key] = result.headers[i];
          });
          setMapping(auto);
          setStep('map');
        } else {
          setParseError('File has no headers or data rows.');
        }
      } catch (e) {
        setParseError(e instanceof Error ? e.message : 'Failed to parse file.');
      }
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
    disabled: isLoading || step === 'importing',
  });

  const handleBack = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setParseError(null);
  };

  const mappedRows = (): ProductNameImportRow[] => {
    return rows
      .map(row => {
        const name = mapping.name ? String(row[mapping.name] ?? '').trim() : '';
        if (!name) return null;
        return {
          name,
          description: mapping.description ? String(row[mapping.description] ?? '').trim() || undefined : undefined,
          barcode: mapping.barcode ? String(row[mapping.barcode] ?? '').trim() || undefined : undefined,
          sku: mapping.sku ? String(row[mapping.sku] ?? '').trim() || undefined : undefined,
          image: mapping.image ? String(row[mapping.image] ?? '').trim() || undefined : undefined,
        };
      })
      .filter((r): r is ProductNameImportRow => r !== null);
  };

  const handleImport = async () => {
    const toImport = mappedRows();
    if (toImport.length === 0) return;
    setStep('importing');
    setImportProgress({ current: 0, total: toImport.length });
    try {
      await onImport(toImport, (current, total) => {
        setImportProgress({ current, total });
      });
      reset();
      onOpenChange(false);
    } catch {
      setStep('map');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const validCount = mappedRows().length;
  const nameMapped = !!mapping.name;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[720px] w-[95vw]">
        <DialogHeader>
          <DialogTitle>Import product names</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <>
            <p className="text-sm text-muted-foreground">
              Upload a CSV or Excel (.xlsx) file. Next you will map your columns to the database fields.
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
                {isDragActive ? 'Drop the file here' : 'Drag & drop CSV or XLSX, or click to select'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">CSV, .xlsx</p>
            </div>
            {parseError && <p className="text-sm text-destructive">{parseError}</p>}
          </>
        )}

        {step === 'map' && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>{file?.name}</span>
              <span>·</span>
              <span>{rows.length} row(s)</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Map each file column to a database field. Rows with an empty mapped Name are skipped.
            </p>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {DB_FIELDS.map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-sm">
                    {label}
                    {required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Select
                    value={mapping[key] || SKIP}
                    onValueChange={v => setMapping(m => ({ ...m, [key]: v === SKIP ? '' : v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Don't map" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP}>— Don't map</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {nameMapped ? `${validCount} row(s) will be imported.` : 'Map "Name" to import.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={!nameMapped || validCount === 0 || isLoading}
              >
                Import {validCount > 0 ? `(${validCount})` : ''}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'importing' && (
          <>
            <div className="py-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Importing product names…
              </div>
              <Progress
                value={
                  importProgress.total > 0
                    ? Math.round((importProgress.current / importProgress.total) * 100)
                    : 0
                }
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {importProgress.current} of {importProgress.total} completed
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
