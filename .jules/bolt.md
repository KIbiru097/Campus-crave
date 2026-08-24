# Bolt's Performance Journal

## 2026-08-24 - GraphQL Request-Scoped Query Caching for Field Resolvers
**Learning:** GraphQL field resolvers on lists (e.g. fetching `student`, `cafe`, `payment` or `delivery` for an array of orders) result in N+1 database queries. Since Apollo context is re-created per GraphQL HTTP request, instantiating a short-lived request-scoped cache Map in context allows field resolvers to batch or deduplicate identical concurrent queries across the list without stale data risks across requests.
**Action:** Always instantiate a request-scoped query cache Map in Apollo Server context and wrap repetitive field resolver database queries with a helper that checks and populates the cache.
