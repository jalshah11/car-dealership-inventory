// Runs once before the test framework is installed. Extends Vitest's
// `expect` with jest-dom's DOM-specific matchers (toBeInTheDocument,
// toHaveTextContent, toBeDisabled, etc.) -- without this import, those
// matchers simply wouldn't exist and every test using them would fail with
// a "not a function" error.
import '@testing-library/jest-dom';
