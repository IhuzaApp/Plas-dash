// Revenue queries
export const GET_ALL_REVENUE = `
  query GetAllRevenue {
    Revenue(order_by: { created_at: asc }) {
      id
      amount
      type
      created_at
      Plasbusiness_id
      businessOrder_Id
      commission_percentage
      order_id
      reel_order_id
      restaurant_id
      restaurant_order_id
      shop_id
      shopper_id
    }
  }
`;

// Total wallet balances across all wallet tables (fetch raw, sum client-side)
// Note: amount fields are strings in Hasura, so aggregate sum returns null
export const GET_WALLET_TOTALS = `
  query GetWalletTotals {
    Wallets {
      available_balance
    }
    business_wallet {
      amount
    }
    personalWallet {
      balance
    }
  }
`;

// Pending orders: fetch totals across all order types (not delivered/on_the_way/cancelled)
export const GET_PENDING_ORDER_TOTALS = `
  query GetPendingOrderTotals {
    Orders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      delivery_fee
      service_fee
    }
    reel_orders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      delivery_fee
      service_fee
    }
    restaurant_orders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      delivery_fee
    }
    businessProductOrders(where: { status: { _nin: ["delivered", "on_the_way", "cancelled"] } }) {
      total
      service_fee
      transportation_fee
    }
  }
`;

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
      productName_id
      shop_id
      price
      final_price
      quantity
      measurement_unit
      category
      created_at
      updated_at
      is_active
      ProductName {
        id
        name
        description
        barcode
        sku
        image
        create_at
      }
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

// Products by shop query for POS checkout
export const GET_PRODUCTS_BY_SHOP = `
  query GetProductsByShop($shop_id: uuid!) {
    Products(where: { shop_id: { _eq: $shop_id }, is_active: { _eq: true } }) {
      id
      productName_id
      shop_id
      price
      final_price
      quantity
      measurement_unit
      category
      created_at
      updated_at
      is_active
      ProductName {
        id
        name
        description
        barcode
        sku
        image
        create_at
      }
      Shop {
        id
        name
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
      logo
      image
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
      Orders(order_by: { created_at: desc }, limit: 10) {
        id
        OrderID
        status
        total
        created_at
        delivery_fee
        service_fee
        User {
          id
          name
          email
        }
        Order_Items {
          id
          quantity
          price
          Product {
            ProductName {
              name
            }
          }
        }
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
      Shop {
        address
        created_at
        category_id
        description
        id
        image
        is_active
        latitude
        logo
        longitude
        name
        operating_hours
        phone
        updated_at
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

// All Wallets (shopper) with full transactions for overview tab
export const GET_ALL_WALLETS_WITH_TRANSACTIONS = `
  query getshopperWallet {
    Wallets {
      available_balance
      id
      last_updated
      reserved_balance
      shopper_id
      Wallet_Transactions {
        amount
        created_at
        description
        id
        relate_business_order_id
        related_order_id
        related_reel_orderId
        related_restaurant_order_id
        status
        type
        wallet_id
        Order {
          OrderID
          assigned_at
          combined_order_id
          created_at
          delivery_address_id
          delivery_fee
          delivery_notes
          delivery_photo_url
          delivery_time
          discount
          id
          pin
          service_fee
          total
          status
        }
        Reel_order {
          OrderID
          assigned_at
          combined_order_id
          created_at
          delivery_address_id
          delivery_fee
          delivery_note
          discount
          delivery_time
          delivery_photo_url
          found
          id
          quantity
          reel_id
          pin
          voucher_code
          status
          total
        }
        Restaurant_order {
          combined_order_id
          assigned_at
          delivery_address_id
          created_at
          delivery_fee
          delivery_notes
          delivery_photo_url
          pin
          restaurant_id
          found
          id
          shopper_id
          status
          total
          updated_at
          user_id
        }
      }
      User {
        shopper {
          address
          active
          full_name
          collection_comment
          driving_license
          drivingLicense_Image
          id
          guarantorPhone
          guarantorRelationship
          guarantor
          phone
          national_id_photo_front
          needCollection
          signature
          updated_at
          transport_mode
          telegram_id
          status
          user_id
          phone_number
          profile_photo
          created_at
          background_check_completed
          latitude
          longitude
          mutual_StatusCertificate
          national_id
          national_id_photo_back
        }
      }
    }
  }
