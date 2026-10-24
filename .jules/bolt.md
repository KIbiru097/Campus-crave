## 2026-10-24 - Correlated Subquery Aggregation Bottleneck in Recommendations Query
**Learning:** Correlated scalar subqueries inside SQL `SELECT` or `ORDER BY` clauses (e.g. `(SELECT SUM(quantity) FROM order_items WHERE menu_item_id = mi.id)`) execute per candidate row and scale as O(N * M) in PostgreSQL.
**Action:** Replace correlated subqueries with pre-aggregated `LEFT JOIN` subqueries (`GROUP BY menu_item_id`) to perform set-based batch aggregation in a single scan pass O(N + M). Always cast PG aggregate outputs with `Number()` in JS resolvers when comparing.
