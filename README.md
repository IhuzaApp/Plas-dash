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
   ussd_code = `*182*8*1*1426640*${Math.round(total)}#`
   qr_content = `tel:${encodeURIComponent(ussd_code)}`
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
     cart_items: z.array(z.object({
       id: z.string(),
       name: z.string(),
       price: z.number().positive(),
       quantity: z.number().positive(),
     })).min(1),
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

### Project Users vs Store Staff

#### **🔧 Project Users (ProjectPrivileges)**
- **Purpose**: System-level management (developers, support, project managers, global admins)
- **Access**: Project management, system configuration, user management, analytics, etc.
- **Restriction**: **NO access to point-of-sale operations**
- **Database**: Uses `ProjectUsers` table
- **Privilege System**: Separate `ProjectPrivileges` system

#### **🏪 Store Staff (Current Privileges)**
- **Purpose**: Store-level operations (cashiers, managers, inventory, etc.)
- **Access**: Point-of-sale, inventory, transactions, etc.
- **Restriction**: Limited to store operations
- **Database**: Uses regular staff tables
- **Privilege System**: Current `UserPrivileges` system

---

### Project User Roles & Access Levels

#### **1. Customer Support**
**Access to:**
- ✅ Orders
- ✅ Plasas (Shoppers)
- ✅ Customers (Users)
- ✅ Shops
- ✅ Products
- ✅ Plasa Wallets
- ✅ Refund Claims
- ✅ Tickets
- ✅ Help Center

**Restrictions:**
- ❌ No delete operations
- ❌ No system configuration
- ❌ No security settings
- ❌ No promotions management

#### **2. System Admin**
**Access to:**
- ✅ Orders
- ✅ Plasas (Shoppers)
- ✅ Customers (Users)
- ✅ Shops
- ✅ Products
- ✅ Plasa Wallets
- ✅ Refund Claims
- ✅ Tickets
- ✅ Help Center
- ✅ Dashboard
- ✅ Delivery Settings
- ✅ Promotions
- ✅ System Settings

**Restrictions:**
- ❌ No delete operations
- ❌ No debug/maintenance operations

#### **3. Manager**
**Access to:**
- ✅ Orders
- ✅ Plasas (Shoppers)
- ✅ Customers (Users)
- ✅ Shops
- ✅ Products
- ✅ Plasa Wallets
- ✅ Refund Claims
- ✅ Tickets
- ✅ Help Center
- ✅ Dashboard
- ✅ Promotions

**Restrictions:**
- ❌ No delete operations
- ❌ No system configuration
- ❌ No delivery settings

#### **4. Project Admin (Global System Admin)**
**Access to:**
- ✅ **ALL Store Operations** (Orders, Plasas, Customers, Shops, Products, Wallets, Refunds, Tickets, Help)
- ✅ **ALL POS Operations** (Checkout, Staff Management, Inventory, Transactions, Discounts, Company Dashboard, Shop Dashboard, Financial Overview, POS Terminal)
- ✅ **ALL System Management** (System Management, User Management, Project Users, Analytics, Reporting, Support Management, Help Management, System Configuration, Global Settings, Security Management, Access Control, System Monitoring, Audit Logs, Development Tools, Maintenance)
- ✅ **ALL Additional Modules** (Dashboard, Delivery Settings, Promotions, Settings)

**Restrictions:**
- ❌ **NONE** - Complete system access

**Note:** This role has access to **everything** in the system, including both store staff operations (POS) and project management operations. They are the ultimate administrators.

---

### Project Privilege Structure

#### **TypeScript Interfaces**

```typescript
// src/types/projectPrivileges.ts

export interface ProjectModulePrivileges {
  access: boolean;
  [key: string]: boolean; // Action-specific privileges
}

export interface ProjectUserPrivileges {
  // Store Operations (No POS access)
  orders?: ProjectModulePrivileges;
  shoppers?: ProjectModulePrivileges;
  users?: ProjectModulePrivileges;
  shops?: ProjectModulePrivileges;
  products?: ProjectModulePrivileges;
  wallet?: ProjectModulePrivileges;
  refunds?: ProjectModulePrivileges;
  tickets?: ProjectModulePrivileges;
  help?: ProjectModulePrivileges;
  
  // Additional Store Modules
  dashboard?: ProjectModulePrivileges;
  delivery_settings?: ProjectModulePrivileges;
  promotions?: ProjectModulePrivileges;
  settings?: ProjectModulePrivileges;
  
  // System Management
  system_management?: ProjectModulePrivileges;
  user_management?: ProjectModulePrivileges;
  project_users?: ProjectModulePrivileges;
  analytics?: ProjectModulePrivileges;
  reporting?: ProjectModulePrivileges;
  support_management?: ProjectModulePrivileges;
  help_management?: ProjectModulePrivileges;
  system_configuration?: ProjectModulePrivileges;
  global_settings?: ProjectModulePrivileges;
  security_management?: ProjectModulePrivileges;
  access_control?: ProjectModulePrivileges;
  system_monitoring?: ProjectModulePrivileges;
  audit_logs?: ProjectModulePrivileges;
  development_tools?: ProjectModulePrivileges;
  maintenance?: ProjectModulePrivileges;
}
```

#### **Default Project Privileges**

