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
export const ADD_PRODUCT_NAME = `
  mutation AddProductName(
    $name: String!
    $description: String
    $barcode: String
    $sku: String
    $image: String
  ) {
    insert_productNames_one(
      object: {
        name: $name
        description: $description
        barcode: $barcode
        sku: $sku
        image: $image
      }
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

export const GET_PRODUCT_NAME_BY_BARCODE = `
  query GetProductNameByBarcode($barcode: String!) {
    productNames(where: {barcode: {_eq: $barcode}}) {
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

export const GET_PRODUCT_NAME_BY_SKU = `
  query GetProductNameBySku($sku: String!) {
    productNames(where: {sku: {_eq: $sku}}) {
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

export const ADD_PRODUCT = `
  mutation AddProduct(
    $productName_id: uuid!
    $price: String!
    $quantity: Int!
    $measurement_unit: String!
    $shop_id: uuid!
    $category: String!
    $reorder_point: Int
    $supplier: String
    $is_active: Boolean = true
    $final_price: String!
  ) {
    insert_Products_one(
      object: {
        productName_id: $productName_id
        price: $price
        quantity: $quantity
        measurement_unit: $measurement_unit
        shop_id: $shop_id
        category: $category
        reorder_point: $reorder_point
        supplier: $supplier
        is_active: $is_active
        final_price: $final_price
      }
    ) {
      id
      productName_id
      price
      quantity
      measurement_unit
      shop_id
      category
      reorder_point
      supplier
      is_active
      final_price
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
  }
`;

export const UPDATE_PRODUCT = `
  mutation UpdateProduct(
    $id: uuid!
    $price: String
    $quantity: Int
    $measurement_unit: String
    $final_price: String
    $supplier: String
    $reorder_point: Int
  ) {
    update_Products_by_pk(
      pk_columns: { id: $id }
      _set: {
        price: $price
        quantity: $quantity
        measurement_unit: $measurement_unit
        final_price: $final_price
        supplier: $supplier
        reorder_point: $reorder_point
        updated_at: "now()"
      }
    ) {
      id
      productName_id
      price
      quantity
      measurement_unit
      shop_id
      category
      reorder_point
      supplier
      is_active
      final_price
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

// Staff Management Mutations
export const ADD_ORG_EMPLOYEE = `
  mutation AddOrgEmployee($Address: String = "", $dob: String = "", $email: String = "", $fullnames: String = "", $gender: String = "", $password: String = "", $phone: String = "", $restaurant_id: uuid, $shop_id: uuid!, $Position: String = "", $roleType: String = "") {
    insert_orgEmployees(objects: {Address: $Address, active: true, dob: $dob, email: $email, fullnames: $fullnames, gender: $gender, multAuthEnabled: false, password: $password, phone: $phone, restaurant_id: $restaurant_id, shop_id: $shop_id, Position: $Position, generatePassword: false, roleType: $roleType}) {
      affected_rows
      returning {
        id
        employeeID
        fullnames
        email
        phone
        Address
        active
        shop_id
        restaurant_id
        Position
        roleType
      }
    }
  }
`;

export const ADD_ORG_EMPLOYEE_ROLES = `
  mutation addOrgEmployeeRoles($orgEmployeeID: uuid = "", $privillages: jsonb = "") {
    insert_orgEmployeeRoles(objects: {orgEmployeeID: $orgEmployeeID, privillages: $privillages}) {
      affected_rows
    }
  }
`;

export const UPDATE_ORG_EMPLOYEE_ROLE = `
  mutation UpdateOrgEmployeeRole($id: uuid!, $privillages: jsonb!) {
    update_orgEmployeeRoles(where: {orgEmployeeID: {_eq: $id}}, _set: {privillages: $privillages}) {
      affected_rows
    }
  }
`;

export const UPDATE_ORG_EMPLOYEE = `
  mutation UpdateOrgEmployee($id: uuid!, $fullnames: String, $email: String, $phone: String, $Address: String, $Position: String, $active: Boolean, $roleType: String) {
    update_orgEmployees(where: {id: {_eq: $id}}, _set: {fullnames: $fullnames, email: $email, phone: $phone, Address: $Address, Position: $Position, active: $active, roleType: $roleType}) {
      affected_rows
    }
  }
`;

export const DELETE_ORG_EMPLOYEE = `
  mutation DeleteOrgEmployee($id: uuid!) {
    delete_orgEmployees(where: {id: {_eq: $id}}) {
      affected_rows
    }
  }
`;

// Update orgEmployee last_login and online
export const UPDATE_ORG_EMPLOYEE_LAST_LOGIN_AND_ONLINE = `
  mutation updateOrgEmployeeLastLoginAndOnline($id: uuid!, $last_login: String!, $online: Boolean!) {
    update_orgEmployees_by_pk(pk_columns: { id: $id }, _set: { last_login: $last_login, online: $online }) {
      id
      last_login
      online
    }
  }
`;

// Update orgEmployee twoFactorSecrets
export const UPDATE_ORG_EMPLOYEE_TWO_FACTOR_SECRETS = `
  mutation updateOrgEmployeeTwoFactorSecrets($id: uuid!, $twoFactorSecrets: String!) {
    update_orgEmployees_by_pk(pk_columns: { id: $id }, _set: { twoFactorSecrets: $twoFactorSecrets }) {
      id
      twoFactorSecrets
    }
  }
`;

// Update ProjectUser last login
export const UPDATE_PROJECT_USER_LAST_LOGIN = `
  mutation UpdateProjectUserLastLogin($id: uuid!, $lastLogin: timestamptz!) {
    update_ProjectUsers(
      where: { id: { _eq: $id } },
      _set: { last_Login: $lastLogin }
    ) {
      affected_rows
    }
  }
`;

// Checkout mutations
export const ADD_CHECKOUT = `
  mutation addcheckouts($Processed_By: uuid = "", $cartItems: jsonb = "", $payment_method: String = "", $shop_id: uuid = "", $subtotal: String = "", $tax: String = "", $tin: String = "", $total: String = "") {
    insert_shopCheckouts(objects: {Processed_By: $Processed_By, cartItems: $cartItems, payment_method: $payment_method, shop_id: $shop_id, subtotal: $subtotal, tax: $tax, tin: $tin, total: $total}) {
      affected_rows
      returning {
        id
        number
      }
    }
  }
`;

// Shop settings mutations
export const UPDATE_SHOP_SETTINGS = `
  mutation UpdateShopSettings(
    $id: uuid!
    $name: String
    $description: String
    $address: String
    $phone: String
    $operating_hours: String
    $is_active: Boolean
    $logo: String
    $tin: String
    $ssd: String
  ) {
    update_Shops_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        description: $description
        address: $address
        phone: $phone
        operating_hours: $operating_hours
        is_active: $is_active
        logo: $logo
        tin: $tin
        ssd: $ssd
        updated_at: "now()"
      }
    ) {
      id
      name
      description
      address
      phone
      operating_hours
      is_active
      logo
      tin
      ssd
      updated_at
    }
  }
`;

// Create shop mutation
export const CREATE_SHOP = `
  mutation CreateShop(
    $name: String!
    $description: String
    $category_id: uuid
    $address: String
    $phone: String
    $operating_hours: json
    $latitude: String
    $longitude: String
    $logo: String
    $image: String
    $tin: String
    $ssd: String
    $is_active: Boolean = true
    $relatedTo: String
  ) {
    insert_Shops_one(
      object: {
        name: $name
        description: $description
        category_id: $category_id
        address: $address
        phone: $phone
        operating_hours: $operating_hours
        latitude: $latitude
        longitude: $longitude
        logo: $logo
        image: $image
        tin: $tin
        ssd: $ssd
        is_active: $is_active
        relatedTo: $relatedTo
      }
    ) {
      id
      name
      description
      category_id
      address
      phone
      operating_hours
      latitude
      longitude
      logo
      image
      tin
      ssd
      is_active
      relatedTo
      created_at
      updated_at
      Category {
        id
        name
      }
    }
  }
`;

export const UPDATE_PRODUCT_NAME = `
  mutation UpdateProductName(
    $id: uuid!
    $name: String
    $description: String
    $barcode: String
    $sku: String
    $image: String
  ) {
    update_productNames_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        description: $description
        barcode: $barcode
        sku: $sku
        image: $image
      }
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

// Restaurant mutations
export const ADD_RESTAURANT = `
  mutation addResturantDetails(
    $email: String = ""
    $is_active: Boolean = false
    $lat: String = ""
    $location: String = ""
    $long: String = ""
    $logo: String = ""
    $name: String = ""
    $phone: String = ""
    $profile: String = ""
    $tin: String = ""
    $ussd: String = ""
  ) {
    insert_Restaurants(
      objects: {
        email: $email
        is_active: $is_active
        lat: $lat
        location: $location
        long: $long
        logo: $logo
        name: $name
        phone: $phone
        profile: $profile
        tin: $tin
        ussd: $ussd
        verified: true
      }
    ) {
      affected_rows
    }
  }
`;

// Reels mutations
export const ADD_REEL = `
  mutation addReels(
    $Price: String = ""
    $Product: jsonb = ""
    $category: String = ""
    $delivery_time: String = ""
    $description: String = ""
    $likes: String = "0"
    $restaurant_id: uuid = null
    $shop_id: uuid = null
    $title: String = ""
    $type: String = ""
    $user_id: uuid = null
    $video_url: String = ""
    $is_active: Boolean = true
  ) {
    insert_Reels(
      objects: {
        Price: $Price
        Product: $Product
        category: $category
        delivery_time: $delivery_time
        description: $description
        isLiked: false
        likes: $likes
        restaurant_id: $restaurant_id
        shop_id: $shop_id
        title: $title
        type: $type
        user_id: $user_id
        video_url: $video_url
        is_active: $is_active
      }
    ) {
      affected_rows
    }
  }
`;

export const UPDATE_REEL = `
  mutation updateReel(
    $id: uuid!
    $Price: String = ""
    $Product: jsonb = ""
    $category: String = ""
    $delivery_time: String = ""
    $description: String = ""
    $title: String = ""
    $type: String = ""
    $video_url: String = ""
    $is_active: Boolean = true
  ) {
    update_Reels_by_pk(
      pk_columns: { id: $id }
      _set: {
        Price: $Price
        Product: $Product
        category: $category
        delivery_time: $delivery_time
        description: $description
        title: $title
        type: $type
        video_url: $video_url
        is_active: $is_active
      }
    ) {
      id
      title
      description
      video_url
      category
      type
      Price
      delivery_time
      is_active
    }
  }
`;
// Personal Wallet mutations
export const ADD_PERSONAL_WALLET_TRANSACTION = `
  mutation addPersonalWalletTransactions($action: String = "", $amount: String = "", $received_wallet: uuid!, $status: String = "", $wallet_id: uuid!, $doneBy: uuid!) {
    insert_personalWalletTransactions(objects: {action: $action, amount: $amount, received_wallet: $received_wallet, status: $status, wallet_id: $wallet_id, doneBy: $doneBy}) {
      affected_rows
    }
  }
`;

export const UPDATE_PERSONAL_WALLET = `
  mutation updatePersonalWallet($balance: String = "", $updated_at: timestamptz = "", $user_id: uuid = "") {
    update_personalWallet(where: {user_id: {_eq: $user_id}}, _set: {balance: $balance, updated_at: $updated_at}) {
      affected_rows
    }
  }
`;

export const UPDATE_REFERRAL_WINDOW_STATUS = `
  mutation UpdateReferralWindowStatus($id: uuid!, $status: String!, $phoneVerified: Boolean!) {
    update_Referral_window_by_pk(
      pk_columns: { id: $id },
      _set: { status: $status, phoneVerified: $phoneVerified }
    ) {
      id
      status
      phoneVerified
    }
  }
`;
export const DELETE_REEL = `
  mutation DeleteReel($id: uuid!) {
    delete_Reels_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_REEL_COMMENT = `
  mutation DeleteReelComment($id: uuid!) {
    delete_Reels_comments_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_ORDER_OFFERS = `
  mutation DeleteOrderOffers($where: order_offers_bool_exp!) {
    delete_order_offers(where: $where) {
      affected_rows
    }
  }
`;
