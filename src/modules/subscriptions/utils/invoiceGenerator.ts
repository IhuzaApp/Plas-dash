import jsPDF from 'jspdf';
import { format } from 'date-fns';

export interface InvoiceData {
  invoice_number: string;
  issued_at: string;
  due_date: string;
  plan_name: string;
  subtotal_amount: string;
  tax_amount: string;
  discount_amount: string;
  currency: string;
  status: string;
  entity_name: string;
  entity_id: string;
}

const LOGO_PATH = '/Assets/logo/PlasLogoPNG.png';

/**
 * Utility to generate and download/view PDF invoices
 */
export class InvoiceGenerator {
  private static async getLogoBase64(): Promise<string | null> {
    try {
      const response = await fetch(LOGO_PATH);
      const blob = await response.blob();
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
      return null;
    }
  }

  public static async generate(invoice: InvoiceData, action: 'download' | 'view' = 'download') {
    const doc = new jsPDF();
    const logo = await this.getLogoBase64();

    const subtotal = parseFloat(invoice.subtotal_amount || '0');
    const tax = parseFloat(invoice.tax_amount || '0');
    const discount = parseFloat(invoice.discount_amount || '0');
    const total = subtotal + tax - discount;

    // --- Header Section ---
    if (logo) {
      doc.addImage(logo, 'PNG', 15, 15, 30, 10);
    }

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 195, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Invoice #: ${invoice.invoice_number}`, 195, 32, { align: 'right' });
    doc.text(`Issued: ${format(new Date(invoice.issued_at), 'PPP')}`, 195, 37, { align: 'right' });
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 195, 42, { align: 'right' });

    // --- Bill To Section ---
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 15, 55);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.entity_name, 15, 62);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`ID: ${invoice.entity_id}`, 15, 67);

    // --- Invoice Details ---
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', 140, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(format(new Date(invoice.due_date), 'PPP'), 165, 62);

    // --- Table Headers ---
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 80, 180, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, 86);
    doc.text('Amount', 190, 86, { align: 'right' });

    // --- Table Content ---
    doc.setFont('helvetica', 'normal');
    doc.text(`Subscription Plan: ${invoice.plan_name}`, 20, 100);
    doc.text(`${invoice.currency} ${subtotal.toLocaleString()}`, 190, 100, { align: 'right' });

    doc.line(15, 110, 195, 110);

    // --- Totals Section ---
    const footerStart = 120;
    doc.text('Subtotal:', 140, footerStart);
    doc.text(`${invoice.currency} ${subtotal.toLocaleString()}`, 190, footerStart, {
      align: 'right',
    });

    if (tax > 0) {
      doc.text('Tax:', 140, footerStart + 7);
      doc.text(`${invoice.currency} ${tax.toLocaleString()}`, 190, footerStart + 7, {
        align: 'right',
      });
    }

    if (discount > 0) {
      doc.setTextColor(200, 0, 0);
      doc.text('Discount:', 140, footerStart + 14);
      doc.text(`-${invoice.currency} ${discount.toLocaleString()}`, 190, footerStart + 14, {
        align: 'right',
      });
      doc.setTextColor(0);
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 140, footerStart + 25);
    doc.text(`${invoice.currency} ${total.toLocaleString()}`, 190, footerStart + 25, {
      align: 'right',
    });

    // --- Footer ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text('Thank you for choosing Plas-dash!', 105, 280, { align: 'center' });

    if (action === 'download') {
      doc.save(`Invoice_${invoice.invoice_number}.pdf`);
    } else {
      const string = doc.output('bloburl');
      window.open(string, '_blank');
    }
  }
}
