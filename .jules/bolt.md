## 2026-10-02 - Request-scoped Batching for GraphQL N+1 Resolvers without External Dependencies

**Learning:** In Node.js GraphQL servers without additional libraries like `dataloader`, N+1 queries in field resolvers (e.g. `Order.cafe`, `Order.student`, `Order.items`) can be eliminated by implementing microtask-based batching (`Promise.resolve().then()`) with SQL `ANY($1)` operators. Creating batch loaders fresh per request context prevents cross-request data leakage while batching all child queries triggered within the same GraphQL tick.

**Action:** When optimizing GraphQL field resolvers where adding new package dependencies is restricted, instantiate a request-scoped microtask batch loader factory in the GraphQL context builder and consume it within nested child resolvers.
