# Plas Dashboard

A modern, feature-rich dashboard for managing delivery operations, point of sale, and financial transactions.

## Features

### 📊 Real-time Analytics Dashboard

- **Key Performance Metrics**
  - Total revenue tracking with trend indicators
  - Order volume statistics
  - Active plasa monitoring
  - Pending order alerts
- **Interactive Charts**
  - Revenue trends visualization
  - Order volume analysis
  - Performance metrics over time
  - Customizable date ranges

### 🛍️ Order Management

- **Order Tracking**
  - Real-time order status updates
  - Detailed order history
  - Automated notifications
  - Order priority management

- **Order Processing**
  - Multi-step order workflow
  - Order assignment to plasas
  - Delivery time estimation
  - Customer communication tools

### 💰 Financial Management

- **Wallet System**
  - Company and plasa wallet management
  - Real-time balance tracking
  - Transaction history
  - Multi-currency support

- **Payment Processing**
  - Multiple payment methods (bank, card, wallet)
  - Automated payout system
  - Transaction reconciliation
  - Fee calculation and management

### 🏪 Point of Sale (POS)

- **Company Dashboard**
  - Multi-store performance tracking
  - Revenue vs target monitoring
  - Store-wise analytics
  - Inventory status across locations

- **Shop Dashboard**
  - Real-time sales tracking
  - Inventory management
  - Staff performance metrics
  - Category-wise sales analysis

- **POS Checkout System**
  - Real-time cart management
  - Product search by SKU/barcode
  - Manual product entry with dial pad
  - Multiple payment methods (Cash, Card, MOMO)
  - TIN number support for invoices
  - Pending checkout management (24-hour storage)
  - Real-time customer display screen

- **Customer Display Screen**
  - Second screen functionality for customer visibility
  - Real-time order updates via localStorage synchronization
  - Professional 2-column layout (Order Details + Transaction Details)
  - Currency formatting based on system configuration
  - Responsive design optimized for device displays
  - MOMO payment integration with QR code scanning

- **MOMO Payment Integration**
  - USSD code generation for mobile money payments
  - QR code generation with tel: protocol for direct dialing
  - Customer display popup for payment instructions
  - Real-time payment status updates
  - Professional black and white design theme

### 🚚 Delivery Operations

- **Plasa Management**
  - Performance tracking and ranking
  - Real-time availability status
  - Earnings management
  - Rating system

- **Delivery Settings**
  - Zone-based delivery configuration
  - Dynamic pricing rules
  - Time slot management
  - Rush hour settings

### 🎯 Customer Support

- **Ticket System**
  - Issue tracking and resolution
  - Customer feedback management
  - Response time monitoring
  - Priority-based routing

## Forms and Data Management

### 1. Delivery Configuration Forms

- **General Settings**
  - Shopping time configuration
  - Currency settings
  - Rush hour management
  - Scheduled delivery options

- **Fee Structure**
  - Base delivery fee
  - Service fee percentage
  - Distance-based surcharges
  - Unit-based pricing
  - Rush hour surcharges
  - Commission settings

- **Time Slot Management**
  - Operating hours
  - Peak hours configuration
  - Delivery window settings
  - Capacity planning

### 2. Wallet Management Forms

- **Payout Processing**
  - User selection
  - Amount validation
  - Payment method selection
  - Notes and documentation
  - Multi-currency support

### 3. Settings Forms

- **Company Settings**
  - Business information
  - Contact details
  - Address management
  - Timezone configuration

- **Platform Settings**
  - System-wide defaults
  - Currency preferences
  - Date format settings
  - Registration controls
  - Maintenance mode

### 4. POS Checkout Forms

- **Product Selection**
  - Manual product entry with dial pad interface
  - SKU/barcode scanning support
  - Real-time product search and filtering
  - Category-based product organization

- **Payment Processing**
  - Multiple payment method selection (Cash, Card, MOMO)
  - TIN number input for invoice generation
  - Real-time total calculation with tax
  - Print invoice functionality with company branding

- **Customer Display Management**
  - Second screen window management
  - Real-time data synchronization
  - Payment method display
  - Order status updates

## Dashboard Components

### 1. Main Analytics Dashboard

- **Stat Cards**
  - Total Revenue
  - Order Count
  - Active Plasas
  - Pending Orders

- **Charts and Graphs**
  - Revenue trends
  - Order volume analysis
  - Plasa performance
  - Category distribution

### 2. Company Admin Dashboard

- **Store Performance**
  - Revenue by location
  - Target vs actual analysis
  - Trend indicators
  - Performance rankings

- **Inventory Status**
  - Stock levels by category
  - Low stock alerts
  - Category performance
  - Reorder suggestions

### 3. Shop Dashboard

- **Sales Metrics**
  - Daily/weekly/monthly sales
  - Category-wise breakdown
  - Staff performance
  - Peak hours analysis

- **Inventory Tracking**
  - Stock level indicators
  - Category-wise inventory
  - Expiry tracking
  - Restock notifications

### 4. TopPlasas Dashboard

- **Performance Metrics**
  - On-time delivery percentage
  - Order volume tracking
  - Customer ratings
  - Earnings overview

- **Ranking System**
  - Performance badges
  - Time-based filters
  - Status indicators
  - Trend analysis

### 5. Customer Display Components

- **Order Display**
  - Real-time cart item updates
  - Product details with pricing
  - Category information display
  - Quantity and total calculations

- **Transaction Details**
  - Payment method selection
  - Tax breakdown and calculations
  - Order summary with totals
  - Transaction ID generation

