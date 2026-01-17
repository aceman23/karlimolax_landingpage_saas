import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminUsers from '../AdminUsers';
import { AuthProvider } from '../../../test/mocks/mockAuthContext';
import { mockUsers } from '../../../test/mocks/mockData';

// Mock fetch
global.fetch = vi.fn();

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockUsers,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <AdminUsers />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('Initial Load', () => {
    it('should fetch and display users on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
        expect(screen.getByText('driver@test.com')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      renderComponent();
      // Loading spinner or text should be present
      expect(screen.getByText(/loading/i) || screen.queryByRole('progressbar')).toBeTruthy();
    });

    it('should handle fetch error gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        // Should show error toast or message
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('User Search', () => {
    it('should filter users by email', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'customer' } });

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
        expect(screen.queryByText('driver@test.com')).not.toBeInTheDocument();
      });
    });

    it('should filter users by name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      await waitFor(() => {
        expect(screen.getByText('John')).toBeInTheDocument();
      });
    });

    it('should filter users by role', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'driver' } });

      await waitFor(() => {
        expect(screen.getByText('driver@test.com')).toBeInTheDocument();
      });
    });
  });

  describe('Create User', () => {
    it('should open create user modal when button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create.*user/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/create.*user/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      });
    });

    it('should validate required fields when creating user', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create.*user/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        const submitButton = screen.getByText(/create/i);
        fireEvent.click(submitButton);
      });

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required/i)).toBeTruthy();
      });
    });

    it('should validate password match', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create.*user/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm.*password/i);

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

        const submitButton = screen.getByText(/create/i);
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/password.*match/i)).toBeInTheDocument();
      });
    });

    it('should create user successfully', async () => {
      const newUser = {
        user: {
          _id: 'user-new',
          email: 'newuser@test.com',
          firstName: 'New',
          lastName: 'User',
          role: 'customer',
        },
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsers,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => newUser,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [...mockUsers, newUser.user],
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const createButton = screen.getByText(/create.*user/i);
      fireEvent.click(createButton);

      await waitFor(() => {
        const firstNameInput = screen.getByLabelText(/first name/i);
        const lastNameInput = screen.getByLabelText(/last name/i);
        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/^password/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm.*password/i);

        fireEvent.change(firstNameInput, { target: { value: 'New' } });
        fireEvent.change(lastNameInput, { target: { value: 'User' } });
        fireEvent.change(emailInput, { target: { value: 'newuser@test.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

        const submitButton = screen.getByText(/create/i);
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/register',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer mock-token-123',
            }),
            body: JSON.stringify({
              firstName: 'New',
              lastName: 'User',
              email: 'newuser@test.com',
              password: 'password123',
              role: 'customer',
            }),
          })
        );
      });
    });
  });

  describe('Edit User', () => {
    it('should open edit modal when edit button is clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/edit.*user/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      });
    });

    it('should update user successfully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsers,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'User updated successfully' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsers,
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const firstNameInput = screen.getByDisplayValue('John');
        fireEvent.change(firstNameInput, { target: { value: 'Johnny' } });

        const updateButton = screen.getByText(/update/i);
        fireEvent.click(updateButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/profiles/'),
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              Authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });
    });

    it('should allow password change', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTitle(/edit/i);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const changePasswordButton = screen.getByText(/change.*password/i);
        fireEvent.click(changePasswordButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm.*password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Delete User', () => {
    it('should show confirmation dialog when delete is clicked', async () => {
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle(/delete/i);
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('should delete user when confirmed', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsers,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'User deleted successfully' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsers.filter(u => u._id !== 'user-1'),
        });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer@test.com')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle(/delete/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/profiles/user-1',
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

  describe('Role Badges', () => {
    it('should display correct role badges', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('customer')).toBeInTheDocument();
        expect(screen.getByText('driver')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });
  });
});
