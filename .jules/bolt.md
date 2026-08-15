# Bolt's Performance Journal

## 2026-08-15 - GraphQL Field Resolver Request-Scoped Caching
**Learning:** In GraphQL Apollo Server architectures with SQL relational backends (like PostgreSQL), field resolvers for parent entities (e.g. `Cafe.average_rating`, `Cafe.review_count`, `MenuItem.average_rating`, `MenuItem.review_count`) suffer from severe N+1 database queries when listing multiple items.
By instantiating a request-scoped `Map` cache in Apollo Server's context, field resolvers can query aggregate data (`SELECT AVG(...), COUNT(...)`) once per entity and store both result metrics in the request cache. Subsequent field resolutions within the same HTTP request hit the cache in O(1) time without extra database roundtrips.

**Action:** When building GraphQL field resolvers that compute separate aggregate fields over the same table/entity, fetch all required aggregate metrics in a single SQL query and cache them in `context.cache` keyed by entity ID.
