# Fine-Grained Privilege System Documentation

## Overview

The Plas Dashboard implements a comprehensive Role-Based Access Control (RBAC) system with fine-grained permissions at both module and action levels. This system allows precise control over what each staff member can access and perform within the application.

## System Architecture

### 1. Privilege Structure

Each user has privileges organized by **modules** and **actions**:

```typescript
interface UserPrivileges {
  checkout?: ModulePrivileges;
  staff_management?: ModulePrivileges;
  inventory?: ModulePrivileges;
  // ... more modules
}

interface ModulePrivileges {
  access: boolean;           // Can access the module/page
  [key: string]: boolean;    // Specific actions within the module
}
```

### 2. Available Modules

| Module | Description | Key Actions |
|--------|-------------|-------------|
| `checkout` | Point of sale operations | `access`, `delete_pending_orders`, `apply_discount` |
| `staff_management` | Staff account management | `access`, `view_accounts`, `add_new_staff` |
| `inventory` | Product inventory management | `access`, `add_products`, `edit_products`, `delete_products` |
| `transactions` | Financial transaction management | `access`, `view`, `refund`, `export` |
| `discounts` | Discount and promotion management | `access`, `create_discount`, `delete_discount` |
| `company_dashboard` | Company-wide analytics | `access`, `view_reports`, `export_reports` |
| `shop_dashboard` | Shop-specific analytics | `access`, `view_sales_data`, `manage_daily_targets` |
| `financial_overview` | Financial reporting | `access`, `view_profits`, `export_financial_data` |
| `pos_terminal` | POS terminal operations | `access`, `park_sale`, `hold_order`, `resume_order` |
| `orders` | Order management | `access`, `view_orders`, `create_orders`, `edit_orders` |
| `products` | Product catalog management | `access`, `add_products`, `edit_products`, `delete_products` |
| `users` | Customer account management | `access`, `view_users`, `add_users`, `edit_users` |
| `shops` | Shop location management | `access`, `view_shops`, `add_shops`, `edit_shops` |
| `shoppers` | Shopper account management | `access`, `view_shoppers`, `add_shoppers`, `edit_shoppers` |
| `settings` | System configuration | `access`, `view_settings`, `edit_settings` |
| `refunds` | Refund processing | `access`, `view_refunds`, `process_refunds` |
| `tickets` | Support ticket management | `access`, `view_tickets`, `create_tickets`, `edit_tickets` |
| `help` | Help center access | `access`, `view_help`, `search_help` |
| `wallet` | Wallet management | `access`, `view_wallets`, `process_payouts` |
| `promotions` | Promotion management | `access`, `view_promotions`, `create_promotions` |
| `delivery_settings` | Delivery configuration | `access`, `view_delivery_settings`, `edit_delivery_settings` |

## Usage Guide

### 1. Basic Privilege Checking

Use the `usePrivilege` hook to check permissions:

```typescript
import { usePrivilege } from '@/hooks/usePrivilege';

function MyComponent() {
  const { hasModuleAccess, hasAction, isSuperUser } = usePrivilege();
  
  // Check module access
  const canAccessCheckout = hasModuleAccess('checkout');
  
  // Check specific action
  const canDeleteOrders = hasAction('checkout', 'delete_pending_orders');
  
  // Check if user is super user (has all major permissions)
  const isAdmin = isSuperUser();
  
  return (
    <div>
      {canAccessCheckout && <CheckoutComponent />}
      {canDeleteOrders && <DeleteOrdersButton />}
    </div>
  );
}
```

### 2. Route Protection

Protect entire pages or components:

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Protect page with module access
export default function CheckoutPage() {
  return (
    <ProtectedRoute requiredPrivilege="checkout">
      <CheckoutComponent />
    </ProtectedRoute>
  );
}

// Protect page with specific action
export default function StaffManagementPage() {
  return (
    <ProtectedRoute requiredPrivilege="staff_management" requiredAction="view_accounts">
      <StaffManagementComponent />
    </ProtectedRoute>
  );
}
```

### 3. UI Element Protection

Protect specific UI elements:

```typescript
import { ProtectedAction, ProtectedUI } from '@/components/auth/ProtectedRoute';

function InventoryComponent() {
  return (
    <div>
      {/* Show/hide based on permission */}
      <ProtectedAction module="inventory" action="add_products">
        <Button>Add Product</Button>
      </ProtectedAction>
      
      {/* Hide completely if no permission */}
      <ProtectedUI module="inventory" action="edit_products">
        <EditProductForm />
      </ProtectedUI>
    </div>
  );
}
```

### 4. Field-Level Control

Control form fields based on permissions:

```typescript
function ProductForm() {
  const { hasAction } = usePrivilege();
  const canEditProducts = hasAction('inventory', 'edit_products');
  
  return (
    <form>
      <Input 
        placeholder="Product Name"
        disabled={!canEditProducts}
      />
      <Input 
        placeholder="Price"
        disabled={!canEditProducts}
      />
      <Button disabled={!canEditProducts}>
        Save Product
      </Button>
    </form>
  );
}
```

### 5. Conditional Rendering

Show different UI based on permissions:

```typescript
function DashboardComponent() {
  const { hasModuleAccess, hasAction } = usePrivilege();
  
  const canViewAnalytics = hasModuleAccess('company_dashboard');
  const canExportData = hasAction('company_dashboard', 'export_reports');
  
  return (
    <div>
      {canViewAnalytics ? (
        <div>
          <AnalyticsChart />
          {canExportData && <ExportButton />}
        </div>
      ) : (
        <AccessDeniedMessage />
      )}
    </div>
  );
}
```

## Staff Management

### 1. Privilege Assignment

When creating or editing staff members, use the `PrivilegeManager` component:

```typescript
import { PrivilegeManager } from '@/components/privileges/PrivilegeManager';

