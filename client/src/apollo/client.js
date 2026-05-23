import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Your computer's IP address (from running `hostname -I`)
// Make sure your phone is on the same WiFi network
const IP_ADDRESS = '192.168.1.15';

// Create HTTP link to your backend
const httpLink = createHttpLink({
    uri: `http://${IP_ADDRESS}:4000/graphql`,
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