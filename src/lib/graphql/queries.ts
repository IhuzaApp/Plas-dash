// User queries
export const GET_USERS = `
  query GetUsers {
    Users {
      id
      name
      email
      phone
      role
      password_hash
      created_at
      updated_at
      profile_picture
      is_active
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
      shopper_id
      reserved_balance
      last_updated
      id
      available_balance
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
      Wallet_Transactions {
        amount
        created_at
        id
        related_order_id
        status
        type
        wallet_id
      }
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
        shopper_id
        reserved_balance
        last_updated
        id
        available_balance
      }
      Order {
        OrderID
        updated_at
        user_id
        voucher_code
        total
        status
        shopper_id
        shop_id
        service_fee
        id
        discount
        delivery_time
        delivery_photo_url
        delivery_notes
        delivery_fee
        delivery_address_id
        created_at
        combined_order_id
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
  query GetUserById($id: Int!) {
    users_by_pk(id: $id) {
      id
      name
      email
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
      created_at
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