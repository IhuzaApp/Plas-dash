'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ReelsStatsProps {
  totalReels: number;
  reelsWithSales: number;
  totalOrders: number;
  totalSalesFormatted: string;
}

const ReelsStats: React.FC<ReelsStatsProps> = ({
  totalReels,
  reelsWithSales,
  totalOrders,
  totalSalesFormatted,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold">{totalReels}</div>
          <p className="text-muted-foreground">Total Reels</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-orange-600">{reelsWithSales}</div>
          <p className="text-muted-foreground">Reels with Sales</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
          <p className="text-muted-foreground">Total Orders</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-600">{totalSalesFormatted}</div>
          <p className="text-muted-foreground">Total Sales</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReelsStats;