function AddStaffDialog() {
  const [privileges, setPrivileges] = useState(DEFAULT_PRIVILEGES);
  
  return (
    <Dialog>
      <DialogContent>
        <PrivilegeManager 
          privileges={privileges}
          onPrivilegesChange={setPrivileges}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Privilege Templates

Use predefined privilege templates for common roles:

```typescript
// Super Admin - Full access
const SUPER_ADMIN_PRIVILEGES = {
  checkout: { access: true, delete_pending_orders: true, apply_discount: true, /* ... */ },
  staff_management: { access: true, view_accounts: true, add_new_staff: true, /* ... */ },
  // ... all modules with all actions
};

// Manager - Limited access
const MANAGER_PRIVILEGES = {
  checkout: { access: true, apply_discount: true, view_orders: true },
  inventory: { access: true, view_products: true, edit_products: true },
  // ... limited modules and actions
};

// Cashier - Basic access
const CASHIER_PRIVILEGES = {
  checkout: { access: true, view_orders: true, process_payment: true },
  // ... minimal access
};
```

## Best Practices

### 1. Always Check Permissions

```typescript
// ✅ Good - Check before rendering
{hasAction('inventory', 'delete_products') && (
  <DeleteButton onClick={handleDelete} />
)}

// ❌ Bad - Don't rely on UI hiding alone
<DeleteButton onClick={handleDelete} />
```

### 2. Use Appropriate Protection Levels

```typescript
// For entire pages
<ProtectedRoute requiredPrivilege="checkout">

// For specific actions
<ProtectedAction module="checkout" action="delete_pending_orders">

// For UI elements that should be hidden
<ProtectedUI module="checkout" action="apply_discount">
```

### 3. Provide User Feedback

```typescript
function MyComponent() {
  const { hasAction } = usePrivilege();
  const canPerformAction = hasAction('module', 'action');
  
  return (
    <div>
      {canPerformAction ? (
        <Button>Perform Action</Button>
      ) : (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to perform this action.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### 4. Handle Edge Cases

```typescript
function MyComponent() {
  const { hasModuleAccess, isSuperUser } = usePrivilege();
  
  // Super users can bypass some checks
  if (isSuperUser()) {
    return <FullAccessComponent />;
  }
  
  // Regular users need specific permissions
  if (!hasModuleAccess('checkout')) {
    return <AccessDeniedComponent />;
  }
  
  return <CheckoutComponent />;
}
```

## Debugging

### 1. Check Current Privileges

```typescript
function DebugComponent() {
  const { getAllPrivileges, isSuperUser } = usePrivilege();
  
  if (isSuperUser()) {
    return (
      <pre>
        {JSON.stringify(getAllPrivileges(), null, 2)}
      </pre>
    );
  }
  
  return null;
}
```

### 2. Common Issues

- **Sidebar items not showing**: Check if user has `access` privilege for the module
- **Buttons not appearing**: Verify the specific action privilege
- **Forms disabled**: Ensure user has edit permissions for the module
- **Access denied errors**: Check route protection and module access

### 3. Testing Privileges

```typescript
// Test specific privilege
const canDelete = hasAction('inventory', 'delete_products');
console.log('Can delete products:', canDelete);

// Test module access
const canAccessInventory = hasModuleAccess('inventory');
console.log('Can access inventory:', canAccessInventory);

// Test super user status
const isAdmin = isSuperUser();
console.log('Is super user:', isAdmin);
```

## Migration from Old System

The new system automatically converts old privilege format to the new fine-grained format during login. The conversion mapping is defined in `LoginModal.tsx`.

### Old Format
```typescript
// Old privilege format
['checkout:view', 'inventory:add_products', 'staff:view_accounts']
```

### New Format
```typescript
// New privilege format
{
  checkout: { access: true, view_orders: true },
  inventory: { access: true, add_products: true },
  staff_management: { access: true, view_accounts: true }
}
```

## Security Considerations

1. **Server-side validation**: Always validate permissions on the server side
2. **Session management**: Privileges are stored in session and expire after 8 hours
3. **Audit logging**: Log privilege changes and access attempts
4. **Least privilege**: Grant minimum required permissions
5. **Regular review**: Periodically review and update staff permissions

## API Integration

When making API calls, include privilege checks:

```typescript
async function deleteProduct(productId: string) {
  const { hasAction } = usePrivilege();
  
  if (!hasAction('inventory', 'delete_products')) {
    throw new Error('Insufficient permissions');
  }
  
  // Proceed with API call
  await api.deleteProduct(productId);
}
```

This comprehensive privilege system provides fine-grained control over user access while maintaining security and usability throughout the Plas Dashboard application. 