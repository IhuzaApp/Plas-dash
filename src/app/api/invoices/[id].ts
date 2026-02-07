import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import {
  downloadInvoiceAsPdf,
  InvoiceData,
} from "../../../src/lib/invoiceUtils";
import {
  formatCurrencySync,
  getCurrencySymbol,
} from "../../../src/utils/formatCurrency";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

// Function to load image as base64
async function loadImageAsBase64(imagePath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), "public", imagePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64 = imageBuffer.toString("base64");
    const mimeType = imagePath.endsWith(".png")
      ? "image/png"
      : imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")
      ? "image/jpeg"
      : imagePath.endsWith(".svg")
      ? "image/svg+xml"
      : "image/png";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    throw error;
  }
}

// Function to generate PDF buffer
async function generateInvoicePdf(
  invoiceData: any,
  baseUrl?: string
): Promise<Buffer> {
  // Create PDF with narrow receipt size (80mm width, standard thermal receipt size)
  // 80mm = 226.77 points (1mm = 2.83465 points)
  const receiptWidth = 226.77; // 80mm in points

  // Calculate approximate content height more accurately (with increased spacing)
  const headerHeight = 80; // Business name, address, phone, separator (increased spacing)
  const itemHeight = 12; // Increased spacing between items
  const itemsHeight = invoiceData.items.length * itemHeight;
  const separatorHeight = 12; // Increased spacing after separators
  const summaryHeight = 60; // Subtotal, tax, total, separator (increased spacing)
  const paymentHeight = 60; // Paid by, date, transaction IDs (increased spacing)
  const qrCodeHeight = 80; // QR code and label
  const footerHeight = 25; // Thank you message (increased spacing)
  const padding = 40; // Top and bottom padding (increased)

  const calculatedHeight =
    headerHeight +
    itemsHeight +
    separatorHeight +
    summaryHeight +
    paymentHeight +
    qrCodeHeight +
    footerHeight +
    padding;

  // Use calculated height with a reasonable minimum
  const receiptHeight = Math.max(calculatedHeight, 300);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [receiptWidth, receiptHeight],
  });

  // Set initial position and page dimensions
  let yPos = 15;
  let xPos = 0; // For drawing dotted lines
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Simple line border at top (no decorative pattern)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 16;

  // Business name with invoice ID
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  const businessName = `#${invoiceData.invoiceNumber}`;
  // Center the business name
  const businessNameWidth = doc.getTextWidth(businessName);
  doc.text(businessName, (pageWidth - businessNameWidth) / 2, yPos);

  yPos += 20;

  // Company details - centered
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  const companyAddress = "1KN Kigali, Rwanda";
  const companyPhone = "0788829084";
  const addressWidth = doc.getTextWidth(companyAddress);
  const phoneWidth = doc.getTextWidth(companyPhone);
  doc.text(companyAddress, (pageWidth - addressWidth) / 2, yPos);
  yPos += 12;
  doc.text(companyPhone, (pageWidth - phoneWidth) / 2, yPos);

  yPos += 14;

  // Draw dotted separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  xPos = margin;
  while (xPos < pageWidth - margin) {
    doc.line(xPos, yPos, xPos + 3, yPos);
    xPos += 6;
  }

  yPos += 12;

  // Add items - thermal receipt style (item name left, price right)
  doc.setFont("courier", "normal"); // Use monospace font for receipt look
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Calculate fixed positions for better alignment - push prices to right edge
  const priceStartX = pageWidth - margin; // Push prices to the right edge

  invoiceData.items.forEach((item: any, index: number) => {
    // Check if we need a new page
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 20;
    }

    // Item name on left (truncate if too long to fit before price area)
    const maxItemWidth = priceStartX - margin - 15; // Leave space before price
    let itemName = item.name;
    if (doc.getTextWidth(itemName) > maxItemWidth) {
      // Truncate item name to fit
      while (
        doc.getTextWidth(itemName + "...") > maxItemWidth &&
        itemName.length > 0
      ) {
        itemName = itemName.substring(0, itemName.length - 1);
      }
      itemName += "...";
    }
    doc.text(itemName, margin, yPos);

    // Price on right - aligned to fixed position
    const priceText = formatCurrencySync(item.total);
    doc.text(priceText, priceStartX, yPos, { align: "right" });

    yPos += 12;
  });

  yPos += 12;

  // Draw dotted separator line
  xPos = margin;
  while (xPos < pageWidth - margin) {
    doc.line(xPos, yPos, xPos + 3, yPos);
    xPos += 6;
  }

  yPos += 14;

  // Summary section - thermal receipt style
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Sub Total - aligned to same position as items
  const subtotalLabel = "Sub Total";
  const subtotalValue = formatCurrencySync(invoiceData.subtotal);
  doc.text(subtotalLabel, margin, yPos);
  doc.text(subtotalValue, priceStartX, yPos, { align: "right" });

  yPos += 12;

  // Sales Tax (0%) - aligned to same position
  const taxLabel = "Sales Tax";
  const taxValue = formatCurrencySync(0); // VAT is 0%
  doc.text(taxLabel, margin, yPos);
  doc.text(taxValue, priceStartX, yPos, { align: "right" });

  yPos += 12;

  // Draw dotted separator line
  xPos = margin;
  while (xPos < pageWidth - margin) {
    doc.line(xPos, yPos, xPos + 3, yPos);
    xPos += 6;
  }

  yPos += 14;

  // TOTAL - bold and larger, aligned to same position
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  const totalLabel = "TOTAL";
  const totalValue = formatCurrencySync(invoiceData.total);
  doc.text(totalLabel, margin, yPos);
  doc.text(totalValue, priceStartX, yPos, { align: "right" });

  yPos += 14;

  // Draw dotted separator line
  xPos = margin;
  while (xPos < pageWidth - margin) {
    doc.line(xPos, yPos, xPos + 3, yPos);
    xPos += 6;
  }

  yPos += 14;

  // Payment and transaction details
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // Paid By: Plas - better alignment
  const paidByLabel = "Paid By:";
  const paidByValue = "Plas";
  doc.text(paidByLabel, margin, yPos);
  doc.text(paidByValue, priceStartX, yPos, { align: "right" });

  yPos += 12;

  // Date and Time (format: MM/DD/YYYY HH:MM)
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const dateTimeStr = `${month}/${day}/${year} ${hours}:${minutes}`;
  doc.text(dateTimeStr, margin, yPos);

  yPos += 12;

  // Transaction ID
  const transactionId = `Transaction ID: ${invoiceData.invoiceNumber}`;
  doc.text(transactionId, margin, yPos);

  yPos += 12;

  // Vendor ID (using order number or invoice ID)
  const vendorId = `Vendor ID: ${
    invoiceData.orderNumber || invoiceData.invoiceNumber
  }`;
  doc.text(vendorId, margin, yPos);

  yPos += 12;

  // Add QR code for invoice verification
  try {
    // Use invoice ID for verification (most reliable)
    const verificationUrl = baseUrl
      ? `${baseUrl}/api/invoices/check-existence?invoiceId=${invoiceData.id}`
      : `/api/invoices/check-existence?invoiceId=${invoiceData.id}`;

    // Generate QR code as base64
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 80,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Calculate position for QR code (centered)
    const qrSize = 50;
    const qrX = (pageWidth - qrSize) / 2;
    const qrY = yPos;

    // Add QR code to PDF
    doc.addImage(qrCodeDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    // Add QR code label below
    yPos += qrSize + 8;
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const qrLabel = "Scan to verify invoice";
    const qrLabelWidth = doc.getTextWidth(qrLabel);
    doc.text(qrLabel, (pageWidth - qrLabelWidth) / 2, yPos);
  } catch (error) {
    // Continue without QR code if there's an error
    console.error("Error generating QR code:", error);
  }

  yPos += 18;

  // Footer - Thank you message
  doc.setFont("courier", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const thankYouText = "Thank you for using plas";
  const thankYouWidth = doc.getTextWidth(thankYouText);
  doc.text(thankYouText, (pageWidth - thankYouWidth) / 2, yPos);

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return buffer;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    // Use the invoice ID directly - no need to process prefixes
    const actualId = id;

    // GraphQL query to fetch invoice details - EXACT match to Invoices.graphql
    const getInvoiceDetailsQuery = `
      query getInvoiceDetials($id: uuid!) {
        Invoices(where: { id: { _eq: $id } }) {
          created_at
          customer_id
          delivery_fee
          discount
          id
          invoice_items
          invoice_number
          Proof
          order_id
          reel_order_id
          service_fee
          status
          subtotal
          tax
          total_amount
          Order {
            combined_order_id
            created_at
            delivery_address_id
            delivery_fee
            delivery_notes
            delivery_photo_url
            delivery_time
            discount
            id
            service_fee
            shop_id
            shopper_id
            status
            total
            updated_at
            user_id
            voucher_code
            Shop {
              id
              name
              address
            }
            Order_Items {
              created_at
              id
              order_id
              price
              product_id
              quantity
              Product {
                category
                created_at
                final_price
                id
                image
                is_active
                measurement_unit
                price
                quantity
                reorder_point
                shop_id
                sku
                supplier
                updated_at
                productName_id
                ProductName {
                  barcode
                  create_at
                  description
                  id
                  image
                  name
                  sku
                }
              }
            }
            OrderID
          }
          User {
            created_at
            email
            gender
            id
            is_active
            name
            password_hash
            phone
            profile_picture
            role
            updated_at
          }
        }
      }
    `;

    // Additional query to fetch reel order details with restaurant info
    const getReelOrderDetailsQuery = `
      query getReelOrderDetails($reel_order_id: uuid!) {
        reel_orders(where: { id: { _eq: $reel_order_id } }) {
          id
          OrderID
          status
          created_at
          total
          service_fee
          delivery_fee
          delivery_time
          delivery_photo_url
          Reel {
            id
            title
            description
            Price
            Product
            type
            video_url
            restaurant_id
            Restaurant {
              id
              name
              email
              phone
              location
              profile
              verified
            }
          }
        }
      }
    `;

    const variables = { id: actualId };

    if (!hasuraClient) {
      return res
        .status(500)
        .json({ message: "Database connection not available" });
    }

    // Fetch invoice using the exact getInvoiceDetials query

    const response = (await hasuraClient.request(
      getInvoiceDetailsQuery,
      variables
    )) as any;
    const invoices = response.Invoices;

    if (!invoices || invoices.length === 0) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const invoice = invoices[0]; // Get the first (and should be only) invoice

    // Fetch reel order details if it's a reel order
    let reelOrderDetails = null;
    if (invoice.reel_order_id) {
      try {
        const reelResponse = (await hasuraClient.request(
          getReelOrderDetailsQuery,
          {
            reel_order_id: invoice.reel_order_id,
          }
        )) as any;
        reelOrderDetails = reelResponse.reel_orders?.[0] || null;
      } catch (error) {
        // Continue without reel order details
      }
    }

    // Determine order type: if order_id is null, it's a reel order; if reel_order_id is null, it's a regular order
    const isReelOrder =
      invoice.order_id === null && invoice.reel_order_id !== null;
    const isRegularOrder =
      invoice.reel_order_id === null && invoice.order_id !== null;

    // Transform the data based on order type
    let transformedInvoice;

    if (isReelOrder) {
      // Handle reel order invoice
      const restaurant = reelOrderDetails?.Reel?.Restaurant;
      transformedInvoice = {
        id: invoice.id,
        orderId: invoice.reel_order_id,
        invoiceNumber: invoice.invoice_number,
        orderNumber: `REEL-${invoice.invoice_number}`,
        orderType: "reel",
        status: invoice.status,
        dateCreated: new Date(invoice.created_at).toLocaleDateString(),
        dateCompleted: new Date(invoice.created_at).toLocaleDateString(),
        shop: restaurant?.name || "Restaurant",
        shopAddress: restaurant?.location || "Location not available",
        customer: invoice.User?.name || "Unknown Customer",
        customerEmail: invoice.User?.email || "Email not available",
        // For reel orders, use invoice_items instead of Order_Items
        items:
          invoice.invoice_items?.map((item: any) => ({
            name: item.name || "Reel Item",
            description: item.description || "",
            quantity: item.quantity || 1,
            unitPrice: parseFloat(item.unit_price) || 0,
            unit: item.unit || "item",
            total: parseFloat(item.total) || 0,
          })) || [],
        subtotal: parseFloat(invoice.subtotal) || 0,
        serviceFee: parseFloat(invoice.service_fee) || 0,
        deliveryFee: parseFloat(invoice.delivery_fee) || 0,
        total: parseFloat(invoice.total_amount) || 0,

        // Include ALL exact fields from Invoices.graphql structure
        created_at: invoice.created_at,
        customer_id: invoice.customer_id,
        delivery_fee: invoice.delivery_fee,
        discount: invoice.discount,
        invoice_items: invoice.invoice_items,
        Proof: invoice.Proof,
        order_id: invoice.order_id,
        reel_order_id: invoice.reel_order_id,
        service_fee: invoice.service_fee,
        tax: invoice.tax,
        total_amount: invoice.total_amount,
        Order: invoice.Order,
        User: invoice.User,
        // Reel-specific fields
        reel_title:
          reelOrderDetails?.Reel?.title ||
          invoice.invoice_items?.[0]?.description ||
          "Reel Order",
        reel_description:
          reelOrderDetails?.Reel?.description ||
          invoice.invoice_items?.[0]?.description ||
          "",
        delivery_photo_url:
          reelOrderDetails?.delivery_photo_url ||
          invoice.Order?.delivery_photo_url,
        // Restaurant details
        restaurant: restaurant
          ? {
              id: restaurant.id,
              name: restaurant.name,
              email: restaurant.email,
              phone: restaurant.phone,
              location: restaurant.location,
              verified: restaurant.verified,
            }
          : null,
      };
    } else {
      // Handle regular order invoice
      transformedInvoice = {
        id: invoice.id,
        orderId: invoice.order_id,
        invoiceNumber: invoice.invoice_number,
        orderNumber: invoice.Order?.OrderID || `INV-${invoice.invoice_number}`,
        orderType: "regular",
        status: invoice.status,
        dateCreated: new Date(invoice.created_at).toLocaleDateString(),
        dateCompleted: invoice.Order?.updated_at
          ? new Date(invoice.Order.updated_at).toLocaleDateString()
          : new Date(invoice.created_at).toLocaleDateString(),
        shop: invoice.Order?.Shop?.name || "Unknown Shop",
        shopAddress: invoice.Order?.Shop?.address || "Address not available",
        customer: invoice.User?.name || "Unknown Customer",
        customerEmail: invoice.User?.email || "Email not available",
        // For regular orders, use Order_Items
        items:
          invoice.Order?.Order_Items?.map((item: any) => ({
            name: item.Product?.ProductName?.name || "Unknown Product",
            quantity: item.quantity,
            unitPrice: parseFloat(item.price) || 0,
            unit: item.Product?.measurement_unit || "unit",
            total: (parseFloat(item.price) || 0) * (item.quantity || 0),
          })) || [],
        subtotal: parseFloat(invoice.subtotal) || 0,
        serviceFee: parseFloat(invoice.service_fee) || 0,
        deliveryFee: parseFloat(invoice.delivery_fee) || 0,
        total: parseFloat(invoice.total_amount) || 0,

        // Include ALL exact fields from Invoices.graphql structure
        created_at: invoice.created_at,
        customer_id: invoice.customer_id,
        delivery_fee: invoice.delivery_fee,
        discount: invoice.discount,
        invoice_items: invoice.invoice_items,
        Proof: invoice.Proof,
        order_id: invoice.order_id,
        reel_order_id: invoice.reel_order_id,
        service_fee: invoice.service_fee,
        tax: invoice.tax,
        total_amount: invoice.total_amount,
        Order: invoice.Order,
        User: invoice.User,
        delivery_photo_url: invoice.Order?.delivery_photo_url,
      };
    }

    // Check if the request is for PDF download
    const isPdfRequest = req.query.pdf === "true";

    if (isPdfRequest) {
      // Generate PDF and return as file
      try {
        // Get base URL - use production domain or from request headers
        let baseUrl: string;
        if (process.env.NODE_ENV === "production") {
          // Use production domain - always HTTPS
          baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://plas.rw";
          // Ensure it's HTTPS
          if (!baseUrl.startsWith("https://")) {
            baseUrl = baseUrl.replace(/^https?:\/\//, "https://");
          }
        } else {
          // Development: use request headers
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const host = req.headers.host || "localhost:3000";
          baseUrl = `${protocol}://${host}`;
        }

        const pdfBuffer = await generateInvoicePdf(transformedInvoice, baseUrl);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="invoice-${transformedInvoice.invoiceNumber}.pdf"`
        );
        res.setHeader("Content-Length", pdfBuffer.length);

        return res.status(200).send(pdfBuffer);
      } catch (error) {
        return res.status(500).json({
          error: "Failed to generate PDF",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    res.status(200).json({ invoice: transformedInvoice });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch invoice",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
