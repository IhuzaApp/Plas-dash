
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUp, AlertCircle, FileCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ImportProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (file: File) => void;
}

const ImportProductsDialog: React.FC<ImportProductsDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  const validateFile = (selectedFile: File) => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Invalid file type. Please upload an Excel or CSV file");
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (selectedFile.size > maxSize) {
      toast.error("File is too large. Maximum size is 5 MB");
      return;
    }
    
    setFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateFile(droppedFile);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    onSubmit(file);
  };

  const handleDownloadTemplate = () => {
    // In a real app, this would download an actual Excel template
    toast.success("Template downloaded successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file with your product data.
          </DialogDescription>
        </DialogHeader>

        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Make sure your file follows the required format. You can download a template below.
          </AlertDescription>
        </Alert>

        <div className="mb-5">
          <p className="mb-2 font-semibold">Required columns in your spreadsheet:</p>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Column Name</TableHead>
                  <TableHead className="w-1/3">Data Type</TableHead>
                  <TableHead className="w-1/3">Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Text</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Text</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Price</TableCell>
                  <TableCell>Number (0.00)</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Stock</TableCell>
                  <TableCell>Number</TableCell>
                  <TableCell>Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Barcode</TableCell>
                  <TableCell>Text</TableCell>
                  <TableCell>No</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" /> Download Template
            </Button>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center space-y-2">
              <FileCheck className="h-10 w-10 text-green-500" />
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
              <Button variant="outline" size="sm" onClick={handleButtonClick}>
                Change File
              </Button>
            </div>
          ) : (
            <>
              <FileUp className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 font-semibold">Drag and drop your file here</p>
              <p className="text-sm text-muted-foreground mt-1">or</p>
              <Button variant="outline" onClick={handleButtonClick} className="mt-2">
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: 5 MB | Formats: .xlsx, .xls, .csv
              </p>
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file}>
            Import Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportProductsDialog;
