# Admin Panel Test Suite

This directory contains comprehensive unit tests for all admin panel features.

## Test Setup

The test suite uses:
- **Vitest** - Fast unit test framework
- **React Testing Library** - React component testing utilities
- **jsdom** - DOM environment for testing

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized by feature in `src/pages/admin/__tests__/`:

- `AdminUsers.test.tsx` - User management (CRUD operations)
- `AdminBookings.test.tsx` - Booking management and filtering
- `AdminVehicles.test.tsx` - Vehicle management
- `AdminServicePackages.test.tsx` - Service package management
- `AdminDashboard.test.tsx` - Dashboard stats and charts
- `AdminSettings.test.tsx` - System settings
- `AdminPricing.test.tsx` - Pricing configuration
- `AdminDrivers.test.tsx` - Driver management
- `AdminReports.test.tsx` - Reports and analytics
- `AdminProfile.test.tsx` - Admin profile management

## Test Coverage

Each test file covers:

1. **Initial Load** - Component mounting and data fetching
2. **CRUD Operations** - Create, Read, Update, Delete functionality
3. **Search and Filtering** - User input and filtering logic
4. **Form Validation** - Required fields and input validation
5. **Error Handling** - Network errors and edge cases
6. **User Interactions** - Button clicks, form submissions, modal interactions

## Mock Data

Mock data is centralized in `src/test/mocks/mockData.ts`:
- `mockUsers` - Sample user data
- `mockBookings` - Sample booking data
- `mockVehicles` - Sample vehicle data
- `mockServicePackages` - Sample service package data
- `mockDrivers` - Sample driver data
- `mockDashboardStats` - Dashboard statistics
- `mockMonthlyBookings` - Monthly booking data

## Mock Context

Authentication context is mocked in `src/test/mocks/mockAuthContext.tsx` to provide:
- Admin user with authentication token
- Mocked auth functions (signIn, signUp, logout)
- Role-based access control helpers

## Writing New Tests

When adding new admin features:

1. Create test file in `src/pages/admin/__tests__/`
2. Import necessary testing utilities
3. Mock API calls using `global.fetch`
4. Test all user interactions and edge cases
5. Verify API calls are made with correct parameters
6. Test error handling and loading states

Example:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import YourComponent from '../YourComponent';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';

global.fetch = vi.fn();

describe('YourComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ /* mock data */ }),
    });
  });

  it('should render correctly', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <YourComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

## Best Practices

1. **Isolate Tests** - Each test should be independent
2. **Mock External Dependencies** - Mock API calls, timers, etc.
3. **Test User Behavior** - Focus on what users see and do
4. **Clean Up** - Use `afterEach` to clean up mocks
5. **Descriptive Names** - Use clear test descriptions
6. **Cover Edge Cases** - Test error states and boundary conditions
