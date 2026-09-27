# Bolt's Journal - Critical Learnings

## 2025-05-18 - GraphQL Field Resolver Query Deduplication with Request Context Cache
**Learning:** In GraphQL APIs built with Apollo Server, nested field resolvers like `Cafe.average_rating`, `Cafe.review_count`, `MenuItem.average_rating`, and `MenuItem.review_count` independently issue duplicate SQL queries (`SELECT AVG(...)`, `SELECT COUNT(...)`) against PostgreSQL for each item in a requested list. By combining rating and review count aggregations into a single SQL query and memoizing the in-flight Promise in a request-scoped `context.cache` Map, database queries for review stats are reduced by 50% without requiring external caching layers.
**Action:** Always inspect GraphQL field resolvers that compute aggregate stats on entity types and consolidate them into request-scoped memoized helpers attached to the GraphQL context.