`;

// Personal wallets (users) for overview tab
export const GET_PERSONAL_WALLETS = `
  query getPersonalwallet {
    personalWallet {
      id
      created_at
      balance
      updated_at
      user_id
      Users {
        email
        created_at
        gender
        id
        is_active
        is_guest
        name
        phone
        profile_picture
        role
        updated_at
      }
      RecieverPersonalWallet {
        action
        amount
        created_at
        doneBy
        id
        wallet_id
        update_at
        status
        received_wallet
        Users {
          email
          created_at
          gender
          id
          is_active
          is_guest
          name
          password_hash
          phone
          profile_picture
          updated_at
        }
      }
      personalWalletTransactions {
        action
        status
        received_wallet
        id
        doneBy
        created_at
        amount
        update_at
        wallet_id
      }
    }
  }
`;

// Business wallets for overview tab
export const GET_BUSINESS_WALLETS = `
  query getBusinessWallet {
    business_wallet {
      amount
      business_id
      created_at
      id
      query_id
      updated_at
      businessTransactions {
        action
        created_at
        description
        id
        related_order
        status
        type
        wallet_id
      }
      business_account {
        account_type
        business_email
        business_location
        business_phone
        business_name
        created_at
        face_image
        id
        id_image
        status
        updated_at
        user_id
        rdb_certificate
      }
    }
  }
`;

// All pending withdraw requests (for admin Process Payouts drawer)
export const GET_ALL_PENDING_WITHDRAW_REQUESTS = `
  query GetAllPendingWithdrawRequests {
    withDraweRequest(
      where: { status: { _eq: "pending" } }
      order_by: { created_at: desc }
    ) {
      amount
      businessWallet_id
      business_id
      created_at
      id
      phoneNumber
      shopperWallet_id
      shopper_id
      status
      update_at
      verification_image
      shoppers {
        Employment_id
        active
        Police_Clearance_Cert
        address
        full_name
        phone
        phone_number
        updated_at
        status
        profile_photo
        User {
          Wallets {
            available_balance
            id
            last_updated
            reserved_balance
          }
        }
      }
      business_wallets {
        amount
        business_id
        created_at
        id
        query_id
        updated_at
      }
      business_accounts {
        account_type
        business_email
        business_location
        business_name
        business_phone
        face_image
        id
        status
      }
    }
  }
