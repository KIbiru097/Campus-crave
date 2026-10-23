## 2026-07-21 - Request-Scoped Caching for GraphQL Field Resolvers

**Learning:** GraphQL field resolvers (such as `average_rating`, `review_count`, `Order.cafe`, `Order.student`) frequently trigger N+1 query patterns when querying nested lists or requesting multiple fields on the same model. By attaching a lightweight `requestCache: new Map()` to the Apollo GraphQL request context, field resolvers can deduplicate concurrent database operations within the same HTTP request without global cross-request stale cache risks or extra external dependencies.

**Action:** Instantiating `requestCache: new Map()` in Apollo Server's `context` callback and wrapping field resolvers in a promise-caching helper `getCached(context, key, fetcher)` cuts redundant SQL queries per request down to 1.
