import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { format } from 'date-fns';
import {
  Star,
  MessageSquare,
  AlertTriangle,
  Receipt,
  TrendingUp,
  Download,
  Eye,
  FileText,
} from 'lucide-react';

interface ShopperTabsProps {
  // Wallet tab
  wallet: any;
  totalEarnings: number;
  pendingPayouts: number;
  formatCurrency: (amount: string) => string;
  
  // Orders tab
  paginatedOrders: any[];
  ordersPage: number;
  totalOrders: number;
  setOrdersPage: (page: number) => void;
  
  // Transactions tab
  paginatedTransactions: any[];
  transactionsPage: number;
  totalTransactions: number;
  setTransactionsPage: (page: number) => void;
  formatTransactionId: (id: string, type: string, created_at: string) => string;
  
  // Ratings tab
  paginatedRatings: any[];
  ratingsPage: number;
  totalRatings: number;
  setRatingsPage: (page: number) => void;
  calculateAverageRating: (ratings: any[]) => string;
  detailedShopper: any;
  
  // Tickets tab
  paginatedTickets: any[];
  ticketsPage: number;
  totalTickets: number;
  setTicketsPage: (page: number) => void;
  
  // Delivery issues tab
  paginatedDeliveryIssues: any[];
  deliveryIssuesPage: number;
  totalDeliveryIssues: number;
  setDeliveryIssuesPage: (page: number) => void;
  
  // Invoices tab
  paginatedInvoices: any[];
  invoicesPage: number;
  totalInvoices: number;
  setInvoicesPage: (page: number) => void;
  
  // Revenues tab
  paginatedRevenues: any[];
  revenuesPage: number;
  totalRevenues: number;
  setRevenuesPage: (page: number) => void;
  
