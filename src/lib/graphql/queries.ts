// User queries
export const GET_USERS = `
  query GetUsers {
    Users {
      email
      created_at
      id
      gender
      is_active
      name
      Addresses {
        city
        created_at
        id
        latitude
        is_default
        longitude
        postal_code
        street
        updated_at
        user_id
      }
      Invoices {
        created_at
        customer_id
        delivery_fee
        discount
        id
        invoice_items
        invoice_number
        order_id
        service_fee
        status
        subtotal
        tax
        total_amount
      }
      Wallets {
        available_balance
        id
        last_updated
        reserved_balance
        shopper_id
      }
      password_hash
      phone
      profile_picture
      role
      updated_at
      shopper {
        Employment_id
        active
        address
        background_check_completed
        created_at
        driving_license
        full_name
        id
        national_id
        onboarding_step
        phone_number
        profile_photo
        status
        transport_mode
        updated_at
        user_id
      }
    }
  }
`;

// Products queries
export const GET_PRODUCTS = `
  query GetProducts {
    Products {
      id
      name
      description
      shop_id
      price
      final_price
      quantity
      measurement_unit
      image
      category
      created_at
      updated_at
      is_active
      Shop {
        address
        category_id
        created_at
        description
        id
        image
        is_active
        latitude
        longitude
        name
        operating_hours
        updated_at
      }
      Order_Items {
        quantity
        product_id
        price
        order_id
        id
        created_at
      }
      Cart_Items {
        updated_at
        quantity
        product_id
        price
        id
        created_at
        cart_id
      }
    }
  }
`;

// Categories queries
export const GET_CATEGORIES = `
  query GetCategories {
    Categories {
      id
      name
      is_active
    }
  }
`;

// Shops queries
export const GET_SHOPS = `
  query GetShops {
    Shops {
      id
      name
      category_id
      category: Category {
        id
        name
      }
      Products_aggregate {
        aggregate {
          count
        }
      }
      Orders_aggregate {
        aggregate {
          count
        }
      }
      is_active
    }
  }
`;

// Orders queries
export const GET_ORDERS = `
  query GetOrders {
    Orders {
      id
      user_id
      shopper_id
      total
      status
      delivery_address_id
      delivery_photo_url
      delivery_notes
      created_at
      updated_at
      delivery_time
      combined_order_id
      OrderID
      shop_id
      delivery_fee
      service_fee
      discount
      voucher_code
      User {
        id
        name
        email
      }
      Order_Items {
        id
        product_id
        quantity
        price
      }
      Address {
        street
        city
        postal_code
      }
    }
  }
`;

// Carts queries
export const GET_CARTS = `
  query GetCarts {
    Carts {
      id
      user_id
      total
      created_at
      updated_at
      is_active
      shop_id
      User {
        created_at
        email
        gender
        id
        is_active
        name
        password_hash
        phone
        profile_picture
        role
        updated_at
      }
    }
  }
`;

// Addresses queries
export const GET_ADDRESSES = `
  query GetAddresses {
    Addresses {
      id
      user_id
      street
      city
      postal_code
      latitude
      longitude
      is_default
      created_at
      updated_at
    }
  }
`;

// Invoices queries
export const GET_INVOICE_DETAILS = `
  query GetInvoiceDetails {
    Invoices {
      created_at
      customer_id
      delivery_fee
      discount
      id
      invoice_items
      invoice_number
      order_id
      service_fee
      status
      subtotal
      tax
      total_amount
    }
  }
`;

// Wallet queries
export const GET_ALL_WALLETS = `
  query getAllwallets {
    Wallets {
      id
      shopper_id
      reserved_balance
      available_balance
      last_updated
      User {
        id
        name
        email
        phone
        profile_picture
        is_active
      }
      Wallet_Transactions {
        id
        amount
        type
        status
        created_at
      }
    }
    Orders(where: { status: { _neq: "cancelled" } }) {
      id
      shopper_id
      total
      status
      delivery_fee
      service_fee
      created_at
    }
  }
`;

export const GET_SHOPPER_WALLET = `
  query getShopperWallet($shopper_id: uuid!) {
    Wallets(where: { shopper_id: { _eq: $shopper_id } }) {
      id
      shopper_id
      available_balance
      reserved_balance
      last_updated
      Wallet_Transactions {
        id
        amount
        type
        status
        created_at
        related_order_id
        Order {
          OrderID
          status
        }
      }
    }
  }
`;

