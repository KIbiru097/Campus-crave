## 2026-09-29 - GraphQL Field Resolvers Request-Scoped Caching
**Learning:** In GraphQL APIs built with Apollo Server and raw PostgreSQL queries, nested field resolvers (such as ratings, review counts, or foreign key lookups on list queries) cause N+1 database queries. Passing a request-scoped `queryCache` Map in Apollo context allows transparent promise-level deduplication without heavy external dependencies.
**Action:** Always check GraphQL context for request-scoped cache stores when optimizing GraphQL field resolvers.
