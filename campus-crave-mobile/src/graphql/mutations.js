import { gql } from '@apollo/client';

export const LOGIN_USER = gql`
    mutation Login($email: String!, $password: String!) {
        login(input: { email: $email, password: $password }) {
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
                }
            }
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
        }
    }
`;