// Wallet Transactions queries
export const GET_ALL_WALLET_TRANSACTIONS = `
  query getAllWallettTtransactions {
    Wallet_Transactions {
      wallet_id
      type
      status
      related_order_id
      id
      created_at
      amount
      Wallet {
        id
        available_balance
        reserved_balance
        last_updated
        User {
          id
          name
          email
          phone
          gender
          profile_picture
          is_active
        }
      }
      Order {
        OrderID
        status
        total
      }
    }
  }
`;

// Refunds queries
export const GET_ALL_REFUNDS = `
  query getAllREfunds {
    Refunds {
      created_at
      generated_by
      id
      order_id
      paid
      reason
      amount
      status
      update_on
      user_id
    }
  }
`;

export const GET_USER_BY_ID = `
  query GetUserById($id: uuid!) {
    Users_by_pk(id: $id) {
      id
      name
      email
      phone
      role
      created_at
      updated_at
      profile_picture
      is_active
      address
      is_shopper
      Shopper {
        id
        rating
        total_orders
        transport_mode
        background_check_completed
        Employment_id
      }
      Orders(order_by: { created_at: desc }, limit: 5) {
        id
        OrderID
        status
        total
        created_at
      }
      ActivityLogs(order_by: { created_at: desc }, limit: 10) {
        id
        type
        description
        created_at
      }
    }
  }
`;

// Shop details query
export const GET_SHOP_BY_ID = `
  query GetShopById($id: uuid!) {
    Shops_by_pk(id: $id) {
      id
      name
      description
      address
      operating_hours
      latitude
      longitude
      image
      is_active
      created_at
      updated_at
      category_id
      category: Category {
        id
        name
      }
      Products {
        id
        name
        description
        price
        final_price
        quantity
        measurement_unit
        image
        is_active
        created_at
        updated_at
      }
      Products_aggregate {
        aggregate {
          count
        }
      }
      Orders_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

// Shoppers queries
export const GET_SHOPPERS = `
  query GetShoppers {
    shoppers {
      Employment_id
      address
      background_check_completed
      created_at
      driving_license
      full_name
      id
      national_id
      onboarding_step
      phone_number
      profile_photo
      status
      transport_mode
      updated_at
      user_id
      active
      User {
        id
        email
        is_active
      }
    }
  }
`;

// System Configuration query
export const GET_SYSTEM_CONFIG = `
  query GetSystemConfig {
    System_configuratioins {
      baseDeliveryFee
      currency
      discounts
      id
      serviceFee
      shoppingTime
      unitsSurcharge
      extraUnits
      cappedDistanceFee
      distanceSurcharge
      suggestedMinimumTip
      rushHourSurcharge
      rushHours
      productCommissionPercentage
      deliveryCommissionPercentage
      enableRush
      allowScheduledDeliveries
    }
  }
`;

// Shopper Details Query
export const GET_SHOPPER_ONBOARDING_DETAILS = `
  query getShopperOnboardingDetails($user_id: uuid!) {
    Users(where: { id: { _eq: $user_id } }) {
      id
      name
      email
      phone
      profile_picture
      created_at
      is_active
    }
    shoppers(where: { user_id: { _eq: $user_id } }) {
      id
      user_id
      full_name
      phone_number
      Employment_id
      profile_photo
      transport_mode
      active
      status
      background_check_completed
      onboarding_step
      created_at
    }
  }
`;

// Shopper Orders Query
export const GET_SHOPPER_ORDERS = `
  query getShopperOrders($user_id: uuid!) {
    Orders(
      where: { shopper_id: { _eq: $user_id } }
      order_by: { created_at: desc }
    ) {
      id
      OrderID
      status
      total
      created_at
      updated_at
      delivery_time
      delivery_fee
      service_fee
      discount
      delivery_notes
      delivery_photo_url
      User {
        name
      }
      Shop {
        id
        name
      }
      Address {
        street
        city
        postal_code
      }
    }
  }
`;

// Order Payments Query
export const GET_ORDER_PAYMENTS = `
  query getOrderPayments($order_id: uuid!) {
    Wallet_Transactions(where: { related_order_id: { _eq: $order_id } }) {
      id
      amount
      type
      status
      created_at
      Wallet {
        User {
          name
        }
      }
    }
    Refunds(where: { order_id: { _eq: $order_id } }) {
      id
      amount
      reason
      status
      paid
      created_at
      update_on
    }
  }
