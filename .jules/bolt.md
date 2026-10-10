# Bolt's Performance Journal

## 2026-10-10 - Request-Scoped Caching in GraphQL Field Resolvers
**Learning:** In GraphQL APIs, field resolvers like `average_rating` and `review_count` or entity lookups (e.g., `Order.cafe`) often query the database independently for the same entity within a single request, creating redundant queries and N+1 bottlenecks. By instantiating a short-lived request-scoped cache (Promise Map) on Apollo Server's request `context`, concurrent field resolver calls can share and deduplicate database promises without adding external dependencies like DataLoader.
**Action:** Use request-scoped context maps in GraphQL field resolvers whenever multiple fields fetch attributes from the same database table or relationship per request.
