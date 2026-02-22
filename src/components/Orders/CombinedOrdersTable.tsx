import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import GroupedOrderRow from './GroupedOrderRow';

interface CombinedOrdersTableProps {
    combinedOrdersGroups: Record<string, any[]>;
    getOrderWarnings: (order: any) => any[];
    getStatusColor: (order: any) => string;
    generateShortId: (id: string) => string;
    formatCurrency: (amount: string) => string;
    getDeliveryCountdown: (time: string | null | undefined) => { text: string; exact: string | null; isOverdue: boolean };
    handleCallShopper: (phone: string) => void;
    handleViewDetails: (order: any) => void;
}

const CombinedOrdersTable: React.FC<CombinedOrdersTableProps> = ({
    combinedOrdersGroups,
    getOrderWarnings,
    getStatusColor,
    generateShortId,
    formatCurrency,
    getDeliveryCountdown,
    handleCallShopper,
    handleViewDetails,
}) => {
    return (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Combined ID</TableHead>
                        <TableHead>Shopper</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Latest Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.keys(combinedOrdersGroups).length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                                No combined orders found (groups must have more than one order).
                            </TableCell>
                        </TableRow>
                    ) : (
                        Object.entries(combinedOrdersGroups).map(([combinedId, groupedOrders]) => {
                            const firstOrder = groupedOrders[0];
                            if (!firstOrder) return null;

                            const shopper = groupedOrders.find(o => o.shopper)?.shopper;
                            const item = { combinedId, orders: groupedOrders, shopper };

                            return (
                                <GroupedOrderRow
                                    key={combinedId}
                                    item={item}
                                    getOrderWarnings={getOrderWarnings}
                                    getStatusColor={getStatusColor}
                                    generateShortId={generateShortId}
                                    formatCurrency={formatCurrency}
                                    getDeliveryCountdown={getDeliveryCountdown}
                                    handleCallShopper={handleCallShopper}
                                    handleViewDetails={handleViewDetails}
                                />
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </Card>
    );
};

export default CombinedOrdersTable;
