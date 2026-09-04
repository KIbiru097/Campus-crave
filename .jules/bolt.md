# Bolt's Journal - Critical Learnings

## 2026-09-04 - Batching GraphQL Field Resolvers
**Learning:** In GraphQL APIs, field resolvers like `average_rating` and `review_count` executed per list item can create severe N+1 query overhead. Creating lightweight, request-scoped batch loaders without external libraries batches all IDs requested across concurrent field resolves into a single SQL query using `ANY($1::int[])`.
**Action:** Use request-scoped batch loaders attached to GraphQL `context` for list field resolvers to eliminate N+1 queries cleanly.
