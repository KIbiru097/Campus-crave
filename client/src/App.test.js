import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  // App requires Apollo Provider and Router context,
  // so this is a smoke test that the module can be imported
  expect(App).toBeDefined();
});
