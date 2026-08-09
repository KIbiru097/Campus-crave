# Bolt's Performance Journal

## 2026-08-09 - Avoid unnecessary child re-renders via prop design and React.memo
**Learning:** Passing object references (such as Set or Array) into child components causes all child components to re-render whenever the object changes reference in the parent (e.g. adding/removing an item from the set). By decomposing the complex object into simple primitive values (like boolean `isFav` status) inside the parent mapping, we can leverage `React.memo` for highly effective child re-render skipping.
**Action:** Always map complex state objects or sets to primitive values inside parent components before passing them to memoized children.
