# Bolt's Journal - Critical Learnings

## 2025-05-18 - Deduplicating GraphQL Field Resolvers via Request Context
**Learning:** In GraphQL APIs with separate field resolvers for derived data (e.g. `average_rating` and `review_count`), concurrent field resolution for the same parent entity leads to duplicate DB queries. Instantiating request-scoped Map caches in Apollo context allows promise sharing across resolvers without adding external dependencies.
**Action:** Use context-scoped Map caches or promise deduplication in field resolvers when multiple fields compute derived data from the same DB table.
