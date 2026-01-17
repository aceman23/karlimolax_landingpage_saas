import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminVehicles from '../AdminVehicles';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';
import { mockVehicles } from '../../../test/mocks/mockData';

global.fetch = vi.fn();

describe('AdminVehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockVehicles,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminVehicles />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch and display vehicles on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/vehicles',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
        expect(screen.getByText('Mercedes Sprinter 2')).toBeInTheDocument();
      });
    });

    it('should display vehicle details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('maintenance')).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should filter vehicles by name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Sprinter 1' } });

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
        expect(screen.queryByText('Mercedes Sprinter 2')).not.toBeInTheDocument();
      });
    });

    it('should filter vehicles by license plate', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'ABC' } });

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument();
      });
    });
  });

  describe('Add Vehicle', () => {
    it('should open add vehicle modal', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add.*vehicle/i);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/make/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add.*vehicle/i);
      fireEvent.click(addButton);

      await waitFor(() => {
        const submitButton = screen.getByText(/save|create/i);
        fireEvent.click(submitButton);
      });

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeTruthy();
      });
    });

    it('should create vehicle successfully', async () => {
      const newVehicle = {
        _id: 'vehicle-new',
        name: 'New Vehicle',
        make: 'Mercedes',
        model: 'Sprinter',
        year: '2024',
        licensePlate: 'NEW123',
        vin: 'VINNEW123',
        status: 'active',
        type: 'limousine',
        color: 'Black',
        mileage: '0',
        lastMaintenance: '',
        nextMaintenance: '',
        fuelType: 'diesel',
        transmission: 'automatic',
        seatingCapacity: '14',
        features: [],
        notes: '',
        capacity: 14,
        pricePerHour: 130,
        description: 'New vehicle',
        imageUrl: '',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVehicles,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newVehicle,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [...mockVehicles, newVehicle],
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add.*vehicle/i);
      fireEvent.click(addButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        fireEvent.change(nameInput, { target: { value: 'New Vehicle' } });

        const submitButton = screen.getByText(/save|create/i);
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/vehicles',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });
    });
  });

  describe('Edit Vehicle', () => {
    it('should open edit modal with vehicle data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Mercedes Sprinter 1')).toBeInTheDocument();
      });
    });

    it('should update vehicle successfully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVehicles,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Vehicle updated' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVehicles,
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Mercedes Sprinter 1');
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

        const updateButton = screen.getByText(/update|save/i);
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/vehicles/vehicle-1',
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });
    });
  });

  describe('Delete Vehicle', () => {
    it('should delete vehicle when confirmed', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVehicles,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Vehicle deleted' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockVehicles.filter(v => v._id !== 'vehicle-1'),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Mercedes Sprinter 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle(/delete/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/vehicles/vehicle-1',
          expect.objectContaining({
            method: 'DELETE',
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Vehicle Status', () => {
    it('should display status badges correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('active')).toBeInTheDocument();
        expect(screen.getByText('maintenance')).toBeInTheDocument();
      });
    });
  });
});
