# Bolt's Journal - Critical Learnings

## 2026-10-11 - Request-scoped caching for GraphQL field resolvers
**Learning:** In GraphQL schema resolvers for relational models (like Cafe or MenuItem), fetching aggregate metrics like `average_rating` and `review_count` in separate field resolvers causes N+2 database queries per entity list item. Combining aggregate queries and memoizing results in a request-scoped cache reduces DB query overhead by 50% without needing heavy external libraries.
**Action:** Always check GraphQL field resolvers on list entities for duplicated sub-queries and leverage request-scoped context maps or batching.
