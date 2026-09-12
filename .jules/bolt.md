# Bolt's Journal - Critical Learnings

## 2026-09-12 - Request-scoped DataLoader Map for GraphQL N+1 Query Resolution
**Learning:** In this Express + Apollo Server architecture without DataLoader installed, nested field resolvers (`Order.cafe`, `Order.student`, `Order.items`, `Cafe.average_rating`, `Review.student`, etc.) trigger duplicate Postgres queries within the same GraphQL request lifecycle. Instantiating a per-request `loaderCache` Map in the Apollo `context` function allows field resolvers to promise-cache and deduplicate database lookups without modifying package.json or adding external libraries.
**Action:** Use `getCachedQueryResult(context?.loaderCache, key, fetchFn)` across nested field resolvers to avoid redundant DB calls per request.
