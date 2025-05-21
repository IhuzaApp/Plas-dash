
import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

const DeliverySettings = () => {
  return (
    <AdminLayout>
      <PageHeader 
        title="Delivery Settings" 
        description="Configure delivery options and pricing rules."
        action={<Button>Save Changes</Button>}
      />
      
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fees">Fee Structure</TabsTrigger>
          <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
          <TabsTrigger value="times">Time Slots</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic delivery settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="max-distance">Maximum Delivery Distance (miles)</Label>
                    <Input id="max-distance" type="number" defaultValue="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-order">Minimum Order Amount ($)</Label>
                    <Input id="min-order" type="number" defaultValue="15" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-fee">Default Delivery Fee ($)</Label>
                    <Input id="default-fee" type="number" defaultValue="4.99" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buffer-time">Order Preparation Buffer (minutes)</Label>
                    <Input id="buffer-time" type="number" defaultValue="30" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="rush-hour" defaultChecked />
                  <Label htmlFor="rush-hour">Enable Rush Hour Surcharge</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="auto-assign" defaultChecked />
                  <Label htmlFor="auto-assign">Auto-assign Orders to Shoppers</Label>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure additional delivery options.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="batch-orders">Maximum Orders per Batch</Label>
                    <Input id="batch-orders" type="number" defaultValue="3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reassign-time">Order Reassignment Time (minutes)</Label>
                    <Input id="reassign-time" type="number" defaultValue="5" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="contactless" defaultChecked />
                  <Label htmlFor="contactless">Enable Contactless Delivery Option</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="scheduled" defaultChecked />
                  <Label htmlFor="scheduled">Allow Scheduled Deliveries</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
              <CardDescription>Configure delivery fees and service charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="base-fee">Base Delivery Fee ($)</Label>
                  <Input id="base-fee" type="number" defaultValue="3.99" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-fee">Service Fee (%)</Label>
                  <Input id="service-fee" type="number" defaultValue="5" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="distance-fee">Per Mile Fee ($)</Label>
                  <Input id="distance-fee" type="number" defaultValue="0.50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-tip">Suggested Minimum Tip ($)</Label>
                  <Input id="min-tip" type="number" defaultValue="2" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rush-fee">Rush Hour Surcharge ($)</Label>
                <Input id="rush-fee" type="number" defaultValue="2.50" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rush-hours">Rush Hours (comma separated, 24h format)</Label>
                <Input id="rush-hours" defaultValue="11:30-13:30, 17:00-19:00" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Zones</CardTitle>
              <CardDescription>Configure service areas and zone-specific settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Delivery zones allow you to set different fees and rules for specific geographic areas.
              </p>
              <Button variant="outline">Configure Zones</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="times">
          <Card>
            <CardHeader>
              <CardTitle>Time Slots</CardTitle>
              <CardDescription>Configure available delivery time slots.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Manage available delivery time slots and capacity limits.
              </p>
              <Button variant="outline">Configure Time Slots</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default DeliverySettings;