```typescript
export const DEFAULT_PROJECT_PRIVILEGES: ProjectUserPrivileges = {
  orders: {
    access: false,
    view_orders: false,
    create_orders: false,
    edit_orders: false,
    delete_orders: false,
    process_orders: false,
    view_order_details: false,
    update_order_status: false,
    assign_delivery: false,
  },
  // ... other modules with their respective actions
};
```

---

### Project Role Assignment

#### **Role Definition**

```typescript
// src/lib/privileges/projectRolePrivileges.ts

export const getDefaultProjectPrivilegesForRole = (projectRoleType: string): ProjectUserPrivileges => {
  const privileges: ProjectUserPrivileges = {} as ProjectUserPrivileges;
  
  // Initialize all privileges to false
  Object.keys(DEFAULT_PROJECT_PRIVILEGES).forEach(module => {
    privileges[module as ProjectPrivilegeKey] = {
      access: false,
      ...DEFAULT_PROJECT_PRIVILEGES[module as ProjectPrivilegeKey],
    };
  });

  switch (projectRoleType) {
    case 'customerSupport':
      const customerSupportModules: ProjectPrivilegeKey[] = [
        'orders', 'shoppers', 'users', 'shops', 'products',
        'wallet', 'refunds', 'tickets', 'help'
      ];
      // Grant appropriate privileges...
      break;
      
    case 'systemAdmin':
      const systemAdminModules: ProjectPrivilegeKey[] = [
        'orders', 'shoppers', 'users', 'shops', 'products',
        'wallet', 'refunds', 'tickets', 'help', 'dashboard',
        'delivery_settings', 'promotions', 'settings'
      ];
      // Grant appropriate privileges...
      break;
      
    case 'projectManager':
      const projectManagerModules: ProjectPrivilegeKey[] = [
        'orders', 'shoppers', 'users', 'shops', 'products',
        'wallet', 'refunds', 'tickets', 'help', 'dashboard',
        'promotions'
      ];
      // Grant appropriate privileges...
      break;
      
    case 'projectAdmin':
      // Full access to everything
      break;
  }
  
  return privileges;
};
```

#### **Available Project Roles**

```typescript
export const PROJECT_ROLE_TYPES = [
  'projectAdmin',
  'systemAdmin', 
  'projectManager',
  'customerSupport',
] as const;

export type ProjectRoleType = typeof PROJECT_ROLE_TYPES[number];
```

---

### Project User Authentication & Session

#### **Session Structure**

Project users have a separate session structure:

```typescript
interface ProjectUserSession {
  id: string;
  username: string;
  email: string;
  role: ProjectRoleType;
  privileges: ProjectUserPrivileges;
  isProjectUser: true;
  // ... other session data
}
```

#### **Authentication Flow**

1. **Project User Login**: Uses `ProjectUsers` table
2. **Privilege Loading**: Loads `ProjectUserPrivileges` based on role
3. **Session Creation**: Creates project user session
4. **Access Control**: Enforces project-specific privileges

---

### Project User Menu System

#### **Menu Privilege Mapping**

```typescript
// src/lib/privileges/menuPrivileges.ts

export const menuPrivileges: Record<string, MenuPrivilege> = {
  // ... store staff menu items
  
  'Project Users': { 
    module: 'project_users', 
    isProjectUser: true 
  },
  
  // ... other menu items
};
```

#### **Menu Filtering**

The sidebar filters menu items based on user type:

```typescript
const filteredMenuItems = isProjectUser()
  ? projectMenuItems.filter(item => hasProjectModuleAccess(item.module))
  : storeMenuItems.filter(item => hasModuleAccess(item.module));
```

---

### Security Benefits

#### **Complete Separation**
- **Project users** cannot access any POS operations (except Global System Admin)
- **Store staff** cannot access project management features
- **Different privilege systems** prevent cross-contamination

#### **Role-Based Access**
- Each project role has specific, limited access
- No unnecessary permissions granted
- Clear separation of concerns

#### **System Integrity**
- Project users focus on system management
- Store staff focus on business operations
- No interference between the two systems

#### **Global System Admin Exception**
- **Global System Admin** has access to **everything** including POS operations
- This is the only role that bridges both systems
- Ultimate administrative control

---

### Implementation Files

#### **Core Files**
- `src/types/projectPrivileges.ts` - Project privilege types and interfaces
- `src/lib/privileges/projectRolePrivileges.ts` - Project role definitions
- `src/lib/privileges/menuPrivileges.ts` - Menu privilege mapping
- `src/components/pages/ProjectUsers.tsx` - Project users management page
- `src/app/project-users/page.tsx` - Project users route

#### **Database Integration**
- `src/graphql/ProjectUsers.graphql` - Project users GraphQL queries
- `src/hooks/useHasuraApi.ts` - Project users data fetching hooks

#### **Authentication**
- Project user authentication system
- Session management for project users
- Privilege checking for project users

---

### Usage Examples

#### **Checking Project User Privileges**

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

#### **Protecting Project User Components**

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

#### **Conditional Rendering for Project Users**

```tsx
import { useProjectPrivilege } from '@/hooks/useProjectPrivilege';

const { hasProjectAction } = useProjectPrivilege();

{
  hasProjectAction('project_users', 'add_project_users') && (
    <Button>Add Project User</Button>
  );
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

## Contributing