- **MOMO Payment Dialog**
  - USSD code generation and display
  - QR code scanning for direct dialing
  - Payment amount and transaction details
  - Professional review interface

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: TanStack Query
- **API**: GraphQL with Hasura
- **Authentication**: Built-in auth system
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager
- Hasura GraphQL endpoint

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/plas-dash.git
   cd plas-dash
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   HASURA_GRAPHQL_URL=your_hasura_endpoint
   HASURA_GRAPHQL_ADMIN_SECRET=your_admin_secret
   ```

4. Start the development server:
   ```bash
   yarn dev
   ```

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check code formatting

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   └── customer-display/ # Customer display page
├── components/
│   ├── dashboard/      # Dashboard-specific components
│   ├── layout/         # Layout components
│   ├── pages/          # Page components
│   │   └── pos/        # POS-specific components
│   │       └── checkout/ # Checkout components
│   ├── customer-display/ # Customer display components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── graphql/            # GraphQL queries and mutations
└── styles/             # Global styles and Tailwind config
```

## Configuration

### Delivery Settings

Configure delivery-related settings in the admin panel:

- Base delivery fee
- Service fee
- Distance surcharge
- Rush hour settings
- Delivery zones
- Time slots

### System Settings

Manage system-wide configurations:

- Currency settings
- Payment methods
- User roles
- Notification preferences
- API integrations

## TopPlasas Performance Metrics

The TopPlasas component displays the best-performing delivery personnel based on several key metrics:

### Delivery Time Target

- Maximum acceptable delivery time: 1 hour and 30 minutes (90 minutes)
- Each delivery is tracked from order creation to completion

### Performance Calculation

1. **On-Time Delivery Percentage**
   - Primary ranking metric
   - Calculated as: (Number of on-time deliveries / Total deliveries) × 100
   - On-time means delivered within 90 minutes

2. **Order Volume**
   - Secondary ranking metric
   - Total number of completed deliveries
   - Used as a tiebreaker for same on-time percentage

3. **Customer Rating**
   - Tertiary ranking metric
   - Average of all order ratings
   - Used as final tiebreaker

### Performance Badges

Plasas are awarded badges based on their on-time delivery percentage:

| Badge         | Threshold | Description                                            | Visual Indicator |
| ------------- | --------- | ------------------------------------------------------ | ---------------- |
| 🏆 Elite      | 95%+      | Exceptional performance, consistently delivers on time | Green badge      |
| ⭐ Great      | 90-94%    | Very reliable, rarely delivers late                    | Blue badge       |
| 👍 Good       | 80-89%    | Meets expectations, generally reliable                 | Yellow badge     |
| ⚠️ Needs Work | 70-79%    | Below target, improvement needed                       | Orange badge     |
| ❌ Poor       | <70%      | Significantly below expectations                       | Red badge        |

### Time Period Filters

Users can view performance over different time periods:

- Last 7 days
- Last 14 days
- Last 30 days
- Last 90 days

### Display Information

For each top plasa, the following information is shown:

- Name and profile picture
- Performance badge
- Online/offline status
- Total orders completed
- On-time delivery percentage
- Total earnings
- Average customer rating

### Ranking Algorithm

Plasas are ranked using the following priority:

1. Highest on-time delivery percentage
2. Most orders delivered (for same on-time percentage)
3. Highest average rating (for same order count)

Only active plasas with completed deliveries in the selected time period are included in the rankings.

## Business Logic and Core Functionalities

### POS Checkout Logic

1. **Product Management Flow**
   - Product search by SKU/barcode with real-time validation
   - Manual product entry using dial pad interface
   - Cart management with quantity updates and item removal
   - Real-time price calculations with tax and discounts
   - Pending checkout storage with 24-hour expiration

2. **Payment Processing Flow**
   - Multiple payment method selection (Cash, Card, MOMO)
   - TIN number integration for invoice generation
   - Real-time total calculation including tax (8%)
   - Print invoice functionality with company branding
   - Transaction ID generation using database auto-increment

3. **Customer Display Integration**
   - Second screen window management using `window.open()`
   - Real-time data synchronization via localStorage
   - Professional 2-column layout for order and transaction details
   - Currency formatting based on system configuration
   - MOMO payment dialog integration for mobile money transactions

### Order Processing Logic

1. **Order Creation Flow**
   - Customer order submission validation
   - Automatic plasa assignment based on:
     - Current location
     - Performance rating
     - Active status
     - Current workload
   - Real-time price calculation including:
     - Base delivery fee
     - Distance surcharge
     - Rush hour multiplier
     - Service fees
     - Dynamic pricing adjustments

2. **Order Status Workflow**
   ```
   Pending → Accepted → Shopping → In Transit → Delivered
        ↓          ↓         ↓          ↓
   Cancelled   Rejected   Failed    Returned
   ```

### Financial Calculations

1. **POS Transaction Calculations**

   ```typescript
   subtotal = sum(item.price × item.quantity)
   tax = (subtotal - discount) × 0.08
   total = subtotal - discount + tax
   ```

