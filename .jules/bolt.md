# Bolt's Performance Journal

## 2025-05-20 - GraphQL N+1 Query Bottlenecks in Field Resolvers
**Learning:** Nested GraphQL queries on `Cafe` and `MenuItem` types (like `average_rating`, `review_count`, and `menu_items`) execute individual SQL `SELECT` queries for every parent item in a list result, causing an N+1 query problem.
**Action:** Use request-scoped DataLoader/batching patterns in GraphQL context or field resolvers to batch ID lookups into single `WHERE id = ANY(...)` or grouped queries per GraphQL request execution.
