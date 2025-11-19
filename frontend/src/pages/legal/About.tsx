import { ArrowLeft, Phone, Users, Globe, Shield, Zap, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function About() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">About Soham Call Center</h1>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-700 mb-4">
                Soham Call Center is a cutting-edge cloud communication platform designed to revolutionize customer 
                engagement. We empower businesses of all sizes to deliver exceptional customer experiences through 
                intelligent automation, seamless integration, and powerful analytics.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We Offer</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Phone className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Multi-Channel Support</h3>
                    <p className="text-gray-700 text-sm">
                      Handle calls, chats, emails, and social media from a unified platform.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Automation</h3>
                    <p className="text-gray-700 text-sm">
                      Intelligent routing, chatbots, and voice assistants to enhance efficiency.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <BarChart className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
                    <p className="text-gray-700 text-sm">
                      Comprehensive dashboards and reports to track performance and trends.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                    <p className="text-gray-700 text-sm">
                      Bank-level encryption, compliance certifications, and data protection.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Globe className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Global Reach</h3>
                    <p className="text-gray-700 text-sm">
                      Local numbers in 100+ countries with low-latency infrastructure.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                    <p className="text-gray-700 text-sm">
                      Built-in tools for training, monitoring, and team coordination.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Technology</h2>
              <p className="text-gray-700 mb-4">
                Built on modern cloud infrastructure, our platform leverages:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Asterisk-based telephony engine for reliable call handling</li>
                <li>WebRTC for browser-based calling with HD audio quality</li>
                <li>AI and machine learning for intelligent automation</li>
                <li>RESTful APIs for seamless CRM and business tool integration</li>
                <li>Microservices architecture for scalability and resilience</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Who We Serve</h2>
              <p className="text-gray-700 mb-4">
                Our platform is trusted by businesses across industries:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">E-commerce</h3>
                  <p className="text-gray-700 text-sm">Order support, returns, and customer inquiries</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Healthcare</h3>
                  <p className="text-gray-700 text-sm">Appointment scheduling and patient communication</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Financial Services</h3>
                  <p className="text-gray-700 text-sm">Secure transactions and account management</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">SaaS Companies</h3>
                  <p className="text-gray-700 text-sm">Technical support and onboarding</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Education</h3>
                  <p className="text-gray-700 text-sm">Student services and enrollment</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Retail</h3>
                  <p className="text-gray-700 text-sm">Sales inquiries and customer care</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Commitment</h2>
              <p className="text-gray-700 mb-4">
                We are committed to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li><strong>Reliability:</strong> 99.9% uptime SLA with redundant infrastructure</li>
                <li><strong>Security:</strong> SOC 2 Type II compliance and GDPR readiness</li>
                <li><strong>Innovation:</strong> Regular feature updates and technology upgrades</li>
                <li><strong>Support:</strong> 24/7 customer success team to ensure your success</li>
                <li><strong>Transparency:</strong> Clear pricing with no hidden fees</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Company Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 mb-2"><strong>Company:</strong> Soham Technologies</p>
                    <p className="text-gray-700 mb-2"><strong>Product:</strong> Soham Call Center Platform</p>
                    <p className="text-gray-700 mb-2"><strong>Established:</strong> 2024</p>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-2"><strong>Email:</strong> info@soham.top</p>
                    <p className="text-gray-700 mb-2"><strong>Support:</strong> support@soham.top</p>
                    <p className="text-gray-700 mb-2"><strong>Website:</strong> app.soham.top</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get Started</h2>
              <p className="text-gray-700 mb-4">
                Ready to transform your customer communications? Contact our sales team for a personalized demo 
                or start your free trial today.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Free Trial
                </button>
                <button 
                  onClick={() => navigate('/contact')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Contact Sales
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
