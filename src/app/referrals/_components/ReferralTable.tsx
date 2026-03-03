import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralRecord {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  referralCode: string;
  phoneVerified: boolean;
  status: string;
  created_at: string;
  User?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  stats?: {
    ordersCount: number;
    totalAmount: string;
    earnings: string;
    orders?: any[];
  };
}

interface ReferralTableProps {
  data: ReferralRecord[];
  isLoading: boolean;
  onReview: (record: ReferralRecord) => void;
}

export const ReferralTable: React.FC<ReferralTableProps> = ({ data, isLoading, onReview }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Recent Referral Logs</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search referrals..." className="pl-9 h-9" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Name</TableHead>
                <TableHead>Referral Code</TableHead>
                <TableHead>Phone / Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Volume / Earnings</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(record => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {record.name || record.User?.name || 'N/A'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {record.email || record.User?.email || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                      {record.referralCode}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{record.phone || record.User?.phone || 'N/A'}</span>
                      {record.phoneVerified ? (
                        <span className="text-[10px] text-green-600 font-medium">Verified</span>
                      ) : (
                        <span className="text-[10px] text-yellow-600 font-medium">Unverified</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        record.status === 'active'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-700'
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{record.stats?.ordersCount || 0}</span>
                      <span className="text-[10px] text-muted-foreground">Orders</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        RWF {record.stats?.totalAmount || '0.00'}
                      </span>
                      <span className="text-[10px] text-green-600 font-medium">
                        Earned: RWF {record.stats?.earnings || '0.00'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onReview(record)}>
                      {record.status === 'active' ? 'Details' : 'Review'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
