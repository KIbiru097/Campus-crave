import { gql } from '@apollo/client';

export const GET_CAFES = gql`
    query GetCafes {
        cafes {
            id
            name
            description
            location
            contact_phone
            is_active
        }
    }
`;

export const GET_MENU_ITEMS = gql`
    query GetMenuItems($cafeId: ID) {
        menuItems(cafe_id: $cafeId) {
            id
            name
            description
            price
            category
        }
    }
`;

export const GET_CART = gql`
    query GetCart {
        myCart {
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

export const GET_MY_ORDERS = gql`
    query GetMyOrders {
        myOrders {
            id
            order_number
            total_amount
            order_status
            created_at
            cafe {
                name
            }
            items {
                quantity
                unit_price
                menu_item {
                    name
                }
            }
        }
    }
`;