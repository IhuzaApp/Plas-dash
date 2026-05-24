import React, { useState } from 'react';
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
import { Edit, Trash2, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';

export interface InventoryItem {
  id: string;
  productName_id?: string;
  name: string;
  barcode?: string;
  category?: string;
  price: number;
  stock: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  description?: string;
  measurement_unit?: string;
  sku?: string;
  supplier?: string;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  hasEditAction: boolean;
  hasDeleteAction: boolean;
  formatCurrency: (amount: number) => string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'in-stock':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200">
          In Stock
        </Badge>
      );
    case 'low-stock':
      return (
        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200">
          Low Stock
        </Badge>
      );
    case 'out-of-stock':
      return (
        <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-200">
          Out of Stock
        </Badge>
      );
    default:
      return null;
  }
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onEdit,
  onDelete,
  hasEditAction,
  hasDeleteAction,
  formatCurrency,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when items change (e.g. from filtering)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-foreground h-12">Product</TableHead>
                <TableHead className="font-semibold text-foreground h-12">Barcode / SKU</TableHead>
                <TableHead className="font-semibold text-foreground h-12">Category</TableHead>
                <TableHead className="font-semibold text-foreground h-12">Supplier</TableHead>
                <TableHead className="text-right font-semibold text-foreground h-12">
                  Price
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground h-12">
                  Stock
                </TableHead>
                <TableHead className="font-semibold text-foreground h-12">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground h-12 pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length > 0 ? (
                paginatedItems.map(item => (
                  <TableRow
                    key={item.id}
                    className="group hover:bg-muted/30 transition-all duration-200 ease-in-out border-b last:border-0"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center space-x-4">
                        {item.image ? (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden border shadow-sm shrink-0 bg-white">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 border border-dashed border-muted-foreground/30 shadow-sm">
                            <ShoppingBag className="w-5 h-5 text-muted-foreground/60" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground whitespace-nowrap tracking-tight">
                            {item.name}
                          </span>
                          {item.measurement_unit && (
                            <span className="text-xs text-muted-foreground capitalize mt-0.5">
                              {item.measurement_unit}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap py-3">
                      <div className="flex flex-col gap-1">
                        {item.barcode && (
                          <span className="bg-muted px-2 py-0.5 rounded-md w-fit border shadow-sm font-medium">
                            {item.barcode}
                          </span>
                        )}
                        {item.sku && (
                          <span className="text-muted-foreground tracking-wider">{item.sku}</span>
                        )}
                        {!item.barcode && !item.sku && (
                          <span className="text-muted-foreground/50 italic">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {item.category ? (
                        <Badge
                          variant="outline"
                          className="font-medium bg-background/50 text-foreground/80 shadow-sm border-dashed"
                        >
                          {item.category}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-foreground/80">
                          {item.supplier || (
                            <span className="text-muted-foreground/50 italic">-</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <span className="font-bold text-foreground tracking-tight">
                        {formatCurrency(item.price)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <span className="font-semibold text-foreground">{item.stock}</span>
                    </TableCell>
                    <TableCell className="py-3">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right py-3 pr-6">
                      <div className="flex justify-end space-x-2">
                        {hasEditAction && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-full transition-colors"
                            onClick={() => onEdit(item)}
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasDeleteAction && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 rounded-full transition-colors"
                            onClick={() => onDelete(item.id)}
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mb-4 text-muted-foreground/30" />
                      <p className="text-lg font-medium text-foreground">
                        No inventory items found
                      </p>
                      <p className="text-sm">
                        Try adjusting your search or filters to find what you&apos;re looking for.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modern Pagination Controls */}
      {items.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span>{' '}
            to{' '}
            <span className="text-foreground">
              {Math.min(currentPage * itemsPerPage, items.length)}
            </span>{' '}
            of <span className="text-foreground">{items.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-full"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show sliding window of pages around current page
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) {
                    pageNum =
                      currentPage -
                      3 +
                      i +
                      (currentPage + 2 > totalPages ? totalPages - currentPage - 2 : 0);
                  }
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    className={`h-9 w-9 p-0 rounded-full font-medium ${currentPage !== pageNum ? 'text-muted-foreground hover:text-foreground' : 'shadow-sm'}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-full"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
