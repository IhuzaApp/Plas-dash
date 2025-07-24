'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePrivilege } from '@/hooks/usePrivilege';
import { ProtectedAction, ProtectedUI } from '@/components/auth/ProtectedRoute';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Lock,
  Unlock,
  Shield
} from 'lucide-react';

export function PrivilegeExample() {
  const { 
    hasModuleAccess, 
    hasAction, 
    getModulePrivileges, 
    isSuperUser,
    getAllPrivileges 
  } = usePrivilege();

  // Example: Check if user can access checkout module
  const canAccessCheckout = hasModuleAccess('checkout');
  const canDeleteOrders = hasAction('checkout', 'delete_pending_orders');
  const canApplyDiscount = hasAction('checkout', 'apply_discount');

  // Example: Check inventory permissions
  const canAccessInventory = hasModuleAccess('inventory');
  const canAddProducts = hasAction('inventory', 'add_products');
  const canEditProducts = hasAction('inventory', 'edit_products');
  const canDeleteProducts = hasAction('inventory', 'delete_products');

  // Example: Check staff management permissions
  const canAccessStaff = hasModuleAccess('staff_management');
  const canAddStaff = hasAction('staff_management', 'add_new_staff');
  const canEditStaff = hasAction('staff_management', 'edit_accounts');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privilege System Example
          </CardTitle>
          <CardDescription>
            This example demonstrates how to use the fine-grained privilege system for UI control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Module Access Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg border">
              <ShoppingCart className="h-4 w-4" />
              <div>
                <p className="font-medium">Checkout Access</p>
                <Badge variant={canAccessCheckout ? "default" : "secondary"}>
                  {canAccessCheckout ? "Granted" : "Denied"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg border">
              <Package className="h-4 w-4" />
              <div>
                <p className="font-medium">Inventory Access</p>
                <Badge variant={canAccessInventory ? "default" : "secondary"}>
                  {canAccessInventory ? "Granted" : "Denied"}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg border">
              <Users className="h-4 w-4" />
              <div>
                <p className="font-medium">Staff Management</p>
                <Badge variant={canAccessStaff ? "default" : "secondary"}>
                  {canAccessStaff ? "Granted" : "Denied"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Checkout Module Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checkout Module</CardTitle>
              <CardDescription>
                Example of action-level privilege checks in checkout operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Protected Action Example */}
              <ProtectedAction module="checkout" action="delete_pending_orders">
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Pending Orders
                </Button>
              </ProtectedAction>

              {/* Protected UI Example */}
              <ProtectedUI module="checkout" action="apply_discount">
                <div className="space-y-2">
                  <Label htmlFor="discount">Apply Discount</Label>
                  <div className="flex gap-2">
                    <Input id="discount" placeholder="Enter discount code" />
                    <Button>Apply</Button>
                  </div>
                </div>
              </ProtectedUI>

              {/* Conditional rendering based on privileges */}
              {canDeleteOrders && (
                <Alert>
                  <AlertDescription>
                    You have permission to delete pending orders. Use this feature carefully.
                  </AlertDescription>
                </Alert>
              )}

              {!canApplyDiscount && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    You don't have permission to apply discounts. Contact an administrator.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Inventory Module Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inventory Management</CardTitle>
              <CardDescription>
                Example of field-level privilege control in inventory operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input 
                    id="product-name" 
                    placeholder="Enter product name"
                    disabled={!canEditProducts}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="product-price">Price</Label>
                  <Input 
                    id="product-price" 
                    type="number" 
                    placeholder="0.00"
                    disabled={!canEditProducts}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <ProtectedAction module="inventory" action="add_products">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </ProtectedAction>

                <ProtectedAction module="inventory" action="edit_products">
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Product
                  </Button>
                </ProtectedAction>

                <ProtectedAction module="inventory" action="delete_products">
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                </ProtectedAction>
              </div>

              {/* Show different UI based on permissions */}
              {canAddProducts && canEditProducts && canDeleteProducts ? (
                <Alert>
                  <Unlock className="h-4 w-4" />
                  <AlertDescription>
                    You have full inventory management permissions.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Limited inventory permissions. Some actions are restricted.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Staff Management Example */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff Management</CardTitle>
              <CardDescription>
                Example of privilege-based form field control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-name">Staff Name</Label>
                  <Input 
                    id="staff-name" 
                    placeholder="Enter staff name"
                    disabled={!canEditStaff}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input 
                    id="staff-email" 
                    type="email" 
                    placeholder="staff@example.com"
                    disabled={!canEditStaff}
                  />
                </div>
              </div>

              <ProtectedAction module="staff_management" action="add_new_staff">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Staff Member
                </Button>
              </ProtectedAction>

              {!canAddStaff && (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    You don't have permission to add new staff members.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Debug Information */}
          {isSuperUser() && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Debug Information (Super User Only)</CardTitle>
                <CardDescription>
                  Current privilege state for debugging
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(getAllPrivileges(), null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 