import { gql } from '@apollo/client';

// ==================== CAFE QUERIES ====================

export const GET_CAFES = gql`
    query GetCafes {
        cafes {
            id
            name
            description
            location
            contact_phone
            is_active
            created_at
        }
    }
`;

export const GET_CAFE = gql`
    query GetCafe($id: ID!) {
        cafe(id: $id) {
            id
            name
            description
            location
            contact_phone
            is_active
            created_at
        }
    }
`;

// ==================== MENU QUERIES ====================

export const GET_MENU_ITEMS = gql`
    query GetMenuItems($cafeId: ID) {
        menuItems(cafe_id: $cafeId) {
            id
            name
            description
            price
            category
            status
            cafe_id
        }
    }
`;

// ==================== CART QUERIES ====================

export const GET_CART = gql`
    query GetCart {
        myCart {
            id
            student_id
            items {
                id
                menu_item_id
                quantity
                unit_price
                customizations
                menu_item {
                    id
                    name
                    price
                    category
                    cafe_id
                }
            }
            total
            item_count
        }
    }
`;

// ==================== ORDER QUERIES ====================

export const GET_MY_ORDERS = gql`
    query GetMyOrders($limit: Int, $status: String) {
        myOrders(limit: $limit, status: $status) {
            id
            order_number
            total_amount
            item_count
            payment_type
            order_status
            special_instructions
            created_at
            updated_at
            cafe {
                id
                name
                location
            }
            items {
                id
                quantity
                unit_price
                subtotal
                menu_item {
                    id
                    name
                    price
                }
            }
        }
    }
`;

export const GET_ORDER = gql`
    query GetOrder($id: ID!) {
        order(id: $id) {
            id
            order_number
            total_amount
            item_count
            payment_type
            order_status
            created_at
            cafe {
                id
                name
            }
            items {
                id
                quantity
                unit_price
                subtotal
                menu_item {
                    id
                    name
                }
            }
        }
    }
`;

// ==================== USER QUERIES ====================

export const GET_PROFILE = gql`
    query GetProfile {
        me {
            id
            username
            email
            phone
            role
            created_at
            last_login
        }
        myProfile {
            id
            full_name
            reg_no
            institution
            department
            year_of_study
            phone_number
            verification_status
            verified_at
            created_at
        }
    }
`;

export const GET_USER = gql`
    query GetUser($id: ID!) {
        user(id: $id) {
            id
            username
            email
            phone
            role
            created_at
            last_login
        }
    }
`;

export const GET_USERS = gql`
    query GetUsers($role: String, $limit: Int, $offset: Int) {
        users(role: $role, limit: $limit, offset: $offset) {
            id
            username
            email
            phone
            role
            created_at
            last_login
        }
    }
`;

// ==================== OWNER QUERIES ====================

export const GET_MY_CAFES = gql`
    query GetMyCafes {
        getMyCafes {
            id
            name
            description
            location
            contact_phone
            is_active
            created_at
        }
    }
`;

export const GET_CAFE_ORDERS = gql`
    query GetCafeOrders($cafeId: ID, $status: String, $limit: Int) {
        cafeOrders(cafe_id: $cafeId, status: $status, limit: $limit) {
            id
            order_number
            order_status
            total_amount
            item_count
            payment_type
            delivery_address
            special_instructions
            created_at
            updated_at
            student {
                id
                full_name
                phone_number
                department
                institution
            }
            items {
                id
                quantity
                unit_price
                subtotal
                menu_item {
                    id
                    name
                    category
                }
            }
            delivery {
                id
                status
                delivery_person {
                    id
                    username
                    phone
                }
            }
        }
    }
`;

export const GET_AVAILABLE_ORDERS = gql`
    query GetAvailableOrders {
        availableOrders {
            id
            order_number
            order_status
            total_amount
            item_count
            payment_type
            delivery_address
            special_instructions
            created_at
            cafe {
                id
                name
                location
                contact_phone
            }
            student {
                id
                full_name
                phone_number
            }
            items {
                id
                quantity
                unit_price
                menu_item {
                    name
                }
            }
        }
    }
`;
