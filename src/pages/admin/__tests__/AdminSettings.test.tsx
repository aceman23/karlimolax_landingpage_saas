import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminSettings from '../AdminSettings';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';

global.fetch = vi.fn();

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        emailEnabled: true,
        emailNotifications: {
          sendToAdmin: true,
          adminEmails: ['admin@test.com'],
        },
      }),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminSettings />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should load settings on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should display email settings tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/email.*settings/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Settings', () => {
    it('should toggle email notifications', async () => {
      renderComponent();

      await waitFor(() => {
        const toggle = screen.getByLabelText(/enable.*email/i);
        if (toggle) {
          fireEvent.click(toggle);
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/settings'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });

    it('should update admin emails', async () => {
      renderComponent();

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/admin.*email/i);
        if (emailInput) {
          fireEvent.change(emailInput, { target: { value: 'newadmin@test.com' } });
          
          const saveButton = screen.getByText(/save/i);
          fireEvent.click(saveButton);
        }
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/settings'),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });
    });
  });
});