  // Pagination
  renderPagination: (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => React.ReactNode;
}

const ShopperTabs: React.FC<ShopperTabsProps> = ({
  wallet,
  totalEarnings,
  pendingPayouts,
  formatCurrency,
  paginatedOrders,
  ordersPage,
  totalOrders,
  setOrdersPage,
  paginatedTransactions,
  transactionsPage,
  totalTransactions,
  setTransactionsPage,
  formatTransactionId,
  paginatedRatings,
  ratingsPage,
  totalRatings,
  setRatingsPage,
  calculateAverageRating,
  detailedShopper,
  paginatedTickets,
  ticketsPage,
  totalTickets,
  setTicketsPage,
  paginatedDeliveryIssues,
  deliveryIssuesPage,
  totalDeliveryIssues,
  setDeliveryIssuesPage,
  paginatedInvoices,
  invoicesPage,
  totalInvoices,
  setInvoicesPage,
  paginatedRevenues,
  revenuesPage,
  totalRevenues,
  setRevenuesPage,
  renderPagination,
}) => {
  // Download invoice function
  const downloadInvoice = (invoice: any) => {
    const invoiceData = {
      invoice_number: invoice.invoice_number,
      order_id: invoice.order_id,
      status: invoice.status,
      subtotal: invoice.subtotal,
      delivery_fee: invoice.delivery_fee,
      service_fee: invoice.service_fee,
      total_amount: invoice.total_amount,
      created_at: invoice.created_at,
      invoice_items: invoice.invoice_items || [],
    };

    const blob = new Blob([JSON.stringify(invoiceData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoice_number}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <Tabs defaultValue="wallet" className="space-y-4">
      <TabsList className="grid w-full grid-cols-8">
        <TabsTrigger value="wallet">Wallet</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="ratings">Ratings</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
        <TabsTrigger value="delivery-issues">Issues</TabsTrigger>
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="revenues">Revenues</TabsTrigger>
      </TabsList>

      {/* Wallet Tab */}
      <TabsContent value="wallet">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(wallet?.available_balance || '0')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reserved Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(wallet?.reserved_balance || '0')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalEarnings.toString())}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(pendingPayouts.toString())}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Orders Tab */}
      <TabsContent value="orders">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.OrderID}</TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{order.User?.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>{order.Shop?.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {renderPagination(ordersPage, totalOrders, setOrdersPage)}
        </Card>
      </TabsContent>

      {/* Transactions Tab */}
      <TabsContent value="transactions">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Related Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatTransactionId(
                      transaction.id,
                      transaction.type,
                      transaction.created_at
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.related_order_id && transaction.Order ? (
                      <Button variant="ghost" size="sm">
                        #{transaction.Order.OrderID} ({transaction.Order.status})
                      </Button>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {renderPagination(transactionsPage, totalTransactions, setTransactionsPage)}
        </Card>
      </TabsContent>

      {/* Ratings Tab */}
      <TabsContent value="ratings">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span>
                {calculateAverageRating(detailedShopper?.User?.Ratings || [])}
                <span className="text-sm text-muted-foreground ml-2">
                  ({totalRatings} reviews)
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {paginatedRatings && paginatedRatings.length > 0 ? (
                paginatedRatings.map((rating: any) => (
                  <div key={rating.id} className="border-b pb-6">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{rating.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(rating.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm mb-4">{rating.review}</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Delivery Experience</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{rating.delivery_experience}/5</span>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Packaging Quality</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{rating.packaging_quality}/5</span>
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Professionalism</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{rating.professionalism}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {totalRatings === 0 ? 'No ratings yet' : 'Loading ratings...'}
                </div>
              )}
            </div>
            {renderPagination(ratingsPage, totalRatings, setRatingsPage)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tickets Tab */}
      <TabsContent value="tickets">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Support Tickets ({totalTickets})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets && paginatedTickets.length > 0 ? (
                  paginatedTickets.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">#{ticket.ticket_num}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ticket.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : ticket.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ticket.status === 'closed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-green-100 text-green-800'
                          }
                        >
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.created_on), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.update_on), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {totalTickets === 0 ? 'No tickets found' : 'Loading tickets...'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {renderPagination(ticketsPage, totalTickets, setTicketsPage)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Delivery Issues Tab */}
      <TabsContent value="delivery-issues">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delivery Issues ({totalDeliveryIssues})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDeliveryIssues && paginatedDeliveryIssues.length > 0 ? (
                  paginatedDeliveryIssues.map((issue: any) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium capitalize">{issue.issue_type}</TableCell>
                      <TableCell className="max-w-xs truncate">{issue.description}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            issue.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : issue.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {issue.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            issue.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(issue.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(issue.updated_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {totalDeliveryIssues === 0 ? 'No delivery issues found' : 'Loading delivery issues...'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {renderPagination(deliveryIssuesPage, totalDeliveryIssues, setDeliveryIssuesPage)}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Invoices Tab */}
      <TabsContent value="invoices">
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
                      <TableCell>
                        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </TableCell>
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
                                  Invoice #{invoice.invoice_number} - {format(new Date(invoice.created_at), 'MMM d, yyyy')}
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
                                    <p className="text-lg">{format(new Date(invoice.created_at), 'MMM d, yyyy HH:mm')}</p>
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
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Item</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Unit</th>
                                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Quantity</th>
                                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Unit Price</th>
                                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {invoice.invoice_items.map((item: any, index: number) => (
                                            <tr key={index} className="border-t">
                                              <td className="px-4 py-2 text-sm">{item.name}</td>
                                              <td className="px-4 py-2 text-sm">{item.unit}</td>
                                              <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                                              <td className="px-4 py-2 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                                              <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(item.total)}</td>
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
                                      <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
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
                                        onError={(e) => {
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
                                    onClick={() => downloadInvoice(invoice)}
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
                            onClick={() => downloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {invoice.Proof ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
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
                                    onError={(e) => {
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
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" disabled>
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
      </TabsContent>

      {/* Revenues Tab */}
      <TabsContent value="revenues">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue History ({totalRevenues})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRevenues && paginatedRevenues.length > 0 ? (
                  paginatedRevenues.map((revenue: any) => (
                    <TableRow key={revenue.id}>
                      <TableCell className="font-medium">#{revenue.order_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {revenue.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(revenue.amount)}</TableCell>
                      <TableCell>{revenue.commission_percentage}%</TableCell>
                      <TableCell className="max-w-xs truncate">{revenue.products}</TableCell>
                      <TableCell>
                        {format(new Date(revenue.created_at), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {totalRevenues === 0 ? 'No revenues found' : 'Loading revenues...'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {renderPagination(revenuesPage, totalRevenues, setRevenuesPage)}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ShopperTabs; 