import React, { useEffect, useRef } from 'react';

interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
  showRequirements?: boolean;
  label?: string;
}

const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;

  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Normalize score to 0-4 range
  return Math.min(4, Math.floor((score * 4) / 6));
};

const getPasswordFeedback = (_score: number, password: string): string => {
  if (!password) return 'Please enter a password';

  const missing = [];
  if (password.length < 8) missing.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) missing.push('uppercase letter');
  if (!/[a-z]/.test(password)) missing.push('lowercase letter');
  if (!/[0-9]/.test(password)) missing.push('number');
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('special character');

  if (missing.length > 0) {
    return `Add ${missing.join(', ')} to make your password stronger`;
  }
  return '';
};

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password: rawPassword,
  className = '',
  showRequirements = false,
  label,
}) => {
  const password = rawPassword ?? '';
  const score = calculatePasswordStrength(password);
  const feedback = getPasswordFeedback(score, password);

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
        return 'bg-red-500';
      case 1:
        return 'bg-orange-500';
      case 2:
        return 'bg-yellow-500';
      case 3:
        return 'bg-green-400';
      case 4:
        return 'bg-green-600';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthText = (score: number) => {
    switch (score) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Medium';
      case 3:
        return 'Strong';
      case 4:
        return 'Very Strong';
      default:
        return 'Unknown';
    }
  };

  const strengthText = getStrengthText(score);
  const strengthPercentage = (score / 4) * 100;
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Announce strength changes to screen readers
    if (statusRef.current) {
      statusRef.current.textContent = `password strength: ${strengthText.toLowerCase()}`;
    }
  }, [strengthText]);

  return (
    <div className={'space-y-2'}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className={`flex items-center space-x-2 ${className}`}>
        <div
          role="meter"
          aria-label="Password Strength"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={strengthPercentage}
          aria-valuetext={`${strengthText} strength password`}
          className={`flex-1 h-2 rounded-full overflow-hidden ${getStrengthColor(score)}`}
          style={{ width: `${strengthPercentage}%` }}
        ></div>
        <span className="text-sm font-medium text-gray-700" data-testid="strength-text">
          {strengthText}
        </span>
      </div>
      {feedback && <p className="text-sm text-gray-600">{feedback}</p>}
      {showRequirements && (
        <div className="mt-2 space-y-1">
          <p
            data-testid="length-requirement"
            className={`text-sm ${password.length >= 8 ? 'text-green-500' : 'text-gray-600'}`}
          >
            • At least 8 characters
          </p>
          <p
            data-testid="uppercase-requirement"
            className={`text-sm ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-600'}`}
          >
            • Uppercase letter
          </p>
          <p
            data-testid="lowercase-requirement"
            className={`text-sm ${/[a-z]/.test(password) ? 'text-green-500' : 'text-gray-600'}`}
          >
            • Lowercase letter
          </p>
          <p
            data-testid="number-requirement"
            className={`text-sm ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-600'}`}
          >
            • Number
          </p>
          <p
            data-testid="special-requirement"
            className={`text-sm ${
              /[^A-Za-z0-9]/.test(password) ? 'text-green-500' : 'text-gray-600'
            }`}
          >
            • Special character
          </p>
        </div>
      )}
      <div id="password-strength-status" role="status" className="sr-only" ref={statusRef} />
    </div>
  );
};