`;

export const GET_SHOPPER_FULL_DETAILS = `
  query getShopperFullDetails($user_id: uuid!) {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      active
      address
      background_check_completed
      created_at
      driving_license
      full_name
      id
      national_id
      onboarding_step
      phone_number
      profile_photo
      status
      transport_mode
      updated_at
      user_id
      Employment_id
      User {
        gender
        email
        name
        phone
        profile_picture
        role
        Ratings {
          created_at
          customer_id
          delivery_experience
          id
          order_id
          packaging_quality
          professionalism
          rating
          review
          reviewed_at
          shopper_id
          updated_at
        }
      }
    }
  }
`;

export const GET_ALL_TICKETS = `
  query GetAllTickets($limit: Int!, $offset: Int!) {
    tickets(limit: $limit, offset: $offset, order_by: { created_on: desc }) {
      created_on
      id
      other_user_id
      priority
      status
      subject
      ticket_num
      update_on
      user_id
    }
    tickets_aggregate {
      aggregate {
        count
      }
    }
    Delivery_Issues(limit: $limit, offset: $offset, order_by: { created_at: desc }) {
      created_at
      description
      id
      issue_type
      order_id
      priority
      shopper_id
      status
      updated_at
    }
    Delivery_Issues_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export const GET_USER_DETAILS = `
  query GetUserDetails($userId: uuid!) {
    Users_by_pk(id: $userId) {
      id
      name
      email
      phone
      role
      is_active
      created_at
      profile_picture
      address
      is_shopper
      Shopper {
        id
        rating
        total_orders
        transport_mode
        background_check_completed
        Employment_id
      }
      Orders(order_by: { created_at: desc }, limit: 5) {
        id
        OrderID
        status
        total
        created_at
      }
      ActivityLogs(order_by: { created_at: desc }, limit: 10) {
        id
        type
        description
        created_at
      }
    }
  }
`;

export const GET_TICKET_SHOPPER_DETAILS = `
  query GetTicketShopperDetails($shopperId: uuid!) {
    shoppers(where: { id: { _eq: $shopperId } }) {
      id
      full_name
      phone_number
      profile_photo
      transport_mode
      User {
        id
        name
        email
        phone
        created_at
      }
      Orders_aggregate {
        aggregate {
          count
        }
      }
      Ratings_aggregate {
        aggregate {
          avg {
            rating
          }
        }
      }
    }
  }
`;

export const GET_TOP_SHOPPERS = `
  query TopShoppers($start: timestamptz!, $end: timestamptz!) {
    Users(
      where: {
        shopper: {active: {_eq: true}}
      }
    ) {
      id
      name
      profile_picture
      shopper {
        id
        active
        status
      }
      Orders(
        where: {
          created_at: {_gte: $start, _lte: $end},
          status: {_eq: "delivered"}
        }
      ) {
        id
        created_at
        updated_at
        delivery_fee
        service_fee
        Ratings {
          rating
        }
      }
    }
  }
`;

export const GET_PROMOTIONS = `
  query GetPromotions {
    promotions {
      id
      name
      code
      discount
      period
      status
      usage
      created_at
      update_on
    }
  }
`;

export const CREATE_PROMOTION = `
  mutation CreatePromotion($name: String!, $code: String!, $discount: String!, $period: String!, $usage: String!, $status: String!) {
    insert_promotions_one(object: {
      name: $name,
      code: $code,
      discount: $discount,
      period: $period,
      usage: $usage,
      status: $status
    }) {
      id
      name
      code
      discount
      period
      status
      usage
      created_at
      update_on
    }
  }
`;

export const UPDATE_PROMOTION = `
  mutation UpdatePromotion($id: uuid!, $name: String!, $code: String!, $discount: String!, $period: String!, $usage: String!, $status: String!) {
    update_promotions_by_pk(
      pk_columns: { id: $id },
      _set: {
        name: $name,
        code: $code,
        discount: $discount,
        period: $period,
        usage: $usage,
        status: $status,
        update_on: "now()"
      }
    ) {
      id
      name
      code
      discount
      period
      status
      usage
      created_at
      update_on
    }
  }
`;

// Revenue queries
export const GET_ALL_REVENUE = `
  query getAllRevenue {
    Revenue {
      amount
      commission_percentage
      created_at
      id
      order_id
      products
      shop_id
      shopper_id
      type
      shopper {
        Employment_id
        active
        address
        background_check_completed
        created_at
        driving_license
        full_name
        id
        national_id
        onboarding_step
        phone_number
        profile_photo
        status
        telegram_id
        transport_mode
        updated_at
        user_id
      }
    }
  }
`;
