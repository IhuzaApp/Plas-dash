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
├── components/
│   ├── dashboard/      # Dashboard-specific components
│   ├── layout/         # Layout components
│   ├── pages/          # Page components
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

1. **Delivery Fee Calculation**

   ```typescript
   final_fee = base_fee +
               (distance_surcharge × km) +
               (rush_hour_multiplier × base_fee) +
               (unit_surcharge × extra_units) +
               service_fee
   ```

2. **Plasa Earnings**

   ```typescript
   earnings = delivery_fee × commission_rate +
             bonus_rate × performance_multiplier +
             tips
   ```

3. **Store Commission**
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

1. **Order Form Validation**

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

2. **Payment Form Validation**
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
