import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { PackageDelivery } from '@/hooks/useHasuraApi';

interface PackageOrderRowProps {
  pkg: PackageDelivery;
  onViewDetails: (pkg: any) => void;
  formatCurrency: (amount: string) => string;
}

const PackageOrderRow: React.FC<PackageOrderRowProps> = ({ pkg, onViewDetails, formatCurrency }) => {
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') return 'bg-green-100 text-green-800';
    if (s === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (s === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="text-sm">#{pkg.DeliveryCode || pkg.id.slice(0, 8)}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-0.5">
            PACKAGE
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{pkg.receiverName || 'N/A'}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {pkg.receiverPhone || 'N/A'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(pkg.status)} variant="secondary">
          {pkg.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-col max-w-[200px]">
          <span className="text-xs font-medium truncate" title={pkg.pickupLocation || ''}>
            From: {pkg.pickupLocation || 'N/A'}
          </span>
          <span className="text-xs text-muted-foreground truncate" title={pkg.dropoffLocation || ''}>
            To: {pkg.dropoffLocation || 'N/A'}
          </span>
        </div>
      </TableCell>
      <TableCell>{formatCurrency(pkg.delivery_fee || '0')}</TableCell>
      <TableCell>
        {pkg.shopper ? (
          <div className="flex flex-col">
            <span className="text-xs font-medium">{pkg.shopper.full_name}</span>
            <span className="text-[10px] text-muted-foreground">{pkg.shopper.phone_number}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">Unassigned</span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {pkg.timeAndDate ? format(new Date(pkg.timeAndDate), 'MMM d, HH:mm') : '—'}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {format(new Date(pkg.created_at), 'MMM d, HH:mm')}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" onClick={() => onViewDetails(pkg)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Details
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default PackageOrderRow;
