import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';
import { mockDashboardStats, mockMonthlyBookings, mockBookings } from '../../../test/mocks/mockData';

global.fetch = vi.fn();

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardStats,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBookings.slice(0, 5),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMonthlyBookings,
      });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminDashboard />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch dashboard data on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/dashboard/stats');
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/recent-bookings?limit=5');
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/dashboard/monthly-bookings');
      });
    });

    it('should display dashboard stats', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // totalBookings
        expect(screen.getByText('75')).toBeInTheDocument(); // totalCustomers
        expect(screen.getByText('10')).toBeInTheDocument(); // totalDrivers
        expect(screen.getByText('5')).toBeInTheDocument(); // totalVehicles
      });
    });

    it('should display total revenue', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/\$45,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Recent Bookings', () => {
    it('should display recent bookings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display booking status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('confirmed')).toBeInTheDocument();
      });
    });
  });

  describe('Charts', () => {
    it('should render monthly bookings chart', async () => {
      renderComponent();

      await waitFor(() => {
        // Chart should be rendered (Recharts components)
        const chartContainer = screen.getByRole('img') || screen.queryByTestId('chart');
        expect(chartContainer || screen.getByText(/bookings/i)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      renderComponent();
      // Should show loading spinner or text
      expect(screen.getByText(/loading/i) || screen.queryByRole('progressbar')).toBeTruthy();
    });
  });
});
