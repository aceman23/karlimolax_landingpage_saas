import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminPricing from '../AdminPricing';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';

global.fetch = vi.fn();

describe('AdminPricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        distanceTiers: [
          { min: 0, max: 25, fee: 50 },
          { min: 25, max: 50, fee: 100 },
        ],
        perMileFee: 2.5,
        distanceThreshold: 50,
        minFee: 50,
        maxFee: 500,
      }),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminPricing />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch pricing settings on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/admin/settings/pricing');
      });
    });

    it('should display pricing settings', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/distance.*tiers/i)).toBeInTheDocument();
        expect(screen.getByText(/per.*mile/i)).toBeInTheDocument();
      });
    });
  });

  describe('Update Pricing', () => {
    it('should update per-mile fee', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Settings updated' }),
      });

      renderComponent();

      await waitFor(() => {
        const perMileInput = screen.getByLabelText(/per.*mile.*fee/i);
        fireEvent.change(perMileInput, { target: { value: '3.0' } });

        const saveButton = screen.getByText(/save/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/settings/pricing',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('perMileFee'),
          })
        );
      });
    });

    it('should update distance threshold', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Settings updated' }),
      });

      renderComponent();

      await waitFor(() => {
        const thresholdInput = screen.getByLabelText(/distance.*threshold/i);
        fireEvent.change(thresholdInput, { target: { value: '60' } });

        const saveButton = screen.getByText(/save/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/settings/pricing',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });
  });
});
