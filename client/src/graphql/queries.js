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
            status
            cafe_id
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
                id
                name
            }
            items {
                id
                quantity
                unit_price
                menu_item {
                    id
                    name
                }
            }
        }
    }
`;

export const GET_PROFILE = gql`
    query GetProfile {
        me {
            id
            username
            email
            phone
            role
            created_at
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
        }
    }
`;