# Bolt's Journal - Critical Learnings

## 2026-07-21 - Request-scoped promise caching for GraphQL field resolvers
**Learning:** GraphQL field resolvers for adjacent scalar fields (e.g. `average_rating` and `review_count`) on the same object execute concurrently and independently per object. Without request-scoped caching, fetching multiple metrics from the same database table leads to duplicated N+1 SQL queries per object. Instantiating a request-scoped `Map` in Apollo context to cache and deduplicate in-flight promises allows concurrent field resolvers to share a single database query without requiring external dependencies like `dataloader`.
**Action:** Use request-scoped context Maps to deduplicate concurrent field resolver queries for parent entities.
