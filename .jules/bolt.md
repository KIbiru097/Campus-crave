# Bolt's Performance Journal

## 2026-08-10 - GraphQL N+1 Query Resolution via Short-Lived Context Cache
**Learning:** In a GraphQL backend with nested schema relationships, calling multiple separate field resolvers (such as rating and review counts) results in N+1 database query issues where redundant queries are dispatched concurrently for the same entity. Utilizing a short-lived, per-request cache initialized inside the GraphQL request context allows sharing cached aggregate statistics without the overhead of heavy caching layers or state leakage across requests.
**Action:** When designing nested field resolvers, check if multiple fields execute query patterns to the same tables for the same parent IDs. Implement a request-scoped cache (such as a simple request-level Map or DataLoader) to deduplicate database traffic.
