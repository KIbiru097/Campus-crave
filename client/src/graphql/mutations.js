import { gql } from '@apollo/client';

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

export const CLEAR_CART = gql`
    mutation ClearCart {
        clearCart
    }
`;