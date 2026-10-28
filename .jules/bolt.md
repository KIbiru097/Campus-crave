## 2026-10-28 - Request-Scoped Promise Caching in GraphQL Resolvers
**Learning:** Instantiating a `new Map()` per request context in Apollo Server allows GraphQL field resolvers to deduplicate identical database queries across nested selection sets without risking stale data across requests. Caching promises rather than resolved values handles concurrent asynchronous resolver invocations cleanly.
**Action:** Always instantiate a request-scoped cache Map in Apollo Server context and key pending query promises to eliminate N+1 queries in field resolvers.
