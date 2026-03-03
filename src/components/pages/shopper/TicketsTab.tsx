import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface TicketsTabProps {
  paginatedTickets: any[];
  ticketsPage: number;
  totalTickets: number;
  setTicketsPage: (page: number) => void;
  renderPagination: (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

const TicketsTab: React.FC<TicketsTabProps> = ({
  paginatedTickets,
  ticketsPage,
  totalTickets,
  setTicketsPage,
  renderPagination,
}) => {
  return (
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
                  <TableCell>{format(new Date(ticket.created_on), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(ticket.update_on), 'MMM d, yyyy')}</TableCell>
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
  );
};

export default TicketsTab;
