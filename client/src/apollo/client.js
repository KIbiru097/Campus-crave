import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
    uri: 'https://campus-crave-e5aa.onrender.com/graphql',
});

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('token');
    console.log('Setting authorization header:', token ? 'Token exists' : 'No token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    };
});

const client = new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
});

export default client;