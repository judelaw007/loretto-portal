'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './forgot-password.module.css';
import { Icons } from '@/components/icons';

type Step = 'phone' | 'otp' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'send_otp' }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to send OTP');
        return;
      }

      setStep('otp');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, action: 'verify_otp' }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Invalid OTP');
        return;
      }

      setStep('reset');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, newPassword, action: 'reset_password' }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setStep('success');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            <Icons.School size={48} />
          </Link>
          <h1>Reset Password</h1>
          <p>
            {step === 'phone' && 'Enter your phone number to receive a reset code'}
            {step === 'otp' && 'Enter the verification code sent to your phone'}
            {step === 'reset' && 'Create your new password'}
            {step === 'success' && 'Your password has been reset successfully!'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icons.AlertCircle size={16} />
            {error}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className={styles.form}>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className={styles.inputWrapper}>
                <Icons.Phone size={18} className={styles.inputIcon} />
                <input
                  id="phone"
                  type="tel"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className={styles.inputWithIcon}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className={styles.otpInput}
              />
              <p className="form-help">Code sent to {phone}</p>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-full mt-4"
              onClick={() => setStep('phone')}
            >
              Use Different Number
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <Icons.Check size={48} />
            </div>
            <Link href="/login" className="btn btn-primary btn-lg">
              Go to Login
            </Link>
          </div>
        )}

        <div className={styles.footer}>
          <Link href="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
