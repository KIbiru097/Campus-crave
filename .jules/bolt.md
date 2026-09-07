# Bolt's Performance Journal - Critical Learnings

## 2026-09-07 - React.memo Optimization on Menu Item Grid
**Learning:** In list rendering components like `QRMenuPage` where items render cards (`MenuItemCard`), passing un-memoized object references (such as `favorites` Set) forces all item cards to re-render whenever any item's favorite status changes. Passing primitive boolean `isFav` directly and memoizing `MenuItemCard` with `React.memo` eliminates redundant re-renders for unchanged cards.
**Action:** Always prefer passing scalar/primitive props or memoized selectors to memoized list item components in React.
