# Bolt's Performance Journal

## 2026-09-06 - GraphQL Field Resolver Request-Scoped Caching
**Learning:** In GraphQL APIs using Apollo Server, field resolvers for nested fields (such as `average_rating`, `review_count`, or nested parent entities like `cafe` on `Order`) run per-entity. When multiple fields on an entity require aggregate calculations or lookups, or when querying lists of entities, executing individual DB queries per field causes severe N+1 overhead and duplicated queries. Adding a request-scoped `Map` to the Apollo GraphQL context allows field resolvers to batch and deduplicate query execution safely without risk of cross-request cache leaks.
**Action:** Always instantiate a short-lived request cache Map in Apollo context and use cached loader helpers for field resolvers.
