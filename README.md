# Plas Dashboard

A modern, feature-rich dashboard for managing delivery operations, point of sale, and financial transactions.

## Features

- 📊 **Real-time Analytics Dashboard**
  - Order statistics and trends
  - Revenue tracking
  - Shopper performance metrics

- 🛍️ **Order Management**
  - Real-time order tracking
  - Order details and history
  - Status updates and notifications

- 💰 **Financial Management**
  - Wallet management
  - Refund processing
  - Transaction history
  - Financial reporting

- 🏪 **Point of Sale (POS)**
  - Shop management
  - Inventory tracking
  - Staff management
  - Transaction processing

- 🚚 **Delivery Operations**
  - Shopper management
  - Delivery zone configuration
  - Pricing and fee structure
  - Scheduled deliveries

- 🎯 **Customer Support**
  - Ticket management
  - Customer feedback
  - Issue resolution tracking

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
