import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminProfile from '../AdminProfile';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';

global.fetch = vi.fn();

describe('AdminProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        _id: 'admin-123',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      }),
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminProfile />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch profile data on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles/me',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });
    });

    it('should display profile information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Admin')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('admin@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('Update Profile', () => {
    it('should update profile successfully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            _id: 'admin-123',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'User',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Profile updated' }),
        });

      renderComponent();

      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('Admin');
        fireEvent.change(firstNameInput, { target: { value: 'Updated' } });

        const saveButton = screen.getByText(/save/i);
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles/me',
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
});
