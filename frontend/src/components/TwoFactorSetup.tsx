import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from '../services/api';

interface TwoFactorSetupProps {
  onComplete: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [secret, setSecret] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const startSetup = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/2fa/setup');
      setSecret(response.data.secret);
      setQrCode(response.data.qr_code);
      setStep('confirm');
      toast.success('2FA setup initiated successfully');
    } catch (error) {
      console.error('2FA setup error:', error);
      toast.error('Failed to start 2FA setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSetup = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/auth/2fa/confirm', { code });
      setBackupCodes(response.data.backup_codes);
      toast.success('2FA setup completed successfully');
      onComplete();
    } catch (error) {
      console.error('2FA confirmation error:', error);
      toast.error('Failed to confirm 2FA setup. Please check your code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Two-Factor Authentication Setup</h2>

      {step === 'setup' && (
        <div>
          <p className="mb-4">
            Two-factor authentication adds an extra layer of security to your account. You'll need
            to enter a code from your authenticator app each time you log in.
          </p>
          <button
            onClick={startSetup}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Starting Setup...' : 'Start Setup'}
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">1. Install an Authenticator App</h3>
            <p className="mb-4">
              Install an authenticator app like Google Authenticator, Authy, or Microsoft
              Authenticator on your mobile device.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">2. Scan the QR Code</h3>
            <div className="flex justify-center mb-4">
              {qrCode && (
                <QRCodeSVG
                  value={`otpauth://totp/${encodeURIComponent(
                    secret
                  )}?secret=${secret}&issuer=AssignmentAI`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>
            <p className="text-sm text-gray-600">
              If you can't scan the QR code, enter this code manually in your authenticator app:
              <code className="block mt-2 p-2 bg-gray-100 rounded">{secret}</code>
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">3. Enter the Code</h3>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full p-2 border rounded"
              maxLength={6}
            />
          </div>

          <button
            onClick={confirmSetup}
            disabled={isLoading || code.length !== 6}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Confirming...' : 'Confirm Setup'}
          </button>
        </div>
      )}

      {backupCodes.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 rounded">
          <h3 className="text-lg font-semibold mb-2">Backup Codes</h3>
          <p className="mb-4">
            Save these backup codes in a secure place. You can use them to access your account if
            you lose your authenticator app.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <code key={index} className="block p-2 bg-gray-100 rounded text-center">
                {code}
              </code>
            ))}
          </div>
          <p className="mt-4 text-sm text-red-600">
            These codes will only be shown once. Make sure to save them now!
          </p>
        </div>
      )}
    </div>
  );
};
