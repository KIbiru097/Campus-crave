# Bolt's Performance Journal

## 2026-08-25 - Prevent Unnecessary Re-renders in Menu Item Cards with React.memo and Boolean Prop Passing
**Learning:** In list items like `MenuItemCard`, passing reference objects/sets (like `favorites` Set) causes all list items to re-render whenever the Set changes reference, even if their individual favorite state didn't change. Furthermore, parent state changes (such as updating cart quantities or search queries) re-render all card components if they aren't memoized with `React.memo`.
**Action:** Wrap item list components with `React.memo` and pass primitive state flags (e.g. `isFav` boolean instead of `favorites` Set) to isolate re-renders to only affected items.
