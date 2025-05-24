import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle, RefreshCcw, Search } from "lucide-react";
import { useTickets, getTicketTitle, getTicketDate, getTicketUpdateDate, useUpdateAnyTicket, type CombinedTicket } from "@/hooks/useTickets";
import TicketDrawer from "@/components/tickets/TicketDrawer";
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

const Tickets: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, refetch } = useTickets({
    page: currentPage,
    limit: ITEMS_PER_PAGE
  });
  const { updateTicketStatus, isLoading: isUpdating } = useUpdateAnyTicket();
  const [selectedTicket, setSelectedTicket] = useState<CombinedTicket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Combine and sort all tickets by date
  const allTickets = [
    ...(data?.tickets || []),
    ...(data?.Delivery_Issues || [])
  ].sort((a, b) => {
    const dateA = new Date(getTicketDate(a));
    const dateB = new Date(getTicketDate(b));
    return dateB.getTime() - dateA.getTime();
  });

  // Filter tickets based on search query and filters
  const filteredTickets = allTickets.filter(ticket => {
    const matchesSearch = searchQuery.toLowerCase() === "" ||
      getTicketTitle(ticket).toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.type === 'support' && ticket.ticket_num.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === "all" || ticket.type === typeFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesType && matchesPriority;
  });

  const totalPages = Math.ceil(data?.totalCount || 0 / ITEMS_PER_PAGE);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Calculate page range to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    // Adjust start if we're near the end
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    return (
      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, data?.totalCount || 0)} of {data?.totalCount || 0} tickets
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {startPage > 1 && (
              <>
                <Button
                  variant={currentPage === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </Button>
                {startPage > 2 && <span className="px-2">...</span>}
              </>
            )}
            {Array.from(
              { length: endPage - startPage + 1 },
              (_, i) => startPage + i
            ).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="px-2">...</span>}
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const handleAcceptTicket = async (ticket: CombinedTicket) => {
    try {
      await updateTicketStatus(ticket, 'inReview');
      await refetch();
      setSelectedTicket(ticket);
      setDrawerOpen(true);
    } catch (error) {
      console.error('Failed to accept ticket:', error);
    }
  };

  const getTicketIdentifier = (ticket: CombinedTicket) => {
    if (ticket.type === 'support') {
      return `Support Ticket #${ticket.ticket_num}`;
    }
    return `Delivery Issue #${ticket.id.slice(0, 8)}`;
  };

  const getAcceptanceMessage = (ticket: CombinedTicket) => {
    if (ticket.type === 'support') {
      return "You will be responsible for handling this customer support ticket.";
    }
    return "You will be responsible for resolving this delivery issue.";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inreview':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Tickets"
          description="Manage support tickets and delivery issues"
        />

        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by title or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket: CombinedTicket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">
                      {ticket.type === 'support' ? `#${ticket.ticket_num}` : ticket.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {ticket.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getTicketTitle(ticket)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${getPriorityColor(ticket.priority)}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            ticket.priority.toLowerCase() === 'urgent' ? 'bg-red-500' :
                            ticket.priority.toLowerCase() === 'high' ? 'bg-orange-500' :
                            ticket.priority.toLowerCase() === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          {ticket.priority}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(getTicketDate(ticket)), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(getTicketUpdateDate(ticket)), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      {ticket.status === 'pending' || ticket.status === 'open' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                              Accept {ticket.type === 'support' ? 'Ticket' : 'Issue'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Accept {ticket.type === 'support' ? `Ticket #${ticket.ticket_num}` : `Issue #${ticket.id.slice(0, 8)}`}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to accept this {ticket.type === 'support' ? 'ticket' : 'issue'}? 
                                You will be responsible for handling it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleAcceptTicket(ticket)}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Accepting..." : "Accept"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setDrawerOpen(true);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {renderPagination()}
          </Card>
        </div>
      </div>

      <TicketDrawer
        ticket={selectedTicket}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </AdminLayout>
  );
};

export default Tickets;
