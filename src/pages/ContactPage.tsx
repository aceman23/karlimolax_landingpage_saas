import React from 'react';
import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { MapPin, Phone, Mail, Clock, Instagram } from 'lucide-react';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast.success('Message sent successfully!');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        throw new Error(result.error || 'Failed to send message.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Helmet>
        <title>Contact Us | Dapper Limo LAX</title>
        <meta name="description" content="Contact Dapper Limo LAX for premium transportation services in Los Angeles. We're here to help with your booking inquiries and special requests." />
        <link rel="canonical" href="https://dapperlimolax.com/contact" />
      </Helmet>

      {/* Page Header */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Get in touch with us for any questions about our services or to make a reservation.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="(123) 456-7890"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="How can we help you?"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Address</h3>
                    <p className="text-gray-600">
                      1550 N Batavia<br />
                      Orange, CA 92867
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-gray-600">(213) 590-6085</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-600">dapperlimolax@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Clock className="h-6 w-6 text-cyan-500 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Sunday: 24/7 Service<br />
                      Office Hours: 8:00 AM - 8:00 PM PST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6">Follow Us</h2>
              <div className="flex space-x-4">
                <a
                  href="https://instagram.com/dapperlimo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-cyan-500 transition"
                >
                  <Instagram className="h-8 w-8" />
                </a>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold mb-6">Our Location</h2>
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3318.1234567890123!2d-117.853683!3d33.787235!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80dcd9c8c8c8c8c8%3A0x0!2zMTU1MCBOIEJhdGF2aWEsIE9yYW5nZSwgQ0EgOTI4Njc!5e0!3m2!1sen!2sus!4v1234567890"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Dapper Limo LAX Location"
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 