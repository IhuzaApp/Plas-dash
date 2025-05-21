
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Shopper {
  id: string;
  name: string;
  orders: number;
  rating: number;
  earnings: string;
  status: "active" | "offline" | "busy";
}

const shoppers: Shopper[] = [
  {
    id: "SHP-001",
    name: "Michael Taylor",
    orders: 124,
    rating: 4.9,
    earnings: "$1,245",
    status: "active",
  },
  {
    id: "SHP-002",
    name: "Sarah Johnson",
    orders: 98,
    rating: 4.8,
    earnings: "$990",
    status: "busy",
  },
  {
    id: "SHP-003",
    name: "David Chen",
    orders: 87,
    rating: 4.7,
    earnings: "$870",
    status: "active",
  },
  {
    id: "SHP-004",
    name: "Lisa Garcia",
    orders: 76,
    rating: 4.6,
    earnings: "$760",
    status: "offline",
  },
];

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  offline: "bg-gray-500",
  busy: "bg-orange-500",
};

const TopShoppers = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Shoppers</CardTitle>
        <CardDescription>This month's top performing shoppers</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-0">
          {shoppers.map((shopper) => (
            <div
              key={shopper.id}
              className="flex items-center justify-between px-6 py-3 hover:bg-muted/50"
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {shopper.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium flex items-center">
                    {shopper.name}
                    <span
                      className={`ml-2 w-2 h-2 rounded-full ${
                        statusColors[shopper.status]
                      }`}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {shopper.orders} orders
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{shopper.earnings}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-end">
                  <span className="mr-1">⭐</span>
                  {shopper.rating}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopShoppers;
