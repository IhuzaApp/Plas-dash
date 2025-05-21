
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const companyData = [
  { name: "Jan", amount: 4000 },
  { name: "Feb", amount: 3000 },
  { name: "Mar", amount: 5000 },
  { name: "Apr", amount: 2780 },
  { name: "May", amount: 6890 },
  { name: "Jun", amount: 8390 },
];

const transactions = [
  { id: "TRX-1234", date: "2023-05-20", description: "Platform Fee", amount: "$2,450.00", type: "Credit" },
  { id: "TRX-1235", date: "2023-05-19", description: "Shopper Payment", amount: "$1,200.00", type: "Debit" },
  { id: "TRX-1236", date: "2023-05-18", description: "Sales Commission", amount: "$345.50", type: "Credit" },
  { id: "TRX-1237", date: "2023-05-17", description: "Refund Processing", amount: "$120.00", type: "Debit" },
  { id: "TRX-1238", date: "2023-05-16", description: "Platform Fee", amount: "$1,850.00", type: "Credit" },
];

const shopperWallets = [
  { id: 1, shopper: "Alex Johnson", balance: "$1,245.00", earnings: "$12,450.00", pendingPayment: "$245.00", status: "Active" },
  { id: 2, shopper: "Maria Garcia", balance: "$850.75", earnings: "$8,950.00", pendingPayment: "$0.00", status: "Active" },
  { id: 3, shopper: "David Kim", balance: "$0.00", earnings: "$7,800.00", pendingPayment: "$420.00", status: "Inactive" },
  { id: 4, shopper: "Lisa Chen", balance: "$523.50", earnings: "$9,340.00", pendingPayment: "$100.00", status: "Active" },
  { id: 5, shopper: "James Wilson", balance: "$1,890.25", earnings: "$15,780.00", pendingPayment: "$180.00", status: "Active" },
];

const Wallets = () => {
  return (
    <AdminLayout>
      <PageHeader 
        title="Wallets" 
        description="Manage company and shopper wallets."
      />
      
      <Tabs defaultValue="company">
        <TabsList className="mb-4">
          <TabsTrigger value="company">Company Wallet</TabsTrigger>
          <TabsTrigger value="shoppers">Shopper Wallets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Total Balance</div>
                <div className="text-3xl font-bold">$45,245.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Monthly Revenue</div>
                <div className="text-3xl font-bold">$12,345.00</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Pending Payouts</div>
                <div className="text-3xl font-bold">$5,280.00</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={companyData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === "Credit" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {transaction.type}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="shoppers">
          <div className="space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">Shopper Wallets</h2>
              <Button>Process Payouts</Button>
            </div>
            
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shopper</TableHead>
                    <TableHead>Current Balance</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Pending Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shopperWallets.map((wallet) => (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-medium">{wallet.shopper}</TableCell>
                      <TableCell>{wallet.balance}</TableCell>
                      <TableCell>{wallet.earnings}</TableCell>
                      <TableCell>{wallet.pendingPayment}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          wallet.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {wallet.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View History</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default Wallets;
