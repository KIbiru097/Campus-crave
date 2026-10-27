# Bolt's Journal - Critical Learnings

## 2024-10-27 - GraphQL Field Resolvers N+1 Database Bottleneck
**Learning:** In the Express/Apollo Server backend, list queries (e.g. `cafes`, `myOrders`, `cafeOrders`) invoke individual field resolvers per item in the returned array without batching or caching. Moreover, `average_rating` and `review_count` executed separate identical queries against the `reviews` table per cafe/item. Adding a request-scoped Map cache in the Apollo context allows concurrent field resolvers and duplicate queries across items to deduplicate database queries safely without external dependencies like DataLoader.
**Action:** Always instantiate a request-scoped `cache = new Map()` in Apollo context and use a helper `getCached(context, key, fetchFn)` in GraphQL field resolvers.
