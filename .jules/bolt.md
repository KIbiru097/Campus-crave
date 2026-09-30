## 2026-09-30 - Request-Scoped Field Resolver Caching in GraphQL
**Learning:** In Apollo Server/GraphQL applications without DataLoaders, resolving nested fields (like `average_rating` and `review_count` on `Cafe`) causes N+1 queries. Adding a request-scoped `Map` in the GraphQL context allows resolvers to share promise results for identical or combined queries without persistent memory leaks or cross-request pollution.
**Action:** Always instantiate a fresh `Map` in the context generator for request-scoped query deduplication and batching in GraphQL resolvers.
