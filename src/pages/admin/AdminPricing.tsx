import React from 'react';
import { Helmet } from 'react-helmet-async';
import PricingSettings from '../../components/admin/PricingSettings';

export default function AdminPricing() {
  return (
    <>
      <Helmet>
        <title>Pricing Settings | Admin Dashboard</title>
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Pricing Settings</h1>
        <PricingSettings />
      </div>
    </>
  );
} 