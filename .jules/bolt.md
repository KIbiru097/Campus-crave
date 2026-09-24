# Bolt's Performance Journal

## 2026-09-24 - GraphQL Resolver N+1 & Duplicate Query Deduplication
**Learning:** Field resolvers in GraphQL (like `average_rating` and `review_count` or entity relations `Order.cafe`) can cause duplicate DB queries and N+1 queries during list fetching. Storing a request-scoped `Map` in Apollo context allows caching DB Promises for the duration of a single request without risk of cross-request stale data.
**Action:** Always instantiate a request-scoped `cache` Map in Apollo Server context and wrap relation / aggregated field lookups with a request-scoped cache helper.
