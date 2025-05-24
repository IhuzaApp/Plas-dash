import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { GET_ALL_TICKETS } from '@/lib/graphql/queries';
import { UPDATE_TICKET, UPDATE_DELIVERY_ISSUE } from '@/lib/graphql/mutations';

type uuid = string;

interface Ticket {
  created_on: string;
  id: uuid;
  other_user_id: uuid;
  priority: string;
  status: string;
  subject: string;
  ticket_num: string;
  update_on: string;
  user_id: uuid;
  type: 'support';
}

interface DeliveryIssue {
  created_at: string;
  description: string;
  id: uuid;
  issue_type: string;
  order_id: uuid;
  priority: string;
  shopper_id: uuid;
  status: string;
  updated_at: string;
  type: 'delivery';
}

interface TicketsResponse {
  tickets: Ticket[];
  tickets_aggregate: {
    aggregate: {
      count: number;
    };
  };
  Delivery_Issues: DeliveryIssue[];
  Delivery_Issues_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

interface TransformedTicketsResponse {
  tickets: (Ticket & { type: 'support' })[];
  Delivery_Issues: (DeliveryIssue & { type: 'delivery' })[];
  totalCount: number;
}

export type CombinedTicket = Ticket | DeliveryIssue;

interface UseTicketsParams {
  page: number;
  limit: number;
}

export function useTickets({ page, limit }: UseTicketsParams) {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;
  
  const query = useQuery<TicketsResponse, Error, TransformedTicketsResponse>({
    queryKey: ['tickets', page, limit],
    queryFn: () => hasuraRequest(GET_ALL_TICKETS, { limit, offset }),
    select: (data) => {
      // Transform tickets to add type
      const supportTickets = data.tickets.map(ticket => ({
        ...ticket,
        type: 'support' as const
      }));

      // Transform delivery issues to add type
      const deliveryIssues = data.Delivery_Issues.map(issue => ({
        ...issue,
        type: 'delivery' as const
      }));

      return {
        tickets: supportTickets,
        Delivery_Issues: deliveryIssues,
        totalCount: data.tickets_aggregate.aggregate.count + data.Delivery_Issues_aggregate.aggregate.count
      };
    }
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['tickets', page, limit] });
  };

  return { ...query, refetch };
}

// Helper function to get the title of a ticket
export function getTicketTitle(ticket: CombinedTicket): string {
  if (ticket.type === 'support') {
    return ticket.subject;
  }
  return ticket.issue_type;
}

// Helper function to get the creation date of a ticket
export function getTicketDate(ticket: CombinedTicket): string {
  if (ticket.type === 'support') {
    return ticket.created_on;
  }
  return ticket.created_at;
}

// Helper function to get the update date of a ticket
export function getTicketUpdateDate(ticket: CombinedTicket): string {
  if (ticket.type === 'support') {
    return ticket.update_on;
  }
  return ticket.updated_at;
}

interface UpdateTicketVariables {
  id: uuid;
  status: string;
  update_on: string;
}

interface UpdateDeliveryIssueVariables {
  id: uuid;
  status: string;
  updated_at: string;
}

// Hook for updating tickets
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation<unknown, Error, UpdateTicketVariables>({
    mutationFn: (variables: UpdateTicketVariables) => 
      hasuraRequest(UPDATE_TICKET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

// Hook for updating delivery issues
export function useUpdateDeliveryIssue() {
  const queryClient = useQueryClient();
  
  return useMutation<unknown, Error, UpdateDeliveryIssueVariables>({
    mutationFn: (variables: UpdateDeliveryIssueVariables) => 
      hasuraRequest(UPDATE_DELIVERY_ISSUE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

// Helper function to update any ticket type
export function useUpdateAnyTicket() {
  const updateTicket = useUpdateTicket();
  const updateDeliveryIssue = useUpdateDeliveryIssue();

  const updateTicketStatus = async (ticket: CombinedTicket, newStatus: string) => {
    const now = new Date().toISOString();
    
    if (ticket.type === 'support') {
      return updateTicket.mutateAsync({
        id: ticket.id,
        status: newStatus,
        update_on: now
      });
    } else {
      return updateDeliveryIssue.mutateAsync({
        id: ticket.id,
        status: newStatus,
        updated_at: now
      });
    }
  };

  return {
    updateTicketStatus,
    isLoading: updateTicket.isPending || updateDeliveryIssue.isPending
  };
} 