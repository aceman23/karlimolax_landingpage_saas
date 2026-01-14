import React from 'react';
import { Link } from 'react-router-dom';

interface FormTermsCheckboxProps {
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}

export default function FormTermsCheckbox({
  id,
  checked,
  onChange,
  error,
  className = ''
}: FormTermsCheckboxProps) {
  return (
    <div className={`${className}`}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className={`h-4 w-4 border-gray-300 rounded text-brand-500 focus:ring-brand-500 ${
              error ? 'border-red-500' : ''
            }`}
            aria-describedby={`${id}-description`}
            aria-invalid={error ? 'true' : 'false'}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={id} className="font-medium text-gray-700">
            I agree to the{' '}
            <Link to="/terms" className="text-brand-500 hover:text-brand-600 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-brand-500 hover:text-brand-600 underline">
              Privacy Policy
            </Link>
          </label>
          <p id={`${id}-description`} className="text-gray-500">
            By checking this box, you agree to our Terms of Service and acknowledge that you have read our Privacy Policy.
          </p>
          {error && <p className="text-red-600 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}