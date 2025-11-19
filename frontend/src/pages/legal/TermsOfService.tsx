import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: November 18, 2025</p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing or using Soham Call Center platform ("Service"), you agree to be bound by these Terms of 
                Service. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Description</h2>
              <p className="text-gray-700 mb-4">
                Soham Call Center provides cloud-based communication solutions including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Inbound and outbound call management</li>
                <li>Multi-channel customer support (voice, chat, email)</li>
                <li>AI-powered automation and routing</li>
                <li>Analytics and reporting tools</li>
                <li>Integration APIs and webhooks</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Registration</h2>
              <p className="text-gray-700 mb-4">To use our Service, you must:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be at least 18 years old or have legal capacity</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Notify us immediately of unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">You agree NOT to use the Service to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Send spam, unsolicited communications, or illegal content</li>
                <li>Harass, abuse, or harm others</li>
                <li>Violate any laws or regulations</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Attempt unauthorized access to systems</li>
                <li>Infringe intellectual property rights</li>
                <li>Transmit malware or malicious code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment and Billing</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Subscription fees are billed monthly or annually</li>
                <li>Usage-based charges apply for calls and additional features</li>
                <li>Prices are subject to change with 30 days notice</li>
                <li>Late payments may result in service suspension</li>
                <li>Refunds are provided according to our refund policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Level Agreement</h2>
              <p className="text-gray-700 mb-4">We strive to provide:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>99.9% uptime for core services</li>
                <li>24/7 technical support</li>
                <li>Regular maintenance windows (announced in advance)</li>
                <li>Data backup and disaster recovery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Service, including all content, features, and functionality, is owned by Soham Technologies and 
                protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-700 mb-4">You retain ownership of your data and content.</p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data and Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your use of the Service is also governed by our Privacy Policy. We collect, use, and protect your 
                data as described in that policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, Soham Call Center shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to suspend or terminate your account for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Violation of these Terms</li>
                <li>Non-payment of fees</li>
                <li>Fraudulent or illegal activity</li>
                <li>Extended inactivity</li>
              </ul>
              <p className="text-gray-700 mb-4">
                You may cancel your account at any time from the Settings page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may modify these Terms at any time. Continued use of the Service after changes constitutes 
                acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by and construed in accordance with applicable laws, without regard to 
                conflict of law principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms, contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@soham.top</p>
                <p className="text-gray-700"><strong>Support:</strong> support@soham.top</p>
                <p className="text-gray-700"><strong>Website:</strong> app.soham.top</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
