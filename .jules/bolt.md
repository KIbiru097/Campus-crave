# Bolt's Journal

## 2026-09-28 - Request-scoped Data Loader / Caching in GraphQL Resolvers
**Learning:** In GraphQL schemas with nested relation field resolvers (e.g., `Cafe.menu_items`, `Cafe.average_rating`, `Order.student`, `Order.items`), querying collections of parent entities causes N+1 SQL query bottlenecks. Implementing per-request batching or caching in the GraphQL context eliminates duplicate DB queries without global cache invalidation issues.
**Action:** Use a request-scoped DataLoader/Cache object created in Apollo context to cache and deduplicate database query results per request.
