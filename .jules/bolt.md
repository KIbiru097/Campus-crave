# Bolt's Journal - Critical Learnings Only

## 2026-08-13 - Request-Scoped Caching in GraphQL Field Resolvers
**Learning:** GraphQL field resolvers run independently, leading to N+1 queries when lists of entities (e.g., Orders or MenuItems) resolve related entities (e.g., Cafe, Student, Reviews). By initializing a lightweight `Map` cache in the Apollo context, we can deduplicate concurrent lookups safely within the same request scope without leaking data between users or across requests. Additionally, separate but related fields on the same parent (e.g., `Cafe.average_rating` and `Cafe.review_count`) can be computed via a single joint SQL query and stored in the request cache, reducing database load by up to 50% for those fields.
**Action:** Always check parent-child fields in GraphQL models for N+1 query patterns and consider implementing a request-scoped cache in the Apollo Server context to optimize database round-trips.
