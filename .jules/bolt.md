## 2026-08-20 - GraphQL Request-Scoped Cache Key Alignment with Query Filters
**Learning:** Field resolvers that fetch the same entity type with different filtering criteria (such as filtering out soft-deleted records `deleted_at IS NULL` vs querying all records) will collide if they share identical cache keys in a request-scoped cache Map.
**Action:** Always differentiate cache keys based on query semantics (e.g., `cafeActive:${id}` vs `cafe:${id}`) to ensure consistent query results within a single request context.
