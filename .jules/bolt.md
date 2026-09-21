## 2026-09-21 - Request-Scoped Caching for GraphQL Field Resolvers

**Learning:** In Apollo GraphQL servers querying Postgres without DataLoader libraries, field resolvers (e.g. `rating`, `review_count`, or nested entity lookups like `Order.cafe`) trigger N+1 queries and duplicate database calls when evaluating fields for lists of items. Passing a request-scoped `loaderCache = new Map()` in the Apollo `context` allows field resolvers to batch-fetch combined fields (e.g., computing `AVG` and `COUNT` in a single query) and share lookups across the same request safely without cross-request state pollution or stale data.

**Action:** Always attach a fresh `loaderCache = new Map()` to the request context when setting up Apollo Server and check `context?.loaderCache` inside relational or aggregate field resolvers before querying the database.
