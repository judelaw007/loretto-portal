'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';
import { Icons } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect based on role
      const role = data.user.role;
      if (role === 'super_admin') {
        router.push('/super-admin');
      } else if (role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
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
          <h1>Welcome Back</h1>
          <p>Sign in to access your portal</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className="alert alert-error">
              <Icons.AlertCircle size={16} />
              {error}
            </div>
          )}

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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <Icons.Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.inputWithIcon}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
              </button>
            </div>
          </div>

          <div className={styles.forgotPassword}>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <Icons.Lock size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Don't have an account?{' '}
            <Link href="/register">Register here</Link>
          </p>
        </div>
      </div>

      <div className={styles.info}>
        <h2>Loretto School Portal</h2>
        <ul>
          <li>
            <Icons.Check size={16} />
            Access academic results
          </li>
          <li>
            <Icons.Check size={16} />
            View and pay school fees
          </li>
          <li>
            <Icons.Check size={16} />
            Stay updated with announcements
          </li>
          <li>
            <Icons.Check size={16} />
            Manage your profile
          </li>
        </ul>
      </div>
    </div>
  );
}
