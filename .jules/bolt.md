## 2026-09-02 - Optional context in GraphQL field resolvers
**Learning:** When implementing request-scoped caching in GraphQL field resolvers via Apollo context, always handle `context` being undefined or null (e.g. during standalone tests or direct resolver invocation) by defaulting `ctx = context || {}`.
**Action:** Use `const ctx = context || {};` so the query always executes and returns the correct result even when context is not provided.
