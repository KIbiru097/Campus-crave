## 2026-09-15 - Request-Scoped Caching for GraphQL Field Resolvers

**Learning:** In this Apollo Server GraphQL setup, separate field resolvers for `average_rating` and `review_count` on `Cafe` and `MenuItem` execute independent SQL queries against the `reviews` table. Request-scoped caching using a `Map` stored on the GraphQL `context` object eliminates redundant DB queries and prevents duplicate execution during concurrent field resolution.

**Action:** Pass `context` to field resolvers and store short-lived Promises in a request-scoped `Map` whenever multiple fields resolve data from the same source table.
