import React, { useEffect, useRef, useState } from 'react';
import Button from '../common/Button';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    Accept?: any;
    __ACCEPT_LOADED__?: boolean;
  }
}

interface AuthorizeNetPaymentFormProps {
  amount: number;
  onSuccess: (result: { transactionId: string; cardholderName?: string }) => void;
  onError: (message: string) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export default function AuthorizeNetPaymentForm({
  amount,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}: AuthorizeNetPaymentFormProps) {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [acceptReady, setAcceptReady] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('Loading secure payment components...');
  const [showRetry, setShowRetry] = useState<boolean>(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  const [clientKey, setClientKey] = useState<string | undefined>(((import.meta as any)?.env?.VITE_AUTHORIZE_CLIENT_KEY ?? undefined) as string | undefined);
  const [apiLoginID, setApiLoginID] = useState<string | undefined>(((import.meta as any)?.env?.VITE_AUTHORIZE_API_LOGIN_ID ?? undefined) as string | undefined);

  // Check if Accept.js is available
  const checkAcceptReady = (): boolean => {
    const isReady = !!(window.Accept && typeof window.Accept.dispatchData === 'function');
    console.log('Accept.js ready check:', { 
      hasAccept: !!window.Accept, 
      hasDispatchData: !!(window.Accept && typeof window.Accept.dispatchData === 'function'),
      isReady,
      acceptType: window.Accept ? typeof window.Accept : 'undefined',
      dispatchDataType: window.Accept?.dispatchData ? typeof window.Accept.dispatchData : 'undefined'
    });
    return isReady;
  };

  // Poll until Accept.js is truly ready or timeout
  const waitForAcceptReady = async (timeoutMs = 8000): Promise<boolean> => {
    const start = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        if (checkAcceptReady()) {
          resolve(true);
          return;
        }
        if (Date.now() - start >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(check, 200);
      };
      check();
    });
  };

  // Remove any previously injected Accept.js scripts before retrying a new source
  const removeExistingAcceptScripts = () => {
    const scripts = Array.from(document.querySelectorAll('script')) as HTMLScriptElement[];
    scripts.forEach((s) => {
      const src = s.getAttribute('src') || '';
      if (
        src.includes('authorize.net') ||
        src.includes('/api/payments/accept-js') ||
        src.includes('/api/payments/library.js')
      ) {
        try { s.parentElement?.removeChild(s); } catch {}
      }
    });
    // Reset Accept reference so readiness check is accurate on next attempt
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (window.Accept && typeof window.Accept !== 'undefined') {
      // Do not hard delete as some browsers cache the object; rely on readiness check
    }
  };

  // Direct script loading without backend dependency
  const loadAcceptJsDirect = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const env = (((import.meta as any)?.env?.VITE_AUTHORIZE_ENV) || 'sandbox').toString().toLowerCase();
      const primarySrc = env === 'production' ? 'https://js.authorize.net/v1/Accept.js' : 'https://jstest.authorize.net/v1/Accept.js';

      console.log('Loading Accept.js directly from:', primarySrc);

