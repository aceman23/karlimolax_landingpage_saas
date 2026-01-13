import { Helmet } from 'react-helmet';

export default function PrivacyPolicy() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <Helmet>
        <title>Privacy Policy | Kar Limo LAX</title>
        <meta name="description" content="Privacy Policy for Kar Limo LAX. Learn how we collect, use, and protect your personal information." />
        <link rel="canonical" href="https://dapperlimolax.com/privacy" />
      </Helmet>
      
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: January 1, 2025</p>
          
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              KarLimoLax ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you visit our website dapperlimolax.com or use our transportation services.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
            <p>
              When you make reservations, create an account, or otherwise interact with our Services, we may collect:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Contact information (name, email address, phone number)</li>
              <li>Billing information (credit card details, billing address)</li>
              <li>Travel details (pickup/drop-off locations, dates, times)</li>
              <li>Special requests related to your transportation needs</li>
            </ul>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Usage Information</h3>
            <p>
              We automatically collect certain information about your device and how you interact with our Services, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Operating system</li>
              <li>Pages visited and features used</li>
              <li>Time and date of your visit</li>
              <li>Referring/exit pages</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We may use your information for various purposes, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Providing and improving our transportation services</li>
              <li>Processing reservations and payments</li>
              <li>Communicating with you about your reservations</li>
              <li>Sending you promotional offers and updates (with your consent)</li>
              <li>Analyzing usage patterns to improve our website and services</li>
              <li>Ensuring the security of our services</li>
              <li>Complying with legal obligations</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">4. Disclosure of Your Information</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Service providers who help us operate our business</li>
              <li>Payment processors to complete transactions</li>
              <li>Legal and regulatory authorities when required by law</li>
              <li>Business partners with your consent</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cookies and Similar Technologies</h2>
            <p>
              We use cookies and similar tracking technologies to collect and track information about your browsing activities. You can control cookies through your browser settings and other tools.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">7. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccuracies in your personal information</li>
              <li>Delete your personal information</li>
              <li>Object to or restrict the processing of your personal information</li>
              <li>Data portability</li>
              <li>Withdraw consent</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided in the "Contact Us" section.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version will be indicated by an updated "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-2 mb-8">
              <p className="mb-1">KarLimoLax</p>
              <p className="mb-1">1550 N Batavia</p>
              <p className="mb-1">Orange, CA 92867</p>
              <p className="mb-1">Email: privacy@dapperlimolax.com</p>
              <p>Phone: (310) 555-7890</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}