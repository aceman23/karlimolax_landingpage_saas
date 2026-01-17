import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminServicePackages from '../AdminServicePackages';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';
import { mockServicePackages } from '../../../test/mocks/mockData';

global.fetch = vi.fn();

describe('AdminServicePackages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockServicePackages,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminServicePackages />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch and display service packages', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/service-packages');
      });

      await waitFor(() => {
        expect(screen.getByText('Airport Transfer')).toBeInTheDocument();
        expect(screen.getByText('Special Events')).toBeInTheDocument();
      });
    });

    it('should display package details', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/\$150/i)).toBeInTheDocument();
        expect(screen.getByText(/\$520/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Service Package', () => {
    it('should open edit modal with package data', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Airport Transfer')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit.*package/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Airport Transfer')).toBeInTheDocument();
      });
    });

    it('should update package successfully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServicePackages,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Package updated' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServicePackages,
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Airport Transfer')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Airport Transfer');
        fireEvent.change(nameInput, { target: { value: 'Updated Package' } });

        const updateButton = screen.getByText(/update|save/i);
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/service-packages/package-1',
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should validate required fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Airport Transfer')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Airport Transfer');
        fireEvent.change(nameInput, { target: { value: '' } });

        const updateButton = screen.getByText(/update|save/i);
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeTruthy();
      });
    });
  });

  describe('Package Status Toggle', () => {
    it('should toggle package active status', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServicePackages,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Package updated' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockServicePackages,
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Airport Transfer')).toBeInTheDocument();
      });

      // Find and click toggle button
      const toggleButtons = screen.getAllByRole('switch') || screen.getAllByLabelText(/active/i);
      if (toggleButtons.length > 0) {
        fireEvent.click(toggleButtons[0]);

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/service-packages/'),
            expect.objectContaining({
              method: 'PUT',
            })
          );
        });
      }
    });
  });
});
