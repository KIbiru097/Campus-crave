# Bolt's Journal - Critical Learnings

## 2026-09-19 - Request-Scoped Caching for Field Resolvers in GraphQL
**Learning:** In GraphQL schemas with separate field resolvers for related aggregates (e.g., `average_rating` and `review_count` on `Cafe` and `MenuItem`), requesting both fields causes redundant SQL aggregate queries against PostgreSQL per entity. Furthermore, `SELECT AVG(rating), COUNT(*)` in a single query fetches both metrics at once.
**Action:** Use request-scoped Map caches instantiated inside Apollo context to deduplicate aggregate database queries within a single GraphQL request cycle, cutting DB roundtrips in half for aggregate stats.
