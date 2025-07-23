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
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface DeliveryIssuesTabProps {
  paginatedDeliveryIssues: any[];
  deliveryIssuesPage: number;
  totalDeliveryIssues: number;
  setDeliveryIssuesPage: (page: number) => void;
  renderPagination: (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void
  ) => React.ReactNode;
}

const DeliveryIssuesTab: React.FC<DeliveryIssuesTabProps> = ({
  paginatedDeliveryIssues,
  deliveryIssuesPage,
  totalDeliveryIssues,
  setDeliveryIssuesPage,
  renderPagination,
}) => {
  return (
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
                  <TableCell>{format(new Date(issue.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(issue.updated_at), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {totalDeliveryIssues === 0
                    ? 'No delivery issues found'
                    : 'Loading delivery issues...'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {renderPagination(deliveryIssuesPage, totalDeliveryIssues, setDeliveryIssuesPage)}
      </CardContent>
    </Card>
  );
};

export default DeliveryIssuesTab;
