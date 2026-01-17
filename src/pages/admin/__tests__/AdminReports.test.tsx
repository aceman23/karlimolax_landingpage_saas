import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminReports from '../AdminReports';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';

global.fetch = vi.fn();

describe('AdminReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        totalRevenue: 45000,
        totalBookings: 150,
        averageBookingValue: 300,
      }),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminReports />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should load reports data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should display reports section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/reports/i)).toBeInTheDocument();
      });
    });
  });
});
