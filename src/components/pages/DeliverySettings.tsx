import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useSystemConfig } from "@/hooks/useHasuraApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hasuraRequest } from "@/lib/hasura";

const UPDATE_SYSTEM_CONFIG = `
  mutation UpdateSystemConfig($id: uuid!, $config: System_configuratioins_set_input!) {
    update_System_configuratioins_by_pk(pk_columns: {id: $id}, _set: $config) {
      id
    }
  }
`;

const DeliverySettings = () => {
  const { data: systemConfig, isLoading } = useSystemConfig();
  const config = systemConfig?.System_configuratioins[0];
  const queryClient = useQueryClient();

  const { mutate: updateConfig, isPending: isUpdating } = useMutation({
    mutationFn: async (values: any) => {
      if (!config?.id) throw new Error("No configuration found");
      return hasuraRequest(UPDATE_SYSTEM_CONFIG, {
        id: config.id,
        config: values
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] });
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    }
  });

  const handleSave = () => {
    if (!config) return;
    
    const formElements = document.querySelectorAll('input');
    const values: any = {};
    
    formElements.forEach((element: any) => {
      if (element.type === 'checkbox') {
        values[element.id] = element.checked;
      } else if (element.type === 'number') {
        values[element.id] = element.value;
      } else {
        values[element.id] = element.value;
      }
    });

    updateConfig(values);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Delivery Settings" 
        description="Configure delivery options and pricing rules."
        actions={
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        }
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
                    <Label htmlFor="shoppingTime">Shopping Time (minutes)</Label>
                    <Input 
                      id="shoppingTime" 
                      type="number" 
                      defaultValue={config?.shoppingTime} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input 
                      id="currency" 
                      defaultValue={config?.currency} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enableRush" 
                    defaultChecked={config?.enableRush} 
                  />
                  <Label htmlFor="enableRush">Enable Rush Hour Surcharge</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="allowScheduledDeliveries" 
                    defaultChecked={config?.allowScheduledDeliveries} 
                  />
                  <Label htmlFor="allowScheduledDeliveries">Allow Scheduled Deliveries</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="discounts" 
                    defaultChecked={config?.discounts} 
                  />
                  <Label htmlFor="discounts">Enable Discounts</Label>
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
                  <Label htmlFor="baseDeliveryFee">Base Delivery Fee</Label>
                  <Input 
                    id="baseDeliveryFee" 
                    type="number" 
                    defaultValue={config?.baseDeliveryFee} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceFee">Service Fee (%)</Label>
                  <Input 
                    id="serviceFee" 
                    type="number" 
                    defaultValue={config?.serviceFee} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="distanceSurcharge">Distance Surcharge</Label>
                  <Input 
                    id="distanceSurcharge" 
                    type="number" 
                    defaultValue={config?.distanceSurcharge} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cappedDistanceFee">Capped Distance Fee</Label>
                  <Input 
                    id="cappedDistanceFee" 
                    type="number" 
                    defaultValue={config?.cappedDistanceFee} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="unitsSurcharge">Units Surcharge</Label>
                  <Input 
                    id="unitsSurcharge" 
                    type="number" 
                    defaultValue={config?.unitsSurcharge} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extraUnits">Extra Units Fee</Label>
                  <Input 
                    id="extraUnits" 
                    type="number" 
                    defaultValue={config?.extraUnits} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="suggestedMinimumTip">Suggested Minimum Tip</Label>
                  <Input 
                    id="suggestedMinimumTip" 
                    type="number" 
                    defaultValue={config?.suggestedMinimumTip} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rushHourSurcharge">Rush Hour Surcharge</Label>
                  <Input 
                    id="rushHourSurcharge" 
                    type="number" 
                    defaultValue={config?.rushHourSurcharge} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rushHours">Rush Hours (comma separated, 24h format)</Label>
                <Input 
                  id="rushHours" 
                  defaultValue={config?.rushHours || ""} 
                  placeholder="11:30-13:30, 17:00-19:00"
                />
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

