## 2026-10-21 - [Preventing React.memo invalidation when passing Set references]
**Learning:** Passing a Set object state (like `favs`) down to list item components invalidates shallow prop equality checks in `React.memo` whenever the Set is mutated/recreated. Passing primitive booleans (e.g. `isFav={favs.has(item.id)}`) allows `React.memo` to skip re-rendering items whose status did not change.
**Action:** When memoizing list item components that depend on parent state sets or objects, derive and pass primitive boolean/scalar props instead of passing the container reference.
