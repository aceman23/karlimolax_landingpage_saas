import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  CircularProgress
} from '@mui/material';
import { login, resendVerification } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setNeedsVerification(false);

    try {
      const response = await login(email, password);
      // Store the token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/dashboard');
    } catch (error: any) {
      if (error.needsVerification) {
        setNeedsVerification(true);
      } else {
        setError(error.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification(email);
      setVerificationSent(true);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification email');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {error}
          </Alert>
        )}

        {needsVerification && (
          <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
            Please verify your email before logging in.
            {!verificationSent && (
              <Button
                color="inherit"
                onClick={handleResendVerification}
                sx={{ ml: 2 }}
              >
                Resend Verification Email
              </Button>
            )}
            {verificationSent && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Verification email sent! Please check your inbox.
              </Typography>
            )}
          </Alert>
        )}

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/signup" variant="body2">
              {"Don't have an account? Sign Up"}
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage; 