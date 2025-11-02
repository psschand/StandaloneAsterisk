import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Smartphone, 
  Copy, 
  Check, 
  Download,
  RefreshCw,
  ExternalLink,
  Globe,
  Lock,
  User,
  Hash
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import apiClient from '../../lib/api';
import config from '../../config';

interface SIPCredentials {
  username: string;
  password: string;
  domain: string;
  proxy: string;
  port: number;
  transport: 'UDP' | 'TCP' | 'TLS';
  extension: string;
}

export default function SoftphoneSetup() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: credentials, isLoading } = useQuery<SIPCredentials>({
    queryKey: ['softphone', 'credentials'],
    queryFn: async () => {
      const response = await apiClient.get(config.api.softphone.credentials);
      return response.data.data;
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const generateSIPURI = () => {
    if (!credentials) return '';
    return `sip:${credentials.username}@${credentials.domain}`;
  };

  const generateConfigFile = () => {
    if (!credentials) return;

    const config = `
# SIP Account Configuration
# Use this with softphone apps like Linphone, Zoiper, etc.

Username: ${credentials.username}
Password: ${credentials.password}
Domain: ${credentials.domain}
Proxy: ${credentials.proxy}
Port: ${credentials.port}
Transport: ${credentials.transport}
Extension: ${credentials.extension}

# SIP URI
${generateSIPURI()}

# For Linphone/Zoiper configuration:
# 1. Add new SIP account
# 2. Enter username and password
# 3. Set domain/proxy as shown above
# 4. Choose transport protocol (UDP recommended for local)
# 5. Test connection
    `.trim();

    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sip-config-${credentials.username}.txt`;
    a.click();
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
      title="Copy to clipboard"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="text-center py-12">
        <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No SIP credentials available</p>
        <p className="text-sm text-gray-400 mt-2">Contact your administrator to set up your extension</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Softphone Setup</h1>
        <p className="text-sm text-gray-600 mt-1">
          Use these credentials to configure your softphone app on mobile or desktop
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Quick Setup (Mobile)
          </h2>
          
          <div className="bg-white p-6 border-2 border-gray-200 rounded-lg text-center">
            <QRCodeSVG
              value={generateSIPURI()}
              size={200}
              level="H"
              includeMargin
              className="mx-auto"
            />
            <p className="text-sm text-gray-600 mt-4">
              Scan with your softphone app
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-900">Recommended Apps:</h3>
            <div className="space-y-2">
              <a
                href="https://play.google.com/store/apps/details?id=org.linphone"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Linphone</div>
                    <div className="text-xs text-gray-500">Android / iOS</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>

              <a
                href="https://www.zoiper.com/en/voip-softphone/download/current"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Zoiper</div>
                    <div className="text-xs text-gray-500">Android / iOS / Desktop</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>

              <a
                href="https://www.groundwire.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Groundwire</div>
                    <div className="text-xs text-gray-500">iOS Premium</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Manual Configuration Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Manual Configuration
            </h2>
            <button
              onClick={generateConfigFile}
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Config</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Username */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Username / Extension
                </label>
                <CopyButton text={credentials.username} field="username" />
              </div>
              <code className="text-sm font-mono text-gray-900 break-all">
                {credentials.username}
              </code>
            </div>

            {/* Password */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </label>
                <CopyButton text={credentials.password} field="password" />
              </div>
              <code className="text-sm font-mono text-gray-900 break-all">
                {credentials.password}
              </code>
            </div>

            {/* Domain */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Domain / Server
                </label>
                <CopyButton text={credentials.domain} field="domain" />
              </div>
              <code className="text-sm font-mono text-gray-900 break-all">
                {credentials.domain}
              </code>
            </div>

            {/* Proxy */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Proxy / Outbound Proxy
                </label>
                <CopyButton text={credentials.proxy} field="proxy" />
              </div>
              <code className="text-sm font-mono text-gray-900 break-all">
                {credentials.proxy}
              </code>
            </div>

            {/* Port & Transport */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Hash className="w-4 h-4 mr-2" />
                    Port
                  </label>
                  <CopyButton text={credentials.port.toString()} field="port" />
                </div>
                <code className="text-sm font-mono text-gray-900">
                  {credentials.port}
                </code>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Transport
                </label>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {credentials.transport}
                </span>
              </div>
            </div>

            {/* SIP URI */}
            <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-primary-900">
                  Complete SIP URI
                </label>
                <CopyButton text={generateSIPURI()} field="sip-uri" />
              </div>
              <code className="text-sm font-mono text-primary-900 break-all">
                {generateSIPURI()}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h2>
        
        <div className="space-y-6">
          {/* Mobile Setup */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">📱 Mobile Setup (iOS/Android)</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Download and install a softphone app (Linphone, Zoiper, or Groundwire)</li>
              <li>Open the app and select "Add SIP Account" or "Configure"</li>
              <li>Scan the QR code above OR enter credentials manually</li>
              <li>If entering manually:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Username: {credentials.username}</li>
                  <li>Password: {credentials.password}</li>
                  <li>Domain: {credentials.domain}</li>
                  <li>Transport: {credentials.transport}</li>
                </ul>
              </li>
              <li>Save the account and wait for registration</li>
              <li>You should see "Registered" or a green indicator</li>
            </ol>
          </div>

          {/* Desktop Setup */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">💻 Desktop Setup (Windows/Mac/Linux)</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Download Zoiper or another desktop softphone</li>
              <li>Install and open the application</li>
              <li>Click "Add New Account" → "SIP Account"</li>
              <li>Enter your credentials from the configuration above</li>
              <li>Advanced settings:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>Port: {credentials.port}</li>
                  <li>Transport: {credentials.transport}</li>
                  <li>Enable "Register on startup"</li>
                </ul>
              </li>
              <li>Test by making a call to another extension</li>
            </ol>
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ Troubleshooting</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>Not registering? Check your internet connection and firewall settings</li>
              <li>Can't make calls? Verify your extension is active in the system</li>
              <li>Audio issues? Check microphone permissions in your phone/app settings</li>
              <li>Still having issues? Contact your administrator with extension: {credentials.extension}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
