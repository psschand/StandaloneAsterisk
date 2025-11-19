import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: November 18, 2025</p>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-700 mb-4">
                Soham Call Center ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our call center 
                platform and related services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Name, email address, and phone number</li>
                <li>Company/organization details</li>
                <li>Account credentials (encrypted)</li>
                <li>Payment and billing information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">Call Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Call recordings (with consent)</li>
                <li>Call duration, timestamps, and metadata</li>
                <li>Chat transcripts and messages</li>
                <li>Customer interaction history</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-2">Technical Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and analytics</li>
                <li>Cookie data and session information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Provide and maintain our call center services</li>
                <li>Process transactions and manage billing</li>
                <li>Improve service quality and user experience</li>
                <li>Send service updates and notifications</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Storage and Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>End-to-end encryption for sensitive data</li>
                <li>Secure SSL/TLS connections</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Data backup and disaster recovery</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Your data is stored on secure servers and retained only as long as necessary for business purposes 
                or legal requirements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We do not sell your personal information. We may share data with:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Service providers (hosting, payment processing)</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your consent</li>
                <li>During business transfers (mergers, acquisitions)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience. You can control cookie preferences 
                through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect 
                data from children.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your data may be transferred and processed in countries outside your residence. We ensure appropriate 
                safeguards are in place for international transfers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email 
                or platform notifications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For privacy-related questions or requests, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> privacy@soham.top</p>
                <p className="text-gray-700"><strong>Address:</strong> Soham Technologies</p>
                <p className="text-gray-700"><strong>Response Time:</strong> Within 48 hours</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
