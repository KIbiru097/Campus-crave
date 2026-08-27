## 2026-08-27 - Prevent List Item Re-renders with React.memo and useCallback
**Learning:** In lists with inline state handlers (such as quantity steppers or toast triggers), updating state for a single item re-renders every item card in the list unless the child card component is memoized with `React.memo` and passed stable callback references (`useCallback`).
**Action:** When creating grid or list item components with interactive controls, extract the item renderer into a memoized `React.memo` child component and wrap parent callback props in `useCallback`.
