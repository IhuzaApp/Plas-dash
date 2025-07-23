import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Receipt, Download, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface InvoicesTabProps {
  paginatedInvoices: any[];
  invoicesPage: number;
  totalInvoices: number;
  setInvoicesPage: (page: number) => void;
  formatCurrency: (amount: string) => string;
  renderPagination: (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

const InvoicesTab: React.FC<InvoicesTabProps> = ({
  paginatedInvoices,
  invoicesPage,
  totalInvoices,
  setInvoicesPage,
  formatCurrency,
  renderPagination,
}) => {
  // Download invoice function
  const downloadInvoice = async (invoice: any) => {
    try {
      // Import jsPDF dynamically to avoid SSR issues
      const { jsPDF } = await import('jspdf');

      // Create new PDF document
      const doc = new jsPDF();

      // Set font
      doc.setFont('helvetica');

      // Header
      doc.setFontSize(20);
      doc.text('INVOICE', 105, 20, { align: 'center' });

      // Invoice details
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoice.invoice_number}`, 20, 40);
      doc.text(`Order ID: ${invoice.order_id}`, 20, 50);
      doc.text(`Date: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`, 20, 60);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 70);

      // Items table header
      doc.setFontSize(14);
      doc.text('Items', 20, 90);

      doc.setFontSize(10);
      doc.text('Item', 20, 100);
      doc.text('Unit', 80, 100);
      doc.text('Qty', 110, 100);
      doc.text('Price', 130, 100);
      doc.text('Total', 160, 100);

      // Items
      let yPosition = 110;
      if (invoice.invoice_items && invoice.invoice_items.length > 0) {
        invoice.invoice_items.forEach((item: any) => {
          doc.text(item.name || 'N/A', 20, yPosition);
          doc.text(item.unit || 'N/A', 80, yPosition);
          doc.text(item.quantity?.toString() || '0', 110, yPosition);
          doc.text(formatCurrency(item.unit_price?.toString() || '0'), 130, yPosition);
          doc.text(formatCurrency(item.total?.toString() || '0'), 160, yPosition);
          yPosition += 10;
        });
      }

      // Summary
      doc.setFontSize(12);
      doc.text('Summary', 20, yPosition + 10);

      doc.setFontSize(10);
      doc.text('Products Total:', 120, yPosition + 20);
      doc.text(formatCurrency(invoice.subtotal), 160, yPosition + 20);

      doc.text('Tax:', 120, yPosition + 30);
      doc.text(formatCurrency(invoice.tax), 160, yPosition + 30);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 120, yPosition + 40);
      doc.text(formatCurrency(invoice.subtotal), 160, yPosition + 40);

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business!', 105, 280, { align: 'center' });

      // Save the PDF
      doc.save(`invoice-${invoice.invoice_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download if PDF generation fails
      const invoiceContent = `
INVOICE

Invoice #: ${invoice.invoice_number}
Order ID: ${invoice.order_id}
Date: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}
Status: ${invoice.status.toUpperCase()}

ITEMS:
${
  invoice.invoice_items && invoice.invoice_items.length > 0
    ? invoice.invoice_items
        .map(
          (item: any) =>
            `${item.name || 'N/A'} - ${item.unit || 'N/A'} - Qty: ${item.quantity || '0'} - Price: ${formatCurrency(item.unit_price?.toString() || '0')} - Total: ${formatCurrency(item.total?.toString() || '0')}`
        )
        .join('\n')
    : 'No items found'
}

SUMMARY:
Products Total: ${formatCurrency(invoice.subtotal)}
Tax: ${formatCurrency(invoice.tax)}
Total: ${formatCurrency(invoice.subtotal)}

Thank you for your business!
      `.trim();

      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Download proof function
  const downloadProof = (proofUrl: string) => {
    if (proofUrl.startsWith('data:image')) {
      // Handle image data URL
      const a = document.createElement('a');
      a.href = proofUrl;
      a.download = 'invoice-proof.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (proofUrl.startsWith('data:')) {
      // Handle other data URLs
      const a = document.createElement('a');
      a.href = proofUrl;
      a.download = 'invoice-proof';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Handle regular URL
      window.open(proofUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Invoices ({totalInvoices})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices && paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell className={`font-medium ${!invoice.Proof ? 'text-red-600' : ''}`}>
                    #{invoice.invoice_number}
                  </TableCell>
                  <TableCell>#{invoice.order_id}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(invoice.subtotal)}</TableCell>
                  <TableCell>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Invoice Details</DialogTitle>
                            <DialogDescription>
                              Invoice #{invoice.invoice_number} -{' '}
                              {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 space-y-4">
                            {/* Invoice Header */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Invoice Number</p>
                                <p className="text-lg font-semibold">#{invoice.invoice_number}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Order ID</p>
                                <p className="text-lg font-semibold">#{invoice.order_id}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Status</p>
                                <Badge
                                  className={
                                    invoice.status === 'paid'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {invoice.status}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Proof</p>
                                <Badge
                                  className={
                                    invoice.Proof
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }
                                >
                                  {invoice.Proof ? 'Available' : 'Missing'}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">Created Date</p>
                                <p className="text-lg">
                                  {format(new Date(invoice.created_at), 'MMM d, yyyy HH:mm')}
                                </p>
                              </div>
                            </div>

                            {/* Invoice Items */}
                            {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-3">Invoice Items</h3>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                                          Item
                                        </th>
                                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                                          Unit
                                        </th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">
                                          Quantity
                                        </th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">
                                          Unit Price
                                        </th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {invoice.invoice_items.map((item: any, index: number) => (
                                        <tr key={index} className="border-t">
                                          <td className="px-4 py-2 text-sm">{item.name}</td>
                                          <td className="px-4 py-2 text-sm">{item.unit}</td>
                                          <td className="px-4 py-2 text-sm text-right">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-right">
                                            {formatCurrency(item.unit_price)}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-right font-medium">
                                            {formatCurrency(item.total)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Invoice Summary */}
                            <div className="border rounded-lg p-4">
                              <h3 className="text-lg font-semibold mb-3">Summary</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Products Total:</span>
                                  <span className="font-medium">
                                    {formatCurrency(invoice.subtotal)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tax:</span>
                                  <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                                  <span>Total:</span>
                                  <span>{formatCurrency(invoice.subtotal)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Proof Image */}
                            {invoice.Proof && (
                              <div>
                                <h3 className="text-lg font-semibold mb-3">Payment Proof</h3>
                                <div className="border rounded-lg p-4">
                                  <img
                                    src={invoice.Proof}
                                    alt="Payment Proof"
                                    className="w-full h-auto rounded-lg border shadow-sm"
                                    onError={e => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="hidden flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg mt-2">
                                    <div className="text-center">
                                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-500">
                                        Unable to load proof image
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => downloadInvoice(invoice).catch(console.error)}
                                className="flex-1"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Invoice
                              </Button>
                              {invoice.Proof && (
                                <Button
                                  variant="outline"
                                  onClick={() => downloadProof(invoice.Proof)}
                                  className="flex-1"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Proof
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadInvoice(invoice).catch(console.error)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      {invoice.Proof ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Proof
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Invoice Proof</DialogTitle>
                              <DialogDescription>
                                Proof of payment for invoice #{invoice.invoice_number}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <img
                                src={invoice.Proof}
                                alt="Invoice Proof"
                                className="w-full h-auto rounded-lg border shadow-sm"
                                onError={e => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <div className="hidden flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                                <div className="text-center">
                                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-500">
                                    Unable to load proof image
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => downloadProof(invoice.Proof)}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download Proof
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          No Proof
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {totalInvoices === 0 ? 'No invoices found' : 'Loading invoices...'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {renderPagination(invoicesPage, totalInvoices, setInvoicesPage)}
      </CardContent>
    </Card>
  );
};

export default InvoicesTab;
