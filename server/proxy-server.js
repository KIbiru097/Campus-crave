const http = require('http');
const httpProxy = require('http-proxy');

// Create proxies
const frontendProxy = httpProxy.createProxyServer({ target: 'http://localhost:3000' });
const backendProxy = httpProxy.createProxyServer({ target: 'http://localhost:4000' });

// Create server
const server = http.createServer((req, res) => {
    // Route GraphQL requests to backend
    if (req.url.startsWith('/graphql')) {
        backendProxy.web(req, res);
    } 
    // Route API requests to backend
    else if (req.url.startsWith('/api')) {
        backendProxy.web(req, res);
    }
    // Route everything else to frontend
    else {
        frontendProxy.web(req, res);
    }
});

server.listen(5000, () => {
    console.log('Proxy server running on port 5000');
    console.log('Now run: ngrok http 5000');
});