2. **MOMO Payment Processing**

   ```typescript
   ussd_code = `*182*8*1*1426640*${Math.round(total)}#`;
   qr_content = `tel:${encodeURIComponent(ussd_code)}`;
   ```

3. **Delivery Fee Calculation**

   ```typescript
   final_fee = base_fee +
               (distance_surcharge × km) +
               (rush_hour_multiplier × base_fee) +
               (unit_surcharge × extra_units) +
               service_fee
   ```

4. **Plasa Earnings**

   ```typescript
   earnings = delivery_fee × commission_rate +
             bonus_rate × performance_multiplier +
             tips
   ```

5. **Store Commission**
   ```typescript
   store_commission = order_subtotal × store_commission_rate -
                     platform_fee -
                     payment_processing_fee
   ```

### Wallet System Logic

1. **Balance Management**
   - Real-time balance updates
   - Hold amount system for pending transactions
   - Minimum balance requirements
   - Automatic top-up thresholds

2. **Transaction Types**

   ```typescript
   enum TransactionType {
     DEPOSIT,
     WITHDRAWAL,
     PAYMENT,
     REFUND,
     COMMISSION,
     BONUS,
     ADJUSTMENT,
   }
   ```

3. **Balance Calculation**
   ```typescript
   available_balance = total_balance - hold_amount - pending_withdrawals;
   ```

### Plasa Performance Algorithm

1. **Performance Score Calculation**

   ```typescript
   performance_score = (on_time_delivery_weight × on_time_percentage) +
                      (customer_rating_weight × avg_rating) +
                      (order_volume_weight × order_count_factor) +
                      (acceptance_rate_weight × acceptance_percentage)
   ```

2. **Bonus Qualification Logic**
   ```typescript
   if (performance_score > threshold &&
       customer_rating > min_rating &&
       completed_orders > min_orders) {
     qualify_for_bonus = true
     bonus_amount = base_bonus × performance_multiplier
   }
   ```

### Inventory Management

1. **Stock Level Monitoring**
   - Real-time inventory tracking
   - Automatic reorder point calculation
   - Low stock alerts
   - Expiry date tracking

2. **Stock Optimization**
   ```typescript
   reorder_point = (average_daily_demand × lead_time_days) +
                   safety_stock_factor
   ```

### Dynamic Pricing Rules

1. **Price Adjustment Factors**
   - Time of day
   - Current demand
   - Weather conditions
   - Special events
   - Historical patterns

2. **Surge Pricing Logic**
   ```typescript
   surge_multiplier = base_multiplier +
                     (demand_factor × demand_weight) +
                     (time_factor × time_weight) +
                     (weather_factor × weather_weight)
   ```

### Delivery Zone Management

1. **Zone Assignment Logic**
   - Polygon-based zone definitions
   - Overlapping zone handling
   - Dynamic zone adjustments
   - Coverage optimization

2. **Delivery Time Estimation**
   ```typescript
   estimated_time = base_shopping_time +
                   (distance × average_speed) +
                   traffic_factor +
                   store_preparation_time
   ```

### Form Validation Logic

1. **POS Checkout Validation**

   ```typescript
   const checkoutSchema = z.object({
     cart_items: z
       .array(
         z.object({
           id: z.string(),
           name: z.string(),
           price: z.number().positive(),
           quantity: z.number().positive(),
         })
       )
       .min(1),
     payment_method: z.enum(['cash', 'card', 'momo']),
     tin_number: z.string().optional(),
     shop_id: z.string().uuid(),
     processed_by: z.string().uuid(),
   });
   ```

2. **Order Form Validation**

   ```typescript
   const orderSchema = z.object({
     delivery_address: z.string().min(10),
     contact_number: z.string().regex(/^[+]?[\d\s-]+$/),
     items: z
       .array(
         z.object({
           id: z.string(),
           quantity: z.number().positive(),
           notes: z.string().optional(),
         })
       )
       .min(1),
     payment_method: z.enum(['card', 'wallet', 'cash']),
     scheduled_time: z.date().optional(),
   });
   ```

3. **Payment Form Validation**
   ```typescript
   const paymentSchema = z.object({
     amount: z.number().positive(),
     currency: z.string().length(3),
     method: z.enum(['bank', 'card', 'wallet']),
     description: z.string().optional(),
     reference: z.string().uuid(),
   });
   ```

### Security and Access Control

1. **Role-Based Access**

   ```typescript
   enum UserRole {
     ADMIN,
     STORE_MANAGER,
     SHOPPER,
     CUSTOMER,
     SUPPORT,
   }
   ```

2. **Permission Matrix**
   ```typescript
   const permissions = {
     orders: {
       view: ['ADMIN', 'STORE_MANAGER', 'SHOPPER'],
       create: ['ADMIN', 'CUSTOMER'],
       update: ['ADMIN', 'STORE_MANAGER'],
       delete: ['ADMIN'],
     },
     finances: {
       view: ['ADMIN', 'STORE_MANAGER'],
       manage: ['ADMIN'],
     },
     settings: {
       view: ['ADMIN', 'STORE_MANAGER'],
       modify: ['ADMIN'],
     },
   };
   ```

## 🛡️ Privilege System (RBAC & Fine-Grained Access Control)

### Overview

The Plas Dashboard uses a **fine-grained, role-based access control (RBAC)** system. Each user is assigned a set of privileges that determine which modules, pages, and actions they can access or perform. Privileges are stored as a nested JSON object (`UserPrivileges`) and checked throughout the UI and backend.

---

### Privilege Structure

#### 1. **Privilege Types**

- **Module Privileges**: Each module (e.g., `products`, `orders`, `inventory`) has an `access` flag and a set of action-specific privileges.
- **Action Privileges**: Each module defines actions (e.g., `view_products`, `add_products`, `edit_products`, `delete_products`).

#### 2. **TypeScript Interfaces**

```typescript
// src/types/privileges.ts

export interface ModulePrivileges {
  access: boolean;
  [key: string]: boolean; // Action-specific privileges
}

export interface UserPrivileges {
  products?: ModulePrivileges;
  orders?: ModulePrivileges;
  inventory?: ModulePrivileges;
  // ...all other modules
}
```

#### 3. **Default Privileges**

Each module has a default privilege template, e.g.:

```typescript
export const DEFAULT_PRIVILEGES: UserPrivileges = {
  products: {
    access: false,
    view_products: false,
    add_products: false,
    edit_products: false,
    delete_products: false,
    import_products: false,
    export_products: false,
    manage_categories: false,
    view_analytics: false,
  },
  // ...other modules
};
```

---

### Privilege Assignment

#### 1. **Role-Based Privileges**

Default privileges for each role are defined in `src/lib/privileges/rolePrivileges.ts`:

```typescript
import { UserPrivileges, DEFAULT_PRIVILEGES, PrivilegeKey } from '@/types/privileges';

