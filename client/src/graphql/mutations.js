import { gql } from '@apollo/client';

// ==================== AUTH MUTATIONS ====================

export const LOGIN_USER = gql`
    mutation Login($input: LoginInput!) {
        login(input: $input) {
            token
            user {
                id
                username
                email
                role
            }
        }
    }
`;

export const REGISTER_USER = gql`
    mutation Register($input: RegisterInput!) {
        register(input: $input) {
            token
            user {
                id
                username
                email
                role
            }
        }
    }
`;

// ==================== CART MUTATIONS ====================

export const ADD_TO_CART = gql`
    mutation AddToCart($input: AddToCartInput!) {
        addToCart(input: $input) {
            id
            items {
                id
                quantity
                unit_price
                menu_item {
                    id
                    name
                    price
                }
            }
            total
            item_count
        }
    }
`;

export const UPDATE_CART_ITEM = gql`
    mutation UpdateCartItem($cartItemId: ID!, $quantity: Int!) {
        updateCartItem(cart_item_id: $cartItemId, quantity: $quantity) {
            id
            total
            item_count
        }
    }
`;

export const REMOVE_FROM_CART = gql`
    mutation RemoveFromCart($cartItemId: ID!) {
        removeFromCart(cart_item_id: $cartItemId) {
            id
            total
            item_count
        }
    }
`;

export const CLEAR_CART = gql`
    mutation ClearCart {
        clearCart
    }
`;

// ==================== ORDER MUTATIONS ====================

export const CREATE_ORDER = gql`
    mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
            id
            order_number
            total_amount
            order_status
            created_at
        }
    }
`;

export const UPDATE_ORDER_STATUS = gql`
    mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
        updateOrderStatus(input: $input) {
            id
            order_status
            updated_at
        }
    }
`;

export const CANCEL_ORDER = gql`
    mutation CancelOrder($orderId: ID!) {
        cancelOrder(order_id: $orderId) {
            id
            order_status
            updated_at
        }
    }
`;

// ==================== CAFE MANAGEMENT MUTATIONS (Admin) ====================

export const CREATE_CAFE = gql`
    mutation CreateCafe($input: CreateCafeInput!) {
        createCafe(input: $input) {
            id
            name
            description
            location
            contact_phone
            is_active
        }
    }
`;

export const REGISTER_CAFE = gql`
    mutation RegisterCafe($input: CreateCafeInput!) {
        registerCafe(input: $input) {
            id
            name
            description
            location
            contact_phone
            is_active
        }
    }
`;

export const ASSIGN_CAFE_OWNER = gql`
    mutation AssignCafeOwner($cafeId: ID!, $userId: ID!) {
        assignCafeOwner(cafe_id: $cafeId, user_id: $userId) {
            id
            user_id
            cafe_id
            position
        }
    }
`;

export const SOFT_DELETE_CAFE = gql`
    mutation SoftDeleteCafe($id: ID!) {
        softDeleteCafe(id: $id) {
            id
            name
            deleted_at
        }
    }
`;

export const RESTORE_CAFE = gql`
    mutation RestoreCafe($id: ID!) {
        restoreCafe(id: $id) {
            id
            name
            deleted_at
        }
    }
`;

// ==================== MENU MANAGEMENT MUTATIONS ====================

export const CREATE_MENU_ITEM = gql`
    mutation CreateMenuItem($input: CreateMenuItemInput!) {
        createMenuItem(input: $input) {
            id
            name
            description
            price
            category
            status
        }
    }
`;

export const UPDATE_MENU_ITEM = gql`
    mutation UpdateMenuItem($id: ID!, $input: UpdateMenuItemInput!) {
        updateMenuItem(id: $id, input: $input) {
            id
            name
            description
            price
            category
            status
        }
    }
`;

export const SOFT_DELETE_MENU_ITEM = gql`
    mutation SoftDeleteMenuItem($id: ID!) {
        softDeleteMenuItem(id: $id) {
            id
            name
            deleted_at
        }
    }
`;

export const RESTORE_MENU_ITEM = gql`
    mutation RestoreMenuItem($id: ID!) {
        restoreMenuItem(id: $id) {
            id
            name
            deleted_at
        }
    }
`;

// ==================== DELIVERY MUTATIONS ====================

export const ASSIGN_DELIVERY = gql`
    mutation AssignDelivery($orderId: ID!, $deliveryPersonId: ID!) {
        assignDelivery(order_id: $orderId, delivery_person_id: $deliveryPersonId) {
            id
            status
            delivery_person_id
        }
    }
`;

export const UPDATE_DELIVERY_STATUS = gql`
    mutation UpdateDeliveryStatus($deliveryId: ID!, $status: String!) {
        updateDeliveryStatus(delivery_id: $deliveryId, status: $status) {
            id
            status
            pickup_time
            delivered_time
        }
    }
`;