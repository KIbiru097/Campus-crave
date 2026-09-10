## 2026-09-10 - Request-Scoped DataLoader Batching for GraphQL Review Metrics

**Learning:** In this GraphQL backend, field resolvers on `Cafe` and `MenuItem` (`average_rating` and `review_count`) each triggered independent database queries against the `reviews` table for every item in a list response, resulting in severe N+1 and redundant query problems. By attaching lightweight, zero-dependency batch loaders (`createBatchLoader`) to the request context using `process.nextTick`, all entity IDs requested in a single GraphQL resolution tick are aggregated into a single `WHERE id = ANY($1)` SQL query.

**Action:** For GraphQL field resolvers that compute aggregate metrics across lists, use request-scoped microtask loaders to deduplicate and batch database operations into single SQL queries without requiring external libraries.