export const getDefaultPrivilegesForRole = (roleType: string): UserPrivileges => {
  // Start with all privileges set to false
  const privileges: UserPrivileges = {} as UserPrivileges;
  Object.keys(DEFAULT_PRIVILEGES).forEach(module => {
    privileges[module as PrivilegeKey] = {
      access: false,
      ...DEFAULT_PRIVILEGES[module as PrivilegeKey],
    };
    Object.keys(privileges[module as PrivilegeKey]!).forEach(action => {
      privileges[module as PrivilegeKey]![action] = false;
    });
  });

  switch (roleType) {
    case 'globalAdmin':
      // Full access to everything
      Object.keys(privileges).forEach(module => {
        Object.keys(privileges[module as PrivilegeKey]!).forEach(action => {
          privileges[module as PrivilegeKey]![action] = true;
        });
      });
      break;
    // ...other roles (systemAdmin, cashier, etc.)
  }
  return privileges;
};
```

- **Custom roles** can be created by toggling privileges in the UI.

#### 2. **Privilege Conversion**

- **Old format (array of strings):** `["products:view_products", "orders:create_orders"]`
- **New format (nested object):** See `UserPrivileges` above.

Conversion utilities:

```typescript
// Convert old array to new object
convertCustomPermissionsToPrivileges(customPermissions: string[]): UserPrivileges

// Convert new object to old array
convertPrivilegesToOldFormat(privileges: UserPrivileges): string[]
```

---

### Privilege Storage & Session

- Privileges are loaded on login and stored in the session (`localStorage` as `orgEmployeeSession`).
- The session includes user info and their `UserPrivileges` object.
- The session is provided to the app via `AuthContext` (`src/components/layout/RootLayout.tsx`).

---

### Privilege Checks in the UI

#### 1. **usePrivilege Hook**

Use the `usePrivilege` hook to check privileges in any component:

```typescript
import { usePrivilege } from '@/hooks/usePrivilege';

const { hasModuleAccess, hasAction } = usePrivilege();

if (hasModuleAccess('products')) {
  // User can access the products module
}

if (hasAction('products', 'add_products')) {
  // User can add products
}
```

#### 2. **Common Usage Patterns**

- **Show/hide buttons:**
  ```tsx
  {
    hasAction('products', 'add_products') && <Button>Add Product</Button>;
  }
  ```
- **Protect routes/pages:**
  ```tsx
  if (!hasModuleAccess('orders')) {
    return <Unauthorized />;
  }
  ```
- **Conditional rendering in tables:**
  ```tsx
  {
    hasAction('orders', 'edit_orders') && <Button>Edit</Button>;
  }
  ```

#### 3. **Convenience Functions**

- `hasModuleAccess(module: PrivilegeKey): boolean`
- `hasAction(module: PrivilegeKey, action: string): boolean`
- `hasAnyPrivilege(module: PrivilegeKey): boolean`
- `isSuperUser(): boolean`

---

### Privilege Management Utilities

- **Merge privileges:**  
  `mergePrivileges(base, additional): UserPrivileges`
- **Remove privileges:**  
  `removePrivileges(base, toRemove): UserPrivileges`

---

### Example: Adding a New Role

1. Define the role in `getDefaultPrivilegesForRole`.
2. Assign privileges for each module/action.
3. Use the role in the staff creation/edit dialog.

---

### Example: Protecting a Button

```tsx
import { usePrivilege } from '@/hooks/usePrivilege';
const { hasAction } = usePrivilege();

{
  hasAction('discounts', 'create_discount') && <Button>New Discount</Button>;
}
```

---

### Example: Protecting a Page

```tsx
import { usePrivilege } from '@/hooks/usePrivilege';
const { hasModuleAccess } = usePrivilege();

if (!hasModuleAccess('orders')) {
  return <Unauthorized />;
}
```

---

### How Privileges Work (End-to-End)

1. **Role is selected** (or custom privileges are set) when creating/editing a staff member.
2. **Privileges are generated** using `getDefaultPrivilegesForRole` or custom toggles.
3. **Privileges are stored** in the database and session.
4. **On login**, privileges are loaded and provided via `AuthContext`.
5. **Throughout the app**, `usePrivilege` is used to check privileges and conditionally render UI/actions.
6. **If a user tries to access a page or action they lack privileges for,** the UI hides the option or redirects them.

---

### Security Note

- **All privileged actions must be checked both in the UI and the backend.**
- The UI hides actions the user cannot perform, but backend APIs/mutations should also enforce privilege checks.

---

**For more details, see:**

- `src/types/privileges.ts`
- `src/lib/privileges/rolePrivileges.ts`
- `src/hooks/usePrivilege.ts`
- `src/components/layout/RootLayout.tsx`
- `src/lib/privileges/privilegeConverters.ts`

---

## 🔧 Project Users Privilege System

### Overview

The Plas Dashboard implements a **separate privilege system for Project Users** - system-level staff (developers, customer support, managers, and global admins) who manage the entire project/system rather than individual store operations. This system is completely separate from the store staff privilege system and ensures **no access to point-of-sale operations**.

---

## 📋 Recent Updates & Changes (Latest Implementation)

### **🆕 New Components & Files Created**

#### **1. Project Privilege System**

- **`src/types/projectPrivileges.ts`** - Project privilege interfaces and types
- **`src/lib/privileges/projectRolePrivileges.ts`** - Project role definitions and privilege assignments
- **`src/hooks/useProjectPrivilege.ts`** - Hook for project user privilege checking
- **`src/components/auth/ProtectedProjectRoute.tsx`** - Route protection for project users

#### **2. Project Users Management**

- **`src/components/pages/ProjectUsers.tsx`** - Project users management interface
- **`src/app/project-users/page.tsx`** - Project users route with protection
- **`src/graphql/ProjectUsers.graphql`** - GraphQL queries for project users

#### **3. Enhanced Protection System**

- **Updated `src/components/auth/ProtectedRoute.tsx`** - Now handles both regular and project users
- **Updated `src/components/layout/AdminSidebar.tsx`** - Added Project Users menu item
- **Updated `src/lib/privileges/menuPrivileges.ts`** - Added project users menu mapping

### **🔧 Privilege System Integration**

#### **1. Dual Authentication Support**

The system now supports **two types of users**:

```typescript
// Regular Store Staff
interface OrgEmployeeSession {
  id: string;
  username: string;
  privileges: UserPrivileges; // Store staff privileges
  orgEmployeeRoles: any;
}

