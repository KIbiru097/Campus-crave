## 2025-02-23 - Request-Scoped GraphQL Resolver Cache for Entity Stats & Relations
**Learning:** GraphQL queries requesting sibling fields (e.g., `average_rating` and `review_count` on `Cafe` or `MenuItem`) or repeating entity lookups (e.g. `Order.cafe`) trigger N+1 separate PostgreSQL queries when implemented naively.
**Action:** Pass a fresh `Map` in Apollo context per request (`cache: new Map()`) and use it in field resolvers to aggregate related calculations into a single database query per entity per request.
