# Bolt's Journal - Critical Learnings

## 2026-08-29 - GraphQL Field Resolver Request-Scoped Caching
**Learning:** In Apollo GraphQL servers, field resolvers on nested types (such as `Order.cafe`, `Order.student`, `Cafe.average_rating`, `Cafe.review_count`) execute independently per parent entity, causing N+1 database queries when fetching lists. Using a request-scoped `Map` in the Apollo context to cache and deduplicate database call promises within the lifecycle of a single HTTP request eliminates redundant queries without introducing cross-request stale data risks or requiring external cache invalidation logic.
**Action:** Always instantiate a request-scoped cache Map in `context` for GraphQL resolvers and wrap nested entity queries or field statistics queries in a promise-deduplicating helper.
