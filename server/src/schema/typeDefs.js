const { gql } = require('graphql-tag');

const typeDefs = gql`
    # ============== TYPES ==============
    
    type User {
        id: ID!
        username: String!
        email: String!
        phone: String
        role: String!
        created_at: String
        last_login: String
    }

    type Student {
        id: ID!
        user_id: Int!
        full_name: String!
        reg_no: String!
        institution: String!
        department: String
        year_of_study: Int
        phone_number: String
        verification_status: String!
        is_verified: Boolean!
        verification_date: String
        id_photo_path: String
        verified_at: String
        created_at: String!
        user: User
    }

    type Cafe {
        id: ID!
        name: String!
        description: String
        location: String!
        contact_phone: String
        is_active: Boolean!
        created_at: String!
        updated_at: String
        menu_items: [MenuItem]
        owner: User
        staff: [User]
    }

    type MenuItem {
        id: ID!
        cafe_id: Int!
        name: String!
        description: String
        price: Float!
        category: String
        image_url: String
        preparation_time: Int
        status: String!
        created_at: String!
        updated_at: String
        cafe: Cafe
    }

    type OrderItem {
        id: ID!
        order_id: Int!
        menu_item_id: Int!
        quantity: Int!
        unit_price: Float!
        subtotal: Float!
        customizations: String
        menu_item: MenuItem
    }

    type Order {
        id: ID!
        order_number: String!
        student_id: Int!
        cafe_id: Int!
        total_amount: Float!
        item_count: Int!
        payment_type: String!
        order_status: String!
        special_instructions: String
        pickup_time: String
        completed_at: String
        created_at: String!
        updated_at: String!
        student: Student
        cafe: Cafe
        items: [OrderItem]
        payment: Payment
        delivery: Delivery
    }

    type Payment {
        id: ID!
        order_id: Int!
        amount: Float!
        payment_method: String!
        payment_status: String!
        transaction_id: String
        refund_amount: Float
        refund_transaction_id: String
        processed_at: String!
        order: Order
    }

    type Delivery {
        id: ID!
        order_id: Int!
        delivery_person_id: Int!
        assigned_by: Int!
        status: String!
        pickup_time: String
        delivered_time: String
        delivery_address: String
        notes: String
        created_at: String!
        updated_at: String!
        delivery_person: User
        assigner: User
        order: Order
    }

    type Cart {
        id: ID!
        student_id: Int!
        items: [CartItem]
        total: Float
        item_count: Int
        created_at: String!
        updated_at: String!
    }

    type CartItem {
        id: ID!
        cart_id: Int!
        menu_item_id: Int!
        quantity: Int!
        unit_price: Float!
        customizations: String
        added_at: String!
        menu_item: MenuItem
    }

    type OCRValidation {
        id: ID!
        student_id: Int!
        image_path: String
        extracted_data: String
        extracted_name: String
        confidence_score: Float
        status: String!
        error_message: String
        created_at: String!
        student: Student
    }

    type AuthPayload {
        token: String!
        user: User!
    }

    type PaymentResult {
        success: Boolean!
        message: String!
    }

    type OCRResult {
        success: Boolean!
        extracted_name: String
        confidence: Float
        message: String
    }

    # ============== INPUT TYPES ==============
    
    input RegisterInput {
        username: String!
        full_name: String!
        email: String!
        password: String!
        phone: String!
        reg_no: String!
        institution: String!
        department: String
        year_of_study: Int
        id_image_base64: String
    }

    input LoginInput {
        email: String!
        password: String!
    }

    input CreateCafeInput {
        name: String!
        description: String
        location: String!
        contact_phone: String
    }

    input UpdateCafeInput {
        name: String
        description: String
        location: String
        contact_phone: String
        is_active: Boolean
    }

    input CreateMenuItemInput {
        cafe_id: Int!
        name: String!
        description: String
        price: Float!
        category: String
        preparation_time: Int
        image_url: String
    }

    input UpdateMenuItemInput {
        name: String
        description: String
        price: Float
        category: String
        status: String
        preparation_time: Int
        image_url: String
    }

    input CreateOrderInput {
        cafe_id: Int!
        payment_type: String!
        special_instructions: String
        delivery_address: String
    }

    input UpdateOrderStatusInput {
        order_id: Int!
        status: String!
    }

    input AddToCartInput {
        menu_item_id: Int!
        quantity: Int!
        customizations: String
    }

    # ============== QUERIES ==============
    
    type Query {
        # Test
        hello: String!
        
        # User queries
        me: User
        user(id: ID!): User
        users(role: String, limit: Int, offset: Int): [User!]!
        
        # Student queries
        myProfile: Student
        student(id: ID!): Student
        students(limit: Int, offset: Int): [Student!]!
        
        # Cafe queries
        cafes(active_only: Boolean): [Cafe!]!
        cafe(id: ID!): Cafe
        
        # OWNER QUERIES - ADD THIS LINE
        getMyCafes: [Cafe!]!
        
        # Menu queries
        menuItems(cafe_id: ID, category: String): [MenuItem!]!
        menuItem(id: ID!): MenuItem
        
        # Order queries
        myOrders(limit: Int, status: String): [Order!]!
        cafeOrders(cafe_id: ID, status: String, limit: Int): [Order!]!
        order(id: ID!): Order
        
        # Cart queries
        myCart: Cart
        
        # Delivery queries
        myDeliveries(status: String): [Delivery!]!
        deliveries(limit: Int): [Delivery!]!
    }

    # ============== MUTATIONS ==============
    
    type Mutation {
        # Auth mutations
        register(input: RegisterInput!): AuthPayload!
        login(input: LoginInput!): AuthPayload!
        
        # OCR Verification
        verifyStudentWithOCR(id_image_base64: String!, full_name: String!): OCRResult!
        
        # Cafe mutations (CRUD)
        createCafe(input: CreateCafeInput!): Cafe!
        updateCafe(id: ID!, input: UpdateCafeInput!): Cafe!
        deleteCafe(id: ID!): Boolean!
        toggleCafeStatus(id: ID!): Cafe!
        
        # Menu item mutations
        createMenuItem(input: CreateMenuItemInput!): MenuItem!
        updateMenuItem(id: ID!, input: UpdateMenuItemInput!): MenuItem!
        deleteMenuItem(id: ID!): Boolean!
        
        # Cart mutations
        addToCart(input: AddToCartInput!): Cart!
        updateCartItem(cart_item_id: ID!, quantity: Int!): Cart!
        removeFromCart(cart_item_id: ID!): Cart!
        clearCart: Boolean!
        
        # Order mutations
        createOrder(input: CreateOrderInput!): Order!
        updateOrderStatus(input: UpdateOrderStatusInput!): Order!
        cancelOrder(order_id: ID!): Order!
        
        # Payment mutations
        verifyPayment(orderId: ID!, paymentPassword: String!): PaymentResult!
        
        # Delivery mutations
        assignDelivery(order_id: ID!, delivery_person_id: ID!): Delivery!
        updateDeliveryStatus(delivery_id: ID!, status: String!): Delivery!
    }
`;

module.exports = typeDefs;