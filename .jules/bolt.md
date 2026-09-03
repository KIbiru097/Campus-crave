## 2025-05-20 - Memoizing React List Items with Non-Primitive Props

**Learning:** Passing non-primitive object references like `Set` or `Array` (`favorites={favs}`) directly into list item components invalidates `React.memo` shallow prop equality checks when state changes, causing all list items to re-render. Passing computed primitive booleans (`isFav={favs.has(item.id)}`) allows `React.memo` to skip re-renders for unchanged items.

**Action:** When memoizing list item components in React, always decompose object/Set/Map lookups into primitive prop values at the parent loop boundary so `React.memo` shallow comparison succeeds.
