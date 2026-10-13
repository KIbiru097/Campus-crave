## 2025-05-18 - Avoid Reference Props on List Items with React.memo
**Learning:** Passing reference-type props (like a `Set` or `Map`) to list item components breaks `React.memo` shallow comparison, causing all list items to re-render when state changes.
**Action:** Always compute primitive boolean/value props (e.g. `isFav={favs.has(item.id)}`) at the list parent level before passing down to memoized list item components.
