## 2026-09-16 - Memoizing Animated List Items in Interactive Menus

**Learning:** Components rendered in large lists (such as `MenuItemCard` in `QRMenuPage`) that feature animations (e.g. Framer Motion, mouse tilt handlers, ripple effects) trigger costly re-renders when parent state updates—such as toggling modals/sheets, updating cart counts for unrelated items, or controlling particle animations. Wrapping list item components in `React.memo()` prevents re-evaluating motion nodes and sub-DOM trees when their specific props haven't changed.

**Action:** Always wrap interactive animated list items in `React.memo()` when parent components maintain dynamic UI state or trigger frequent state updates.
