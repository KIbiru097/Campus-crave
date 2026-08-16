# Bolt's Journal - Critical Learnings

## 2026-08-16 - Request-Scoped Caching in GraphQL Resolvers
**Learning:** GraphQL field resolvers on list items (such as `average_rating` and `review_count` on `Cafe` or `MenuItem`) lead to N+1 database queries. By attaching a per-request cache (or Map of pending promises) to the GraphQL `context` object, field resolvers for the same entity can share database queries and avoid redundant roundtrips.
**Action:** When adding GraphQL field resolvers that compute aggregates or related models, use a short-lived request-scoped Map on `context` to batch and deduplicate queries.
