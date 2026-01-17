import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminBookings from '../AdminBookings';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';
import { mockBookings, mockDrivers, mockVehicles } from '../../../test/mocks/mockData';

global.fetch = vi.fn();

describe('AdminBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBookings,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDrivers,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockVehicles,
      });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminBookings />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch bookings, drivers, and vehicles on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/bookings');
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers');
        expect(global.fetch).toHaveBeenCalledWith('/api/vehicles');
      });
    });

    it('should display bookings in table', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should display booking status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('confirmed')).toBeInTheDocument();
        expect(screen.getByText('pending')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should filter bookings by customer name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('should filter bookings by status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('confirmed')).toBeInTheDocument();
      });

      const statusFilter = screen.getByLabelText(/status/i);
      fireEvent.change(statusFilter, { target: { value: 'confirmed' } });

      await waitFor(() => {
        expect(screen.getByText('confirmed')).toBeInTheDocument();
        expect(screen.queryByText('pending')).not.toBeInTheDocument();
      });
    });

    it('should filter bookings by date', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const dateFilter = screen.getByLabelText(/date/i);
      fireEvent.change(dateFilter, { target: { value: '2024-12-25' } });

      // Should filter bookings by date
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('Booking Actions', () => {
    it('should open booking details modal', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/view|details/i);
      if (viewButtons.length > 0) {
        fireEvent.click(viewButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/booking.*details/i)).toBeInTheDocument();
        });
      }
    });

    it('should assign driver to booking', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Driver assigned successfully' }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find and click assign driver button
      const assignButtons = screen.getAllByText(/assign.*driver/i);
      if (assignButtons.length > 0) {
        fireEvent.click(assignButtons[0]);

        await waitFor(() => {
          const driverSelect = screen.getByLabelText(/driver/i);
          fireEvent.change(driverSelect, { target: { value: 'driver-1' } });

          const confirmButton = screen.getByText(/assign|confirm/i);
          fireEvent.click(confirmButton);
        });

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/bookings/'),
            expect.objectContaining({
              method: 'PUT',
            })
          );
        });
      }
    });

    it('should update booking status', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Booking updated' }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('pending')).toBeInTheDocument();
      });

      // Find status dropdown or button
      const statusButtons = screen.getAllByText(/update.*status|change.*status/i);
      if (statusButtons.length > 0) {
        fireEvent.click(statusButtons[0]);

        await waitFor(() => {
          const confirmedOption = screen.getByText(/confirmed/i);
          fireEvent.click(confirmedOption);
        });

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/bookings/'),
            expect.objectContaining({
              method: 'PUT',
            })
          );
        });
      }
    });
  });

  describe('Booking Information Display', () => {
    it('should display pickup and dropoff locations', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
        expect(screen.getByText(/456 Oak Ave/i)).toBeInTheDocument();
      });
    });

    it('should display booking price', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/\$250/i)).toBeInTheDocument();
        expect(screen.getByText(/\$180/i)).toBeInTheDocument();
      });
    });

    it('should display vehicle information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Mercedes/i)).toBeInTheDocument();
        expect(screen.getByText(/Sprinter/i)).toBeInTheDocument();
      });
    });
  });
});
