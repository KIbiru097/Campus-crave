## 2026-10-12 - Parallelizing Database Queries and Short-Circuiting GraphQL Field Resolvers

**Learning:** Independent SQL queries in analytics/dashboard endpoints that execute sequentially with `await` waste connection pool capacity and multiply network latency. In addition, parent queries in GraphQL that perform `JOIN`s (e.g. `orders` JOIN `cafes`) pass joined fields to field resolvers, but child resolvers will re-query the database unless checked.
**Action:** Always check if child field resolvers can reuse parent-resolved JOIN fields (e.g., `order.cafe_name`), and wrap independent read-only database queries in `Promise.all` to leverage connection pooling.
