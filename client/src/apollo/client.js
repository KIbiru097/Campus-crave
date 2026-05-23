import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Your deployed backend URL on Render
// Replace with your actual Render URL
const BACKEND_URL = 'https://campus-crave-2xzl.onrender.com';

// Create HTTP link to your backend
const httpLink = createHttpLink({
    uri: `${BACKEND_URL}/graphql`,
});

// Add authentication token to requests
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    };
});

// Create Apollo Client instance
const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});

export default client;