      removeExistingAcceptScripts();
      const script = document.createElement('script');
      script.id = 'authorize-accept-js';
      script.crossOrigin = 'anonymous';
      script.src = primarySrc + `?cb=${Date.now()}`;
      script.async = true;
      script.onload = () => {
        console.log('Direct Accept.js load successful (primary)');
        setTimeout(() => resolve(checkAcceptReady()), 500);
      };
      script.onerror = () => {
        console.warn('Direct Accept.js load failed (primary)');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  const loadAcceptJsAlternate = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const env = (((import.meta as any)?.env?.VITE_AUTHORIZE_ENV) || 'sandbox').toString().toLowerCase();
      const alternateSrc = env === 'production' ? 'https://jstest.authorize.net/v1/Accept.js' : 'https://js.authorize.net/v1/Accept.js';

      console.log('Loading Accept.js from alternate domain:', alternateSrc);

      removeExistingAcceptScripts();
      const script = document.createElement('script');
      script.id = 'authorize-accept-js-alt';
      script.crossOrigin = 'anonymous';
      script.src = alternateSrc + `?cb=${Date.now()}`;
      script.async = true;
      script.onload = () => {
        console.log('Direct Accept.js load successful (alternate)');
        setTimeout(() => resolve(checkAcceptReady()), 500);
      };
      script.onerror = () => {
        console.warn('Direct Accept.js load failed (alternate)');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  const loadAcceptJsViaProxy = async (): Promise<boolean> => {
    const proxySources = [
      '/api/payments/library.js',
      '/api/payments/accept-js'
    ];

    for (const src of proxySources) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await new Promise<boolean>((resolve) => {
        console.log('Loading Accept.js via proxy:', src);
        removeExistingAcceptScripts();
    const script = document.createElement('script');
        script.id = 'authorize-accept-js-proxy';
        script.crossOrigin = 'anonymous';
        script.src = `${src}?cb=${Date.now()}`;
    script.async = true;
    script.onload = () => {
          console.log('Proxy Accept.js load successful:', src);
          setTimeout(() => resolve(checkAcceptReady()), 500);
    };
    script.onerror = () => {
          console.warn('Proxy Accept.js load failed:', src);
          resolve(false);
        };
        document.head.appendChild(script);
      });
      if (ok) return true;
    }
    return false;
  };

  // Unified robust loader sequence
  const loadAcceptJsRobust = async (): Promise<boolean> => {
    setLoadingStatus('Loading secure payment components...');
    setShowRetry(false);

    // Authorize.Net requires loading Accept.js directly from their CDN
    if (await loadAcceptJsDirect()) return true;
    if (await loadAcceptJsAlternate()) return true;

    setLoadingStatus('Failed to load payment components from Authorize.Net CDN. Please disable any ad/privacy blockers for authorize.net and retry.');
    setShowRetry(true);
    return false;
  };

  // Initialize Accept.js loading
  useEffect(() => {
    const initAccept = async () => {
      console.log('Initializing Accept.js...');
      console.log('Current window.Accept:', window.Accept);
      console.log('Current window.__ACCEPT_LOADED__:', window.__ACCEPT_LOADED__);

      // First check if it's already loaded (from index.html)
      if (checkAcceptReady()) {
        console.log('Accept.js already loaded');
        setAcceptReady(true);
        setLoadingStatus('Payment components ready');
        return;
      }

      console.log('Accept.js not found, attempting to load...');

      const loaded = await loadAcceptJsRobust();

      if (!loaded) {
        console.warn('All Accept.js loading strategies failed.');
        setAcceptReady(false);
        return;
      }

      // Wait until Accept.js reports ready
      const ready = await waitForAcceptReady(8000);
      setAcceptReady(ready);
      setLoadingStatus(ready ? 'Payment components ready' : 'Failed to initialize payment components');
      if (!ready) setShowRetry(true);
    };

    // Start loading immediately
    initAccept();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Load configuration from backend if needed
  useEffect(() => {
    const loadConfig = async () => {
      if (clientKey && apiLoginID) return;
      try {
        const res = await fetch('/api/payments/authorize/config');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.clientKey && data?.apiLoginID) {
          setClientKey(data.clientKey);
          setApiLoginID(data.apiLoginID);
        }
      } catch {
        // ignore; form will error if missing
      }
    };
    loadConfig();
  }, [clientKey, apiLoginID]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Cardholder name validation
    if (!cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    } else if (cardholderName.trim().length < 2) {
      errors.cardholderName = 'Cardholder name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(cardholderName.trim())) {
      errors.cardholderName = 'Cardholder name can only contain letters and spaces';
    }
    
    // Card number validation - much stricter
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');
    if (!cleanCardNumber) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d+$/.test(cleanCardNumber)) {
      errors.cardNumber = 'Card number can only contain digits';
    } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      errors.cardNumber = 'Card number must be between 13 and 19 digits';
    } else if (cleanCardNumber.length !== 13 && cleanCardNumber.length !== 15 && cleanCardNumber.length !== 16 && cleanCardNumber.length !== 19) {
      errors.cardNumber = 'Invalid card number length';
    } else {
      // Luhn algorithm validation for card number
      let sum = 0;
      let isEven = false;
      for (let i = cleanCardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanCardNumber.charAt(i));
        if (isEven) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }
        sum += digit;
        isEven = !isEven;
      }
      if (sum % 10 !== 0) {
        errors.cardNumber = 'Invalid card number (checksum failed)';
      }
    }
    
    // Expiry month validation
    if (!month) {
      errors.month = 'Expiry month is required';
    } else if (!/^\d{2}$/.test(month)) {
      errors.month = 'Month must be 2 digits (MM)';
    } else {
      const monthNum = parseInt(month);
      if (monthNum < 1 || monthNum > 12) {
        errors.month = 'Month must be between 01 and 12';
      }
    }
    
    // Expiry year validation
    if (!year) {
      errors.year = 'Expiry year is required';
    } else if (!/^\d{4}$/.test(year)) {
      errors.year = 'Year must be 4 digits (YYYY)';
    } else {
      const yearNum = parseInt(year);
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const monthNum = parseInt(month) || 0;
      
      if (yearNum < currentYear) {
        errors.year = 'Card has expired';
      } else if (yearNum === currentYear && monthNum < currentMonth) {
        errors.year = 'Card has expired';
      } else if (yearNum > currentYear + 20) {
        errors.year = 'Invalid expiry year';
      }
    }
    
    // CVV validation
    if (!cvv) {
      errors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cvv)) {
      errors.cvv = 'CVV must be 3 or 4 digits';
    } else {
      const cvvLength = cvv.length;
      const cardNumberLength = cleanCardNumber.length;
      
      // American Express cards (15 digits) typically have 4-digit CVV
      if (cardNumberLength === 15 && cvvLength !== 4) {
        errors.cvv = 'American Express cards require 4-digit CVV';
      }
      // Other cards typically have 3-digit CVV
      else if (cardNumberLength !== 15 && cvvLength !== 3) {
        errors.cvv = 'CVV must be 3 digits for this card type';
      }
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setCardError(Object.values(errors)[0]);
      return false;
    }
    
    setCardError(null);
    return true;
  };

  // Check if form is valid for real-time validation
  const isFormValid = (): boolean => {
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');
    return !!(
      cardholderName.trim().length >= 2 &&
      /^[a-zA-Z\s]+$/.test(cardholderName.trim()) &&
      cleanCardNumber.length >= 13 &&
      cleanCardNumber.length <= 19 &&
      /^\d+$/.test(cleanCardNumber) &&
      /^\d{2}$/.test(month) &&
      parseInt(month) >= 1 &&
      parseInt(month) <= 12 &&
      /^\d{4}$/.test(year) &&
      parseInt(year) >= new Date().getFullYear() &&
      /^\d{3,4}$/.test(cvv)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || paymentSubmitted) return;
    if (!validate()) return;

    if (!clientKey || !apiLoginID) {
      onError('Payment is not configured.');
      return;
    }

    // Final check for Accept.js
    if (!checkAcceptReady()) {
      setLoadingStatus('Loading payment library...');
      const loaded = await loadAcceptJsRobust();
      if (!loaded) {
        onError('Payment library not loaded. Please disable ad/privacy blockers and try again.');
        return;
      }
      const ready = await waitForAcceptReady(8000);
      if (!ready) {
        onError('Payment library not ready. Please retry.');
      return;
      }
    }

    // Set payment as submitted to prevent further edits
    setPaymentSubmitted(true);
    setIsProcessing(true);

    try {
      const secureData = {
        authData: {
          clientKey,
          apiLoginID,
        },
        cardData: {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          month,
          year,
          cardCode: cvv,
        },
      };

      // Tokenize the card data
      const opaqueData = await new Promise<string>((resolve, reject) => {
        window.Accept.dispatchData(secureData, (response: any) => {
          if (response?.messages?.resultCode === 'Ok' && response.opaqueData) {
            resolve(response.opaqueData);
          } else {
            const msg = response?.messages?.message?.[0]?.text || 'Unable to tokenize card';
            reject(new Error(msg));
          }
        });
      });

      // Process the payment
          const chargeRes = await fetch('/api/payments/authorize/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
          opaqueData,
              description: 'Dapper Limo Booking',
            }),
          });

          const chargeJson = await chargeRes.json();
      console.log('Payment response:', {
        status: chargeRes.status,
        statusText: chargeRes.statusText,
        data: chargeJson
      });
      
          if (!chargeRes.ok || !chargeJson?.success) {
            const err = chargeJson?.error || 'Payment failed';
            console.error('Payment failed:', {
              error: err,
              rawResponse: chargeJson
            });
            
            // Check for specific authentication errors
            if (err.includes('inactive') || err.includes('authentication failed')) {
              onError('Payment processing is temporarily unavailable. Please contact us to complete your booking.');
              setPaymentSubmitted(false);
              return;
            } else {
              onError(err);
              setPaymentSubmitted(false);
              return;
            }
          }

          // Verify we have a valid transaction ID from Authorize.Net
          if (!chargeJson.transactionId) {
            console.error('Payment succeeded but no transaction ID received:', chargeJson);
            onError('Payment processed but confirmation failed. Please contact us.');
            setPaymentSubmitted(false);
            return;
          }

          console.log('Payment successful:', {
            transactionId: chargeJson.transactionId,
            authCode: chargeJson.authCode,
            cardholderName
          });

          onSuccess({ transactionId: String(chargeJson.transactionId), cardholderName });
    } catch (err: any) {
      // Only reset paymentSubmitted for critical errors that require user action
      if (err.message?.includes('Payment library not loaded') || err.message?.includes('not configured')) {
        setPaymentSubmitted(false);
      }
      onError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    setShowRetry(false);
    setLoadingStatus('Retrying...');
    retryCountRef.current = 0;
    const loaded = await loadAcceptJsRobust();
    if (loaded) {
      setAcceptReady(true);
      setLoadingStatus('Payment components ready');
    }
  };

  return (
    <div className="relative">
      {(isProcessing || paymentSubmitted) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
            <p className="text-gray-700 font-medium">
              {paymentSubmitted ? 'Completing your booking...' : 'Processing payment...'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {paymentSubmitted ? 'Please wait while we finalize your reservation' : 'Please do not close this window'}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="cardholderName">Cardholder Name</label>
          <input
            id="cardholderName"
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              validationErrors.cardholderName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="John Doe"
            required
            disabled={isProcessing || paymentSubmitted}
          />
          {validationErrors.cardholderName && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.cardholderName}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="cardNumber">Card Number</label>
          <input
            id="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              validationErrors.cardNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="4111111111111111"
            required
            disabled={isProcessing || paymentSubmitted}
          />
          {validationErrors.cardNumber && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.cardNumber}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="month">Expiry Month (MM)</label>
            <input
              id="month"
              inputMode="numeric"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationErrors.month ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="MM"
              required
              disabled={isProcessing || paymentSubmitted}
            />
            {validationErrors.month && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.month}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="year">Expiry Year (YYYY)</label>
            <input
              id="year"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationErrors.year ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="YYYY"
              required
              disabled={isProcessing || paymentSubmitted}
            />
            {validationErrors.year && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.year}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2" htmlFor="cvv">CVV</label>
          <input
            id="cvv"
            inputMode="numeric"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
              validationErrors.cvv ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="123"
            required
            disabled={isProcessing || paymentSubmitted}
          />
          {validationErrors.cvv && (
            <p className="text-sm text-red-600 mt-1">{validationErrors.cvv}</p>
          )}
        </div>

        {cardError && <p className="text-sm text-red-600">{cardError}</p>}

        {/* Payment status message */}
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">Secure Payment Processing</h3>
              <div className="mt-2 text-sm text-purple-700">
                <p>Your payment will be processed securely through Authorize.Net. All card information is encrypted and never stored on our servers.</p>
                <p className="mt-1 text-xs text-purple-600">If payment processing is unavailable, your booking will be completed and we'll contact you to arrange payment.</p>
              </div>
            </div>
          </div>
        </div>

        {!acceptReady && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>{loadingStatus}</p>
            {showRetry && (
              <button 
                type="button" 
                className="text-purple-600 hover:underline" 
                onClick={handleRetry}
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isProcessing || !acceptReady || paymentSubmitted || !isFormValid()}
          >
            {paymentSubmitted ? 'Completing your booking...' : !acceptReady ? `Loading... (${loadingStatus})` : `Pay $${amount.toFixed(2)}`}
          </Button>
        </div>
      </form>
    </div>
  );
} 