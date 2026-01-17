import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDrivers from '../AdminDrivers';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';
import { mockDrivers } from '../../../test/mocks/mockData';

global.fetch = vi.fn();

describe('AdminDrivers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockDrivers,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminDrivers />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch and display drivers on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/drivers');
      });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument();
      });
    });

    it('should display driver status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('online')).toBeInTheDocument();
        expect(screen.getByText('offline')).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should filter drivers by name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Add Driver', () => {
    it('should open add driver form', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add.*driver/i);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      });
    });

    it('should create driver successfully', async () => {
      const newDriver = {
        _id: 'driver-new',
        firstName: 'New',
        lastName: 'Driver',
        email: 'newdriver@test.com',
        phone: '123-456-7894',
        driverStatus: 'offline',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDrivers,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newDriver,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [...mockDrivers, newDriver],
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const addButton = screen.getByText(/add.*driver/i);
      fireEvent.click(addButton);

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/email/i);

        fireEvent.change(firstNameInput, { target: { value: 'New' } });
        fireEvent.change(lastNameInput, { target: { value: 'Driver' } });
        fireEvent.change(emailInput, { target: { value: 'newdriver@test.com' } });

        const submitButton = screen.getByText(/create|save/i);
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/drivers',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('View Driver Details', () => {
    it('should open driver details modal', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/view|details/i);
      if (viewButtons.length > 0) {
        fireEvent.click(viewButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/driver.*details/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Driver Status', () => {
    it('should display status badges correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('online')).toBeInTheDocument();
        expect(screen.getByText('offline')).toBeInTheDocument();
      });
    });
  });
});