// Project Users
interface ProjectUserSession {
  id: string;
  username: string;
  privileges: ProjectUserPrivileges; // Project user privileges
  isProjectUser: true;
}
```

#### **2. Privilege Conversion System**

**Updated `src/components/modals/LoginModal.tsx`** to handle privilege conversion:

```typescript
// Added to privilegeMapping object:
'project_users:access': { module: 'project_users', action: 'access' },
'project_users:view_project_users': { module: 'project_users', action: 'view_project_users' },
'project_users:add_project_users': { module: 'project_users', action: 'add_project_users' },
'project_users:edit_project_users': { module: 'project_users', action: 'edit_project_users' },
'project_users:delete_project_users': { module: 'project_users', action: 'delete_project_users' },
'project_users:view_project_user_details': { module: 'project_users', action: 'view_project_user_details' },
'project_users:manage_project_user_roles': { module: 'project_users', action: 'manage_project_user_roles' },
'project_users:view_project_user_activity': { module: 'project_users', action: 'view_project_user_activity' },

// Page Access Privileges
'pages:access': { module: 'pages', action: 'access' },
'pages:access_project_users': { module: 'pages', action: 'access_project_users' },
'pages:access_orders': { module: 'pages', action: 'access_orders' },
// ... and 24 more page access privileges
```

#### **3. Enhanced Protection Components**

```typescript
// src/components/auth/ProtectedRoute.tsx - Updated to handle both user types
export function ProtectedRoute({
  children,
  requiredPrivilege,
  requiredAction,
  fallback,
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { hasModuleAccess, hasAction, isAuthenticated } = usePrivilege();
  const { hasProjectModuleAccess, hasProjectAction, isProjectUser } = useProjectPrivilege();

  // Check both privilege systems
  const isUserAuthenticated = isAuthenticated() || isProjectUser();

  // ... privilege checking logic for both systems
}
```

### **📊 Database Integration**

#### **1. Regular User Privileges (Array Format)**

```json
["sidebar:view","checkout:access","project_users:access","pages:access_project_users",...]
```

#### **2. Project User Privileges (Object Format)**

```json
{
  "project_users": {
    "access": true,
    "view_project_users": true,
    "add_project_users": true,
    "edit_project_users": true,
    "delete_project_users": true
  },
  "pages": {
    "access": true,
    "access_project_users": true,
    "access_orders": true
  }
}
```

#### **3. Privilege Conversion Process**

1. **Login**: User logs in with array-based privileges
2. **Conversion**: `convertPrivilegesToNewFormat()` converts array to object
3. **Storage**: Privileges stored in `localStorage` as `orgEmployeeSession`
4. **Access**: `ProtectedRoute` checks converted privileges

### **🎯 Page Protection System**

#### **1. Route Protection**

```typescript
// src/app/project-users/page.tsx
export default function ProjectUsersPage() {
  return (
    <ProtectedRoute requiredPrivilege="project_users">
      <ProjectUsers />
    </ProtectedRoute>
  );
}
```

#### **2. Menu Protection**

```typescript
// src/lib/privileges/menuPrivileges.ts
export const menuPrivileges: Record<string, MenuPrivilege> = {
  'Project Users': {
    module: 'project_users',
    isProjectUser: true,
  },
  // ... other menu items
};
```

#### **3. Component Protection**

```typescript
// Conditional rendering based on privileges
const { hasAction } = usePrivilege();

{hasAction('project_users', 'add_project_users') && (
  <Button>Add Project User</Button>
)}
```

### **🔐 Security Features**

#### **1. Complete Separation**

- **Project Users**: Cannot access POS operations (except Global System Admin)
- **Store Staff**: Cannot access project management features
- **Different Privilege Systems**: No cross-contamination

#### **2. Role-Based Access Control**

- **Customer Support**: Limited store operations access
- **System Admin**: Store operations + system settings
- **Manager**: Store operations + dashboard + promotions
- **Global System Admin**: Complete access to everything

#### **3. Page-Level Security**

- **26 Page Access Privileges**: Granular control over route access
- **Module-Level Protection**: Each module has its own access controls
- **Action-Level Protection**: Specific actions within modules

### **📝 Implementation Files**

#### **Core Files**

- `src/types/projectPrivileges.ts` - Project privilege types and interfaces
- `src/lib/privileges/projectRolePrivileges.ts` - Project role definitions
- `src/lib/privileges/menuPrivileges.ts` - Menu privilege mapping
- `src/components/pages/ProjectUsers.tsx` - Project users management page
- `src/app/project-users/page.tsx` - Project users route

#### **Authentication & Protection**

- `src/hooks/useProjectPrivilege.ts` - Project user privilege checking
- `src/components/auth/ProtectedProjectRoute.tsx` - Project user route protection
- `src/components/auth/ProtectedRoute.tsx` - Enhanced dual-system protection
- `src/components/modals/LoginModal.tsx` - Updated privilege conversion

#### **Database Integration**

- `src/graphql/ProjectUsers.graphql` - Project users GraphQL queries
- `src/hooks/useHasuraApi.ts` - Project users data fetching hooks

### **🚀 Usage Examples**

#### **1. Checking Project User Privileges**

```typescript
import { useProjectPrivilege } from '@/hooks/useProjectPrivilege';

const { hasProjectModuleAccess, hasProjectAction } = useProjectPrivilege();

if (hasProjectModuleAccess('orders')) {
  // Project user can access orders module
}

if (hasProjectAction('orders', 'view_orders')) {
  // Project user can view orders
}
```

#### **2. Protecting Project User Components**

```tsx
import { ProtectedProjectRoute } from '@/components/auth/ProtectedProjectRoute';

export default function ProjectUsersPage() {
  return (
    <ProtectedProjectRoute requiredPrivilege="project_users">
      <ProjectUsers />
    </ProtectedProjectRoute>
  );
}
```

#### **3. Conditional Rendering for Project Users**

```tsx
import { useProjectPrivilege } from '@/hooks/useProjectPrivilege';

const { hasProjectAction } = useProjectPrivilege();

{
  hasProjectAction('project_users', 'add_project_users') && <Button>Add Project User</Button>;
}
```

---

### Migration & Setup

#### **Database Setup**

1. Ensure `ProjectUsers` table exists with required fields
2. Create project user accounts with appropriate roles
3. Set up project user authentication system

#### **Code Integration**

1. Import project privilege types and utilities
2. Update authentication system to handle project users
3. Implement project user session management
4. Add project user menu items and routing

#### **Testing**

1. Test project user authentication
2. Verify privilege enforcement
3. Test menu filtering and access control
4. Validate separation from store staff privileges

---

**For more details, see:**

- `src/types/projectPrivileges.ts`
- `src/lib/privileges/projectRolePrivileges.ts`
- `src/components/pages/ProjectUsers.tsx`
- `src/app/project-users/page.tsx`
- `src/graphql/ProjectUsers.graphql`

---

## 📊 Complete Privilege & Role System Summary

### **🎯 System Overview**

The Plas Dashboard implements a **dual privilege system** with complete separation between **Store Staff** and **Project Users**:

#### **🏪 Store Staff (Regular Users)**

- **Purpose**: Store-level operations (POS, inventory, transactions)
- **Database**: `orgEmployees` table
- **Privilege System**: `UserPrivileges` (array format in DB, object format in session)
- **Access**: Point-of-sale, store operations, customer management

#### **🔧 Project Users (System Staff)**

- **Purpose**: System-level management (developers, support, admins)
- **Database**: `ProjectUsers` table
- **Privilege System**: `ProjectUserPrivileges` (object format)
- **Access**: Project management, system configuration, analytics

---

### **📋 Complete Privilege Matrix**

#### **🏪 Store Staff Privileges (UserPrivileges)**

| Module                 | Access | Actions                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **checkout**           | ✅     | access, delete_pending_orders, apply_discount, view_orders, create_orders, edit_orders, cancel_orders, process_payment, view_customer_info, edit_customer_info                                                                                                                                                                                                                                                                                                                    |
| **staff_management**   | ✅     | access, view_accounts, edit_accounts, view_activity_logs, add_new_staff, delete_staff, assign_roles, view_permissions, edit_permissions                                                                                                                                                                                                                                                                                                                                           |
| **inventory**          | ✅     | access, view_products, add_products, edit_products, delete_products, import_products, export_products, manage_categories, view_stock_levels, update_stock                                                                                                                                                                                                                                                                                                                         |
| **transactions**       | ✅     | access, view, refund, export, view_details, process_refund, view_receipts, print_receipts                                                                                                                                                                                                                                                                                                                                                                                         |
| **discounts**          | ✅     | access, create_discount, delete_discount, edit_discount, view_discounts, apply_discount, manage_discount_rules                                                                                                                                                                                                                                                                                                                                                                    |
| **company_dashboard**  | ✅     | access, view_reports, export_reports, view_analytics, view_revenue_data, view_performance_metrics                                                                                                                                                                                                                                                                                                                                                                                 |
| **shop_dashboard**     | ✅     | access, view_sales_data, manage_daily_targets, view_shop_performance, view_staff_performance, view_customer_metrics                                                                                                                                                                                                                                                                                                                                                               |
| **financial_overview** | ✅     | access, view_profits, export_financial_data, view_revenue_reports, view_expense_reports, view_profit_margins                                                                                                                                                                                                                                                                                                                                                                      |
| **pos_terminal**       | ✅     | access, park_sale, hold_order, resume_order, process_sale, view_cart, edit_cart, apply_promotions                                                                                                                                                                                                                                                                                                                                                                                 |
| **orders**             | ✅     | access, view_orders, create_orders, edit_orders, delete_orders, process_orders, view_order_details, update_order_status, assign_delivery                                                                                                                                                                                                                                                                                                                                          |
| **products**           | ✅     | access, view_products, add_products, edit_products, delete_products, import_products, export_products, manage_categories, view_analytics                                                                                                                                                                                                                                                                                                                                          |
| **users**              | ✅     | access, view_users, add_users, edit_users, delete_users, view_user_details, manage_user_roles, view_user_activity                                                                                                                                                                                                                                                                                                                                                                 |
| **project_users**      | ✅     | access, view_project_users, add_project_users, edit_project_users, delete_project_users, view_project_user_details, manage_project_user_roles, view_project_user_activity                                                                                                                                                                                                                                                                                                         |
| **shops**              | ✅     | access, view_shops, add_shops, edit_shops, delete_shops, view_shop_details, manage_shop_settings, view_shop_performance                                                                                                                                                                                                                                                                                                                                                           |
| **shoppers**           | ✅     | access, view_shoppers, add_shoppers, edit_shoppers, delete_shoppers, view_shopper_details, view_shopper_orders, view_shopper_wallet, view_shopper_ratings                                                                                                                                                                                                                                                                                                                         |
| **settings**           | ✅     | access, view_settings, edit_settings, manage_system_config, view_audit_logs, manage_notifications                                                                                                                                                                                                                                                                                                                                                                                 |
| **refunds**            | ✅     | access, view_refunds, process_refunds, approve_refunds, reject_refunds, view_refund_details, export_refund_data                                                                                                                                                                                                                                                                                                                                                                   |
| **tickets**            | ✅     | access, view_tickets, create_tickets, edit_tickets, delete_tickets, assign_tickets, resolve_tickets, view_ticket_details                                                                                                                                                                                                                                                                                                                                                          |
| **help**               | ✅     | access, view_help, search_help, view_categories, view_articles                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **wallet**             | ✅     | access, view_wallets, process_payouts, view_transactions, manage_wallet_settings, view_balance, export_wallet_data                                                                                                                                                                                                                                                                                                                                                                |
| **promotions**         | ✅     | access, view_promotions, create_promotions, edit_promotions, delete_promotions, activate_promotions, deactivate_promotions, view_promotion_analytics                                                                                                                                                                                                                                                                                                                              |
| **delivery_settings**  | ✅     | access, view_delivery_settings, edit_delivery_settings, manage_delivery_zones, set_delivery_fees, configure_delivery_times                                                                                                                                                                                                                                                                                                                                                        |
| **pages**              | ✅     | access, view_pages, access_project_users, access_orders, access_shops, access_products, access_users, access_shoppers, access_settings, access_refunds, access_tickets, access_help, access_wallet, access_promotions, access_delivery_settings, access_dashboard, access_pos, access_checkout, access_staff_management, access_inventory, access_transactions, access_discounts, access_company_dashboard, access_shop_dashboard, access_financial_overview, access_pos_terminal |

#### **🔧 Project User Privileges (ProjectUserPrivileges)**

| Module                   | Access | Actions                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **orders**               | ✅     | access, view_orders, create_orders, edit_orders, delete_orders, process_orders, view_order_details, update_order_status, assign_delivery                                                                                                                                                                                                                                                                                                                                          |
| **shoppers**             | ✅     | access, view_shoppers, add_shoppers, edit_shoppers, delete_shoppers, view_shopper_details, view_shopper_orders, view_shopper_wallet, view_shopper_ratings                                                                                                                                                                                                                                                                                                                         |
| **users**                | ✅     | access, view_users, add_users, edit_users, delete_users, view_user_details, manage_user_roles, view_user_activity                                                                                                                                                                                                                                                                                                                                                                 |
| **shops**                | ✅     | access, view_shops, add_shops, edit_shops, delete_shops, view_shop_details, manage_shop_settings, view_shop_performance                                                                                                                                                                                                                                                                                                                                                           |
| **products**             | ✅     | access, view_products, add_products, edit_products, delete_products, import_products, export_products, manage_categories, view_analytics                                                                                                                                                                                                                                                                                                                                          |
| **wallet**               | ✅     | access, view_wallets, process_payouts, view_transactions, manage_wallet_settings, view_balance, export_wallet_data                                                                                                                                                                                                                                                                                                                                                                |
| **refunds**              | ✅     | access, view_refunds, process_refunds, approve_refunds, reject_refunds, view_refund_details, export_refund_data                                                                                                                                                                                                                                                                                                                                                                   |
| **tickets**              | ✅     | access, view_tickets, create_tickets, edit_tickets, delete_tickets, assign_tickets, resolve_tickets, view_ticket_details                                                                                                                                                                                                                                                                                                                                                          |
| **help**                 | ✅     | access, view_help, search_help, view_categories, view_articles                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **dashboard**            | ✅     | access, view_dashboard, view_analytics, view_reports, export_data                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **delivery_settings**    | ✅     | access, view_delivery_settings, edit_delivery_settings, manage_delivery_zones, set_delivery_fees, configure_delivery_times                                                                                                                                                                                                                                                                                                                                                        |
| **promotions**           | ✅     | access, view_promotions, create_promotions, edit_promotions, delete_promotions, activate_promotions, deactivate_promotions, view_promotion_analytics                                                                                                                                                                                                                                                                                                                              |
| **settings**             | ✅     | access, view_settings, edit_settings, manage_system_config, view_audit_logs, manage_notifications                                                                                                                                                                                                                                                                                                                                                                                 |
| **system_management**    | ✅     | access, view_system, manage_system, configure_system, monitor_system                                                                                                                                                                                                                                                                                                                                                                                                              |
| **user_management**      | ✅     | access, view_users, add_users, edit_users, delete_users, manage_roles                                                                                                                                                                                                                                                                                                                                                                                                             |
| **project_users**        | ✅     | access, view_project_users, add_project_users, edit_project_users, delete_project_users, manage_project_roles                                                                                                                                                                                                                                                                                                                                                                     |
| **analytics**            | ✅     | access, view_analytics, export_analytics, create_reports, view_insights                                                                                                                                                                                                                                                                                                                                                                                                           |
| **reporting**            | ✅     | access, view_reports, create_reports, export_reports, schedule_reports                                                                                                                                                                                                                                                                                                                                                                                                            |
| **support_management**   | ✅     | access, view_support, manage_support, assign_tickets, resolve_issues                                                                                                                                                                                                                                                                                                                                                                                                              |
| **help_management**      | ✅     | access, view_help, manage_help, create_articles, edit_articles                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **system_configuration** | ✅     | access, view_config, edit_config, manage_config, backup_config                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **global_settings**      | ✅     | access, view_settings, edit_settings, manage_settings, apply_settings                                                                                                                                                                                                                                                                                                                                                                                                             |
| **security_management**  | ✅     | access, view_security, manage_security, configure_security, monitor_security                                                                                                                                                                                                                                                                                                                                                                                                      |
| **access_control**       | ✅     | access, view_access, manage_access, configure_access, audit_access                                                                                                                                                                                                                                                                                                                                                                                                                |
| **system_monitoring**    | ✅     | access, view_monitoring, manage_monitoring, configure_monitoring, alert_monitoring                                                                                                                                                                                                                                                                                                                                                                                                |
| **audit_logs**           | ✅     | access, view_logs, export_logs, search_logs, analyze_logs                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **development_tools**    | ✅     | access, view_tools, use_tools, configure_tools, debug_tools                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **maintenance**          | ✅     | access, view_maintenance, perform_maintenance, schedule_maintenance, monitor_maintenance                                                                                                                                                                                                                                                                                                                                                                                          |
| **pages**                | ✅     | access, view_pages, access_project_users, access_orders, access_shops, access_products, access_users, access_shoppers, access_settings, access_refunds, access_tickets, access_help, access_wallet, access_promotions, access_delivery_settings, access_dashboard, access_pos, access_checkout, access_staff_management, access_inventory, access_transactions, access_discounts, access_company_dashboard, access_shop_dashboard, access_financial_overview, access_pos_terminal |

---

### **👥 Role Hierarchy & Access Levels**

#### **🏪 Store Staff Roles**

| Role                  | Store Operations | POS Operations | System Management  | Access Level      |
| --------------------- | ---------------- | -------------- | ------------------ | ----------------- |
| **Cashier**           | ✅ Basic         | ✅ Full        | ❌ None            | Limited           |
| **Store Manager**     | ✅ Full          | ✅ Full        | ❌ None            | Store Operations  |
| **Inventory Manager** | ✅ Inventory     | ✅ Limited     | ❌ None            | Inventory Focus   |
| **System Admin**      | ✅ Full          | ✅ Full        | ✅ System Settings | System Management |

#### **🔧 Project User Roles**

| Role                    | Store Operations | POS Operations | System Management  | Access Level        |
| ----------------------- | ---------------- | -------------- | ------------------ | ------------------- |
| **Customer Support**    | ✅ Basic         | ❌ None        | ❌ None            | Limited             |
| **Manager**             | ✅ Full          | ❌ None        | ❌ None            | Business Operations |
| **System Admin**        | ✅ Full          | ❌ None        | ✅ System Settings | System Management   |
| **Global System Admin** | ✅ Full          | ✅ Full        | ✅ Full            | **Complete Access** |

---

### **🔐 Security Architecture**

#### **Complete Separation (with Exception)**

- **Regular Project Users**: No POS access (Customer Support, Manager, System Admin)
- **Store Staff**: No project management access
- **Global System Admin**: **Complete access to everything** (the exception)

#### **Privilege Enforcement**

- **Module-Level**: Each module has its own access controls
- **Action-Level**: Specific actions within modules
- **Page-Level**: Route-specific permissions (26 page access privileges)
- **Component-Level**: UI element protection

#### **Authentication Flow**

1. **Login**: User authenticates with credentials
2. **Role Detection**: System determines user type (store staff vs project user)
3. **Privilege Loading**: Loads appropriate privilege system
4. **Session Creation**: Creates user session with privileges
5. **Access Control**: Enforces privileges throughout the application

---

### **📊 Database Schema**

#### **Store Staff Tables**

```sql
-- Regular staff users
orgEmployees (id, username, email, password_hash, shop_id, ...)
orgEmployeeRoles (id, privillages: string[], ...)
```

#### **Project User Tables**

```sql
-- Project users
ProjectUsers (id, username, email, password_hash, role, is_active, ...)
ProjectUserPrivileges (id, project_user_id, privileges: jsonb, ...)
```

#### **Privilege Storage**

- **Store Staff**: Array format in database, converted to object in session
- **Project Users**: Object format in database and session

---

### **🔄 Migration & Integration**

#### **Privilege Conversion**

- **Old Format**: `["checkout:access", "orders:view"]`
- **New Format**: `{ checkout: { access: true }, orders: { view_orders: true } }`
- **Conversion**: `convertPrivilegesToNewFormat()` in LoginModal

#### **Session Management**

- **Store Staff**: `orgEmployeeSession` in localStorage
- **Project Users**: `projectUserSession` in localStorage
- **Dual Support**: `ProtectedRoute` checks both systems

#### **Menu System**

- **Dynamic Filtering**: Based on user type and privileges
- **Project Users**: Only see project-relevant menu items
- **Store Staff**: Only see store-relevant menu items

---

### **📝 Implementation Summary**

#### **Files Created/Modified**

- ✅ **New Files**: 8 files for project user system
- ✅ **Updated Files**: 6 files for integration
- ✅ **Total Changes**: 14 files modified

#### **Features Implemented**

- ✅ **Dual Authentication**: Both user types supported
- ✅ **Privilege Conversion**: Array to object conversion
- ✅ **Page Protection**: Route-level security
- ✅ **Menu Protection**: Dynamic menu filtering
- ✅ **Component Protection**: UI element security
- ✅ **Database Integration**: Both privilege systems

#### **Security Achieved**

- ✅ **Complete Separation**: No cross-contamination
- ✅ **Role-Based Access**: Granular permissions
- ✅ **Page-Level Security**: Route protection
- ✅ **Component Security**: UI protection
- ✅ **Session Security**: Proper authentication

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact our team at support@example.com or open an issue in the repository.
