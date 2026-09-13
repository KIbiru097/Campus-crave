## 2026-09-13 - [GraphQL Relational Field Resolvers N+1 Caching]
**Learning:** Nested GraphQL field resolvers on list fields (`Order.cafe`, `Order.student`, `Order.payment`, `Order.delivery`, `Delivery.order`) triggered duplicate SQL queries for every row in a list, resulting in high query volume and network latency.
**Action:** Pass a fresh, short-lived `Map` instance in the Apollo Server context on every request and check `context?.dataCache` inside nested resolvers to deduplicate identical database calls during request execution.