`;

// All pending payouts (combined view with withdraw requests)
export const GET_ALL_PENDING_PAYOUTS = `
  query GetAllPendingPayouts {
    payouts(
      where: { status: { _eq: "pending" } }
      order_by: { created_at: desc }
    ) {
      amount
      created_at
      id
      status
      updated_on
      user_id
      wallet_id
      Wallets {
        id
        available_balance
        last_updated
        reserved_balance
        shopper_id
        Wallet_Transactions {
          amount
          created_at
          description
          id
          status
          type
          wallet_id
          related_reel_orderId
          related_order_id
          relate_business_order_id
        }
        User {
          email
          gender
          id
          is_guest
          is_active
          name
          phone
          profile_picture
        }
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
      Order {
        assigned_at
        combined_order_id
        delivery_photo_url
        delivery_time
        discount
        created_at
        delivery_address_id
        delivery_fee
        delivery_notes
        id
        pin
        service_fee
        shop_id
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
        orderedBy {
          gender
          email
          created_at
          id
          is_active
          is_guest
          name
          phone
          profile_picture
        }
      }
      User {
        gender
        email
        name
        phone
      }
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

// POS Transactions query
export const GET_POS_TRANSACTIONS = `
  query getPOSTransactions($shop_id: uuid = "") {
    shopCheckouts(where: {shop_id: {_eq: $shop_id}}) {
      Processed_By
      ProcessedBy {
        Address
        Position
        active
        created_on
        dob
        email
        employeeID
        fullnames
        gender
        generatePassword
        id
        last_login
        multAuthEnabled
        online
        password
        phone
        restaurant_id
        roleType
        shop_id
        updated_on
      }
      cartItems
      created_on
      id
      number
      payment_method
      shop_id
      subtotal
      tax
      tin
      total
      Shops {
        address
        category_id
        description
        id
        image
        logo
        longitude
        name
        phone
        operating_hours
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
      phone
      relatedTo
      ssd
      tin
      operating_hours
      latitude
      longitude
      image
      logo
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
        productName_id
        price
        final_price
        quantity
        measurement_unit
        supplier
        reorder_point
        is_active
        created_at
        updated_at
        ProductName {
          id
          name
          description
          barcode
          sku
          image
          create_at
        }
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
      Orders(order_by: { created_at: desc }) {
        id
        OrderID
        status
        total
        created_at
        updated_at
        delivery_fee
        service_fee
        orderedBy {
          id
          name
          email
          phone
        }
        Order_Items {
          id
          quantity
          price
          Product {
            ProductName {
              name
              image
            }
          }
        }
        Address {
          street
          city
          postal_code
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
      created_at
      gender
      name
      password_hash
      phone
      profile_picture
      updated_at
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
        reel_order_id
        review
        reviewed_at
        shopper_id
        updated_at
      }
      tickets {
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
      Invoices {
        Proof
        created_at
        customer_id
        delivery_fee
        discount
        id
        invoice_items
        invoice_number
        order_id
        reel_order_id
        service_fee
        status
        subtotal
        tax
        total_amount
      }
      Delivery_Issues {
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
    }
    telegram_id
    Revenues {
      amount
      commission_percentage
      created_at
      id
      order_id
      products
      shop_id
      shopper_id
      type
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
      withDrawCharges
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
  query getShopperFullDetails($user_id: uuid = "") {
    shoppers(where: { user_id: { _eq: $user_id } }) {
      Employment_id
      address
      background_check_completed
      created_at
      driving_license
      full_name
      id
      onboarding_step
      phone_number
      status
      transport_mode
      updated_at
      user_id
      active
      User {
        id
        email
        is_active
        created_at
        gender
        name
        password_hash
        phone
        profile_picture
        updated_at
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
          reel_order_id
          review
          reviewed_at
          shopper_id
          updated_at
        }
        tickets {
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
        Invoices {
          Proof
          created_at
          customer_id
          delivery_fee
          discount
          id
          invoice_items
          invoice_number
          order_id
          reel_order_id
          service_fee
          status
          subtotal
          tax
          total_amount
        }
        Delivery_Issues {
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
      }
      telegram_id
      Revenues {
        amount
        commission_percentage
        created_at
        id
        order_id
        products
        shop_id
        shopper_id
        type
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

// Tickets queries
export const GET_TICKETS = `
  query getTickets {
    tickets {
      created_on
      id
      other_user_id
      priority
      subject
      status
      ticket_num
      update_on
      user_id
      User {
        is_active
        id
        gender
        email
        created_at
        name
        password_hash
        phone
        profile_picture
        updated_at
        role
      }
    }
  }
`;

// Revenue queries (detailed, with shopper relation)
export const GET_ALL_REVENUE_DETAILED = `
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

// Re-export UPDATE_PRODUCT mutation
export { UPDATE_PRODUCT } from './mutations';

// Staff Management Queries
export const GET_ORG_EMPLOYEES_BY_SHOP = `
  query getOrgEmployeesByShop($shop_id: uuid!) {
    orgEmployees(where: {shop_id: {_eq: $shop_id}, active: {_eq: true}}) {
      Address
      active
      created_on
      dob
      email
      employeeID
      fullnames
      gender
      id
      multAuthEnabled
      password
      phone
      restaurant_id
      shop_id
      updated_on
      Position
      roleType
      twoFactorSecrets
      orgEmployeeRoles {
        created_on
        id
        orgEmployeeID
        privillages
        update_on
      }
      Shops {
        id
        name
      }
    }
  }
`;

// Get orgEmployee by identity (for login)
export const GET_ORG_EMPLOYEE_BY_IDENTITY = `
  query loginOrgEmployee($identity: String = "") {
    orgEmployees(where: {_or: [
      {fullnames: {_eq: $identity}},
      {email: {_eq: $identity}},
      {phone: {_eq: $identity}}
    ]}) {
      Address
      Position
      active
      created_on
      dob
      email
      employeeID
      fullnames
      gender
      generatePassword
      id
      last_login
      multAuthEnabled
      password
      phone
      restaurant_id
      roleType
      shop_id
      updated_on
      online
      twoFactorSecrets
      orgEmployeeRoles {
        id
        privillages
      }
    }
  }
`;

// ProjectUser queries for authentication
export const GET_PROJECT_USER_BY_IDENTITY = `
  query GetProjectUserByIdentity($identity: String!) {
    ProjectUsers(
      where: {
        _or: [
          { username: { _eq: $identity } },
          { email: { _eq: $identity } }
        ]
      }
    ) {
      id
      MembershipId
      username
      email
      password
      role
      is_active
      TwoAuth_enabled
      last_Login
      created_at
      updated_at
      gender
      device_details
      profile
      privileges
    }
  }
`;

// Separate query for MembershipId (which is an integer)
export const GET_PROJECT_USER_BY_MEMBERSHIP_ID = `
  query GetProjectUserByMembershipId($membershipId: Int!) {
    ProjectUsers(
      where: { MembershipId: { _eq: $membershipId } }
    ) {
      id
      MembershipId
      username
      email
      password
      role
      is_active
      TwoAuth_enabled
      last_Login
      created_at
      updated_at
      gender
      device_details
      profile
      privileges
    }
  }
`;

// Get shop by ID for settings
export const GET_SHOP_BY_ID_FOR_SETTINGS = `
  query GetShopsWhereID($shop_id: uuid = "") {
    Shops(where: {id: {_eq: $shop_id}}) {
      id
      name
      description
      category_id
      logo
      address
      latitude
      longitude
      operating_hours
      created_at
      updated_at
      is_active
      phone
      tin
      ssd
      Category {
        id
        name
      }
    }
  }
`;

// Product Names queries
export const GET_PRODUCT_NAMES = `
  query GetProductNames {
    productNames {
      id
      name
      description
      barcode
      sku
      image
      create_at
    }
  }
`;

// Search Product Names query
export const SEARCH_PRODUCT_NAMES = `
  query SearchProductNames($searchTerm: String!) {
    productNames(
      where: {
        _or: [
          { name: { _ilike: $searchTerm } },
          { description: { _ilike: $searchTerm } },
          { barcode: { _ilike: $searchTerm } },
          { sku: { _ilike: $searchTerm } }
        ]
      },
      limit: 10,
      order_by: { name: asc }
    ) {
      id
      name
      description
      barcode
      sku
      image
      create_at
    }
  }
`;

// Reel Orders query
export const GET_REEL_ORDERS = `
  query getReelOrders {
    reel_orders {
      OrderID
      combined_order_id
      created_at
      delivery_address_id
      delivery_fee
      delivery_note
      delivery_photo_url
      delivery_time
      discount
      found
      id
      quantity
      reel_id
      service_fee
      shopper_id
      status
      total
      updated_at
      user_id
      voucher_code
      User {
        id
        name
        email
        phone
      }
      Reel {
        Price
        Product
        category
        created_on
        delivery_time
        description
        id
        isLiked
        likes
        restaurant_id
        shop_id
        title
        type
        user_id
        video_url
      }
      Shoppers {
        created_at
        email
        gender
        id
        is_active
        name
        phone
        profile_picture
        role
        updated_at
      }
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
    }
  }
`;

// Restaurants query
export const GET_RESTAURANTS = `
  query getRestaurantsDetails {
    Restaurants {
      created_at
      email
      id
      lat
      location
      long
      name
      phone
      profile
      verified
      logo
      is_active
      relatedTo
      tin
      ussd
    }
  }
`;

// Reels query
export const GET_REELS = `
  query getAllReels($where: Reels_bool_exp) {
    Reels(where: $where, order_by: {created_on: desc}) {
      Reels_comments {
        created_on
        id
        isLiked
        likes
        reel_id
        text
        user_id
      }
      Product
      Price
      Restaurant {
        created_at
        email
        id
        is_active
        lat
        location
        logo
        long
        name
        phone
        profile
        relatedTo
        tin
        ussd
        verified
      }
      category
      created_on
      delivery_time
      description
      id
      isLiked
      likes
      restaurant_id
      shop_id
      business_id
      title
      type
      user_id
      video_url
      is_active
      reel_likes {
        created_at
        id
        reel_id
        user_id
      }
      reel_orders {
        OrderID
        combined_order_id
        created_at
        delivery_address_id
        delivery_fee
        delivery_note
        delivery_photo_url
        delivery_time
        discount
        found
        id
        quantity
        reel_id
        service_fee
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
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
      }
      Shops {
        address
        category_id
        created_at
        description
        id
        image
        is_active
        latitude
        logo
        longitude
        name
        phone
        operating_hours
        relatedTo
        ssd
        tin
        updated_at
      }
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
      BusinessAccount: business_account {
        id
        business_name
        business_email
        business_phone
        face_image
      }
    }
  }
`;

export const GET_REFERRAL_WINDOW = `
  query GetReferralWindow {
    Referral_window(order_by: {created_at: desc}) {
      created_at
      deviceFingerprint
      email
      user_id
      status
      referralCode
      phoneVerified
      phone
      name
      id
      User {
        email
        gender
        id
        is_active
        is_guest
        name
        password_hash
        phone
        profile_picture
        updated_at
      }
    }
  }
`;
export const GET_REFERRAL_ORDERS = `
  query GetReferralOrders($referralCodes: [String!]!) {
    Orders(where: {voucher_code: {_in: $referralCodes}}) {
      OrderID
      assigned_at
      id
      pin
      total
      updated_at
      voucher_code
      Order_Items {
        created_at
        order_id
        id
        price
        product_id
        quantity
        Product {
          final_price
          created_at
          category
          measurement_unit
          image
          is_active
          shop_id
          sku
          supplier
          updated_at
          price
          quantity
        }
      }
      status
      shopper_id
      delivery_fee
      service_fee
    }
  }
`;

export const GET_ORDER_OFFERS = `
  query GetOrderOffers {
    order_offers {
      business_order_id
      done_on
      expires_at
      id
      offered_at
      order_id
      order_type
      reel_order_id
      restaurant_order_id
      round_number
      shopper_id
      status
      updated_at
      reelOrders {
        OrderID
        delivery_note
        delivery_photo_url
        delivery_time
        service_fee
        status
      }
      ShopperUser {
        email
        shopper {
          Employment_id
          active
          address
          full_name
          onboarding_step
          phone
          phone_number
          status
        }
      }
      Orders {
        OrderID
        assigned_at
        created_at
        delivery_address_id
        delivery_fee
        delivery_notes
        discount
        delivery_time
        pin
        service_fee
        shop_id
        shopper_id
        status
        total
        updated_at
      }
      businessProductOrders {
        OrderID
        allProducts
        created_at
        comment
        combined_order_id
        id
        latitude
        longitude
        ordered_by
        pin
        service_fee
        timeRange
        status
      }
      restaurantOrder {
        OrderID
        assigned_at
        Address {
          city
          is_default
          id
          latitude
          longitude
        }
        created_at
        combined_order_id
        delivery_fee
        delivery_photo_url
        delivery_notes
        discount
        delivery_time
        found
        delivery_address_id
        pin
        restaurant_id
        shopper_id
        status
        total
        updated_at
        user_id
        voucher_code
      }
    }
  }
`;
