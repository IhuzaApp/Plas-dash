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

// Shops queries
export const GET_SHOPS = `
  query GetShops {
    Shops {
      id
      name
      description
      category {
        id
        name
        description
        image
        is_active
        created_at
      }
      image
      address
      latitude
      longitude
      operating_hours
      created_at
      updated_at
      is_active
      Products {
        id
        name
        description
        image
        is_active
        measurement_unit
        price
        quantity
        shop_id
        updated_at
        created_at
        category {
          id
          name
          description
          image
          is_active
        }
      }
      Orders {
        OrderID
        id
        found
        discount
        delivery_time
        delivery_notes
        delivery_fee
        delivery_address_id
        created_at
        combined_order_id
        delivery_photo_url
        updated_at
        total
        status
        shopper_id
        shop_id
        service_fee
        voucher_code
        user_id
      }
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
      Address {
        city
        created_at
        id
        is_default
        latitude
        longitude
        postal_code
        street
        updated_at
        user_id
      }
      Delivery_Issues {
        created_at
        description
        id
        issue_type
        order_id
        shopper_id
        status
        updated_at
      }
      Order_Items {
        created_at
        id
        order_id
        price
        product_id
        quantity
      }
      delivery_fee
      service_fee
      discount
      voucher_code
      OrderID
      shop_id
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