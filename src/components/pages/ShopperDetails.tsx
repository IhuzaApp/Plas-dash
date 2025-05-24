import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, Star, CheckCircle, XCircle, AlertCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { 
  useShopperDetails, 
  useShopperWallet, 
  useShopperOrders,
  useUpdateShopperStatus,
  useShopperFullDetails,
  type Order 
} from "@/hooks/useShoppers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ITEMS_PER_PAGE = 10;

type uuid = string;

interface ShopperDetailsProps {
  shopperId: uuid;
}

const ShopperDetails: React.FC<ShopperDetailsProps> = ({ shopperId }) => {
  const { data: shopperData, isLoading: isLoadingShopper } = useShopperDetails(shopperId);
  const { data: walletData, isLoading: isLoadingWallet } = useShopperWallet(shopperId);
  const { data: ordersData, isLoading: isLoadingOrders } = useShopperOrders(shopperId);
  const userId = shopperData?.shoppers[0]?.user_id;
  const { data: fullDetails, isLoading: isLoadingFullDetails } = useShopperFullDetails(userId || '');
  const updateShopperStatus = useUpdateShopperStatus();

  const shopper = shopperData?.shoppers[0];
  const user = shopperData?.Users[0];
  const wallet = walletData?.Wallets[0];
  const orders = ordersData?.Orders || [];
  const detailedShopper = fullDetails?.shoppers[0];

  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(1);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase() || 'NA';
  };

  const formatTransactionId = (id: string, type: string, created_at: string) => {
    const date = new Date(created_at);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const typePrefix = type.slice(0, 3).toUpperCase();
    const shortId = id.slice(-4);
    
    return `TXN${year}${month}${day}-${typePrefix}-${shortId}`;
  };

  if (isLoadingShopper || isLoadingWallet || isLoadingOrders || isLoadingFullDetails) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!shopper || !user) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Shopper not found.</p>
        </div>
      </AdminLayout>
    );
  }

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  // Calculate total earnings from completed orders
  const totalEarnings = orders
    .filter((order: Order) => order.status === 'delivered')
    .reduce((sum: number, order: Order) => sum + parseFloat(order.total), 0);

  // Calculate pending payouts from orders in progress
  const pendingPayouts = orders
    .filter((order: Order) => ['accepted', 'picked_up', 'on_the_way'].includes(order.status))
    .reduce((sum: number, order: Order) => sum + parseFloat(order.total), 0);

  const handleApprove = async () => {
    try {
      await updateShopperStatus.mutateAsync({
        shopper_id: shopper.id,
        status: 'approved',
        active: true,
        background_check_completed: true
      });
    } catch (error) {
      console.error('Error approving shopper:', error);
    }
  };

  const handleReject = async () => {
    try {
      await updateShopperStatus.mutateAsync({
        shopper_id: shopper.id,
        status: 'rejected',
        active: false,
        background_check_completed: false
      });
    } catch (error) {
      console.error('Error rejecting shopper:', error);
    }
  };

  const calculateAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  // Pagination calculations
  const paginateData = <T extends any>(data: T[], page: number): T[] => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  const getPageCount = (totalItems: number) => Math.ceil(totalItems / ITEMS_PER_PAGE);

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const pageCount = getPageCount(totalItems);
    if (pageCount <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pageCount}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Get paginated data
  const paginatedOrders = paginateData(orders, ordersPage);
  const paginatedTransactions = paginateData(wallet?.Wallet_Transactions || [], transactionsPage);
  const paginatedRatings = paginateData(detailedShopper?.User?.Ratings || [], ratingsPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <PageHeader 
          title={shopper.full_name}
          description={`${user.email} • ${user.phone}`}
          actions={
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Shopper Details</DialogTitle>
                    <DialogDescription>
                      Complete information about the shopper including ratings and reviews
                    </DialogDescription>
                  </DialogHeader>
                  
                  {isLoadingFullDetails ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : detailedShopper ? (
                    <div className="space-y-6">
                      {/* Personal Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Full Name</p>
                              <p className="font-medium">{detailedShopper.full_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{detailedShopper.phone_number}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-medium">{detailedShopper.User.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Gender</p>
                              <p className="font-medium capitalize">{detailedShopper.User.gender}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p className="font-medium">{detailedShopper.address}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Transport Mode</p>
                              <p className="font-medium capitalize">{detailedShopper.transport_mode}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Documents */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Employment ID</p>
                              <p className="font-medium">{detailedShopper.Employment_id}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">National ID</p>
                              <p className="font-medium">{detailedShopper.national_id}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground mb-2">Driving License</p>
                              {detailedShopper.driving_license ? (
                                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border">
                                  <img 
                                    src={detailedShopper.driving_license} 
                                    alt="Driving License"
                                    className="object-contain w-full h-full"
                                  />
                                </div>
                              ) : (
                                <p className="font-medium text-muted-foreground">Not provided</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Ratings & Reviews */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Ratings & Reviews</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-6">
                            <div className="flex items-center gap-2">
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-2xl font-bold">
                                {calculateAverageRating(detailedShopper.User.Ratings)}
                              </span>
                              <span className="text-muted-foreground">
                                ({detailedShopper.User.Ratings.length} reviews)
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {detailedShopper.User.Ratings.map((rating) => (
                              <div key={rating.id} className="border-b pb-4">
                                <div className="flex justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{rating.rating}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(rating.created_at), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">{rating.review}</p>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Delivery</p>
                                    <p>{rating.delivery_experience}/5</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Packaging</p>
                                    <p>{rating.packaging_quality}/5</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Professionalism</p>
                                    <p>{rating.professionalism}/5</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Failed to load shopper details
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {shopper.status === 'pending' && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100">
                        Reject Application
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Shopper Application</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject this shopper application? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject} className="bg-red-600">
                          Reject Application
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700">
                        Approve Application
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve Shopper Application</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will approve the shopper application and allow them to start accepting orders. Please ensure you have reviewed all the necessary documents.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove} className="bg-green-600">
                          Approve Application
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              {shopper.status === 'approved' && (
                <Button variant="outline" className="bg-red-50 text-red-600 hover:bg-red-100" onClick={() => handleReject()}>
                  Suspend Account
                </Button>
              )}
              <Button>Send Message</Button>
            </div>
          }
        />

        {/* Profile Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profile_picture || shopper.profile_photo || undefined} />
                <AvatarFallback className="text-lg">{getInitials(shopper.full_name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{shopper.full_name}</h2>
                <p className="text-muted-foreground">{shopper.Employment_id}</p>
                <p className="text-muted-foreground">{shopper.phone_number}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className={user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge className={shopper.background_check_completed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {shopper.background_check_completed ? "Background Check Completed" : "Background Check Pending"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {shopper.transport_mode}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="wallet" className="space-y-4">
          <TabsList>
            <TabsTrigger value="wallet">Wallet & Earnings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="ratings">Ratings & Reviews</TabsTrigger>
          </TabsList>

          {/* Wallet Tab */}
          <TabsContent value="wallet">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(wallet?.available_balance || "0")}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reserved Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(wallet?.reserved_balance || "0")}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalEarnings.toString())}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(pendingPayouts.toString())}</div>
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
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.OrderID}</TableCell>
                      <TableCell>{format(new Date(order.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                      <TableCell>{order.User?.name}</TableCell>
                      <TableCell>
                        <Badge className={
                          order.status === "delivered" ? "bg-green-100 text-green-800" :
                          order.status === "cancelled" ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>{order.Shop?.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPagination(ordersPage, orders.length, setOrdersPage)}
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
                  {paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {formatTransactionId(transaction.id, transaction.type, transaction.created_at)}
                      </TableCell>
                      <TableCell>{format(new Date(transaction.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <Badge className={
                          transaction.status === "completed" ? "bg-green-100 text-green-800" :
                          transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.related_order_id && transaction.Order ? (
                          <Button variant="ghost" size="sm">
                            #{transaction.Order.OrderID} ({transaction.Order.status})
                          </Button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {renderPagination(transactionsPage, wallet?.Wallet_Transactions?.length || 0, setTransactionsPage)}
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
                      ({detailedShopper?.User?.Ratings?.length || 0} reviews)
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {paginatedRatings.map((rating) => (
                    <div key={rating.id} className="border-b pb-6">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{rating.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(rating.created_at), "MMM d, yyyy")}
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
                  ))}
                  {(!detailedShopper?.User?.Ratings || detailedShopper.User.Ratings.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                      No ratings yet
                    </div>
                  )}
                </div>
                {renderPagination(ratingsPage, detailedShopper?.User?.Ratings?.length || 0, setRatingsPage)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ShopperDetails; 