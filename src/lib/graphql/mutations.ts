// Cart mutations
export const ADD_CART = `
  mutation AddCart(
    $total: String = ""
    $shop_id: uuid = ""
    $user_id: uuid = ""
  ) {
    insert_Carts(
      objects: {
        total: $total
        is_active: true
        shop_id: $shop_id
        user_id: $user_id
      }
    ) {
      affected_rows
    }
  }
`;

export const ADD_ITEMS_TO_CART = `
  mutation AddItemsToCart(
    $total: String = ""
    $is_active: Boolean = true
    $shop_id: uuid = ""
    $user_id: uuid = ""
  ) {
    insert_Carts(
      objects: {
        total: $total
        is_active: $is_active
        shop_id: $shop_id
        user_id: $user_id
      }
    ) {
      affected_rows
    }
  }
`;

// Invoice mutations
export const ADD_INVOICE_DETAILS = `
  mutation addInvoiceDetails(
    $customer_id: uuid = ""
    $delivery_fee: String = ""
    $discount: String = ""
    $invoice_items: jsonb = ""
    $invoice_number: String = ""
    $order_id: uuid = ""
    $service_fee: String = ""
    $status: String = ""
    $subtotal: String = ""
    $tax: String = ""
    $total_amount: String = ""
  ) {
    insert_Invoices(
      objects: {
        customer_id: $customer_id
        delivery_fee: $delivery_fee
        discount: $discount
        invoice_items: $invoice_items
        invoice_number: $invoice_number
        order_id: $order_id
        service_fee: $service_fee
        status: $status
        subtotal: $subtotal
        tax: $tax
        total_amount: $total_amount
      }
    ) {
      affected_rows
    }
  }
`;

// Wallet mutations
export const CREATE_WALLET = `
  mutation createWallet($user_id: uuid!) {
    insert_Wallets_one(
      object: {
        user_id: $user_id
        available_balance: "0"
        reserved_balance: "0"
      }
    ) {
      id
      user_id
      available_balance
      reserved_balance
      last_updated
    }
  }
`;

export const UPDATE_WALLET_BALANCES = `
  mutation updateWalletBalances(
    $wallet_id: uuid!
    $available_balance: String!
    $reserved_balance: String!
  ) {
    update_Wallets_by_pk(
      pk_columns: { id: $wallet_id }
      _set: {
        available_balance: $available_balance
        reserved_balance: $reserved_balance
        last_updated: "now()"
      }
    ) {
      id
      available_balance
      reserved_balance
      last_updated
    }
  }
`;

// Wallet Transaction mutations
export const CREATE_WALLET_TRANSACTION = `
  mutation createWalletTransaction(
    $amount: String!
    $type: String!
    $status: String!
    $wallet_id: uuid!
    $related_order_id: uuid
  ) {
    insert_Wallet_Transactions_one(
      object: {
        amount: $amount
        type: $type
        status: $status
        wallet_id: $wallet_id
        related_order_id: $related_order_id
      }
    ) {
      id
      amount
      type
      status
      created_at
      wallet_id
      related_order_id
    }
  }
`;

export const CREATE_MULTIPLE_WALLET_TRANSACTIONS = `
  mutation createMultipleWalletTransactions(
    $transactions: [Wallet_Transactions_insert_input!]!
  ) {
    insert_Wallet_Transactions(objects: $transactions) {
      returning {
        id
        amount
        type
        status
        created_at
        wallet_id
        related_order_id
      }
      affected_rows
    }
  }
`;

// Shopper mutations
export const REGISTER_SHOPPER = `
  mutation RegisterShopper(
    $full_name: String!
    $address: String!
    $phone_number: String!
    $national_id: String!
    $driving_license: String
    $transport_mode: String!
    $profile_photo: String
    $user_id: uuid!
  ) {
    insert_shoppers_one(
      object: {
        full_name: $full_name
        address: $address
        phone_number: $phone_number
        national_id: $national_id
        driving_license: $driving_license
        transport_mode: $transport_mode
        profile_photo: $profile_photo
        status: "pending"
        active: false
        background_check_completed: false
        onboarding_step: "application_submitted"
        user_id: $user_id
      }
    ) {
      id
      status
      active
      onboarding_step
    }
  }
`;

export const UPDATE_SHOPPER_STATUS = `
  mutation UpdateShopperStatus(
    $shopper_id: uuid!
    $status: String!
    $active: Boolean!
    $background_check_completed: Boolean!
  ) {
    update_shoppers_by_pk(
      pk_columns: { id: $shopper_id }
      _set: {
        status: $status
        active: $active
        background_check_completed: $background_check_completed
      }
    ) {
      id
      status
      active
      background_check_completed
    }
  }
`;

// Product mutations
export const ADD_PRODUCT = `
  mutation AddProduct(
    $name: String!
    $description: String
    $price: String!
    $quantity: Int!
    $measurement_unit: String!
    $shop_id: uuid!
    $category: String!
    $barcode: String
    $sku: String
    $reorder_point: Int
    $supplier: String
    $is_active: Boolean = true
    $final_price: String!
    $total: String!
  ) {
    insert_Products_one(
      object: {
        name: $name
        description: $description
        price: $price
        quantity: $quantity
        measurement_unit: $measurement_unit
        shop_id: $shop_id
        category: $category
        barcode: $barcode
        sku: $sku
        reorder_point: $reorder_point
        supplier: $supplier
        is_active: $is_active
        final_price: $final_price
        total: $total
      }
    ) {
      id
      name
      description
      price
      quantity
      measurement_unit
      shop_id
      category
      barcode
      sku
      reorder_point
      supplier
      is_active
      final_price
      total
      created_at
      updated_at
    }
  }
`;

export const UPDATE_TICKET = `
  mutation UpdateTicket($id: uuid!, $status: String!, $update_on: timestamptz!) {
    update_tickets_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, update_on: $update_on }
    ) {
      id
      status
      update_on
    }
  }
`;

export const UPDATE_DELIVERY_ISSUE = `
  mutation UpdateDeliveryIssue($id: uuid!, $status: String!, $updated_at: timestamptz!) {
    update_Delivery_Issues_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, updated_at: $updated_at }
    ) {
      id
      status
      updated_at
    }
  }
`;

export const UPDATE_REFUND_STATUS = `
  mutation UpdateRefundStatus($id: uuid!, $status: String!, $update_on: timestamptz!) {
    update_Refunds_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, update_on: $update_on }
    ) {
      id
      status
      update_on
    }
  }
`;
