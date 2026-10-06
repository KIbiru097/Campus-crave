## 2026-10-06 - Request-Scoped GraphQL Field Resolver Caching
**Learning:** In GraphQL APIs, requesting multiple calculated field resolvers on the same entity (e.g. `average_rating` and `review_count`) results in redundant database queries. Storing resolution promises in a request-scoped context cache Map allows field resolvers to share a single combined database query cleanly without state leakage across requests.
**Action:** Use request-scoped context maps in Apollo Server resolvers to deduplicate database operations for co-located fields on entities.
