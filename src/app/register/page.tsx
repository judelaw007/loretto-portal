'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './register.module.css';
import { Icons } from '@/components/icons';
import { CLASS_LEVELS, type ClassLevel } from '@/types';

type RegistrationType = 'parent' | 'student';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState<RegistrationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Student fields
    classLevel: '' as ClassLevel | '',
    studentId: '',
    dateOfBirth: '',
    // Parent fields
    occupation: '',
    address: '',
    childStudentId: '', // To link with existing student
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: registrationType,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Redirect to login with success message
      router.push('/login?registered=true');
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
          <h1>Create Account</h1>
          <p>Register to access the school portal</p>
        </div>

        {/* Step indicator */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
            <span>1</span>
            <p>Account Type</p>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
            <span>2</span>
            <p>Personal Info</p>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
            <span>3</span>
            <p>Complete</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <Icons.AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Step 1: Choose account type */}
        {step === 1 && (
          <div className={styles.typeSelection}>
            <h2>I am a...</h2>
            <div className={styles.typeCards}>
              <button
                className={`${styles.typeCard} ${registrationType === 'parent' ? styles.selected : ''}`}
                onClick={() => setRegistrationType('parent')}
              >
                <Icons.Users size={40} />
                <h3>Parent / Guardian</h3>
                <p>Register to manage your children's academic records</p>
              </button>
              <button
                className={`${styles.typeCard} ${registrationType === 'student' ? styles.selected : ''}`}
                onClick={() => setRegistrationType('student')}
              >
                <Icons.User size={40} />
                <h3>Student</h3>
                <p>Register to access your academic portal</p>
              </button>
            </div>
            <button
              className="btn btn-primary btn-lg btn-full mt-6"
              onClick={() => setStep(2)}
              disabled={!registrationType}
            >
              Continue
              <Icons.ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className={styles.form}>
            <div className={styles.formGrid}>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                placeholder="08012345678"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                required
              />
              <p className="form-help">This will be used for login</p>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (Optional)</label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </div>

            {registrationType === 'student' && (
              <>
                <div className={styles.formGrid}>
                  <div className="form-group">
                    <label htmlFor="studentId">Student ID</label>
                    <input
                      id="studentId"
                      type="text"
                      placeholder="Enter your student ID"
                      value={formData.studentId}
                      onChange={(e) => updateField('studentId', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth</label>
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="classLevel">Class</label>
                  <select
                    id="classLevel"
                    value={formData.classLevel}
                    onChange={(e) => updateField('classLevel', e.target.value)}
                    required
                  >
                    <option value="">Select your class</option>
                    {CLASS_LEVELS.map((cls) => (
                      <option key={cls.value} value={cls.value}>
                        {cls.label} ({cls.category})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {registrationType === 'parent' && (
              <>
                <div className="form-group">
                  <label htmlFor="occupation">Occupation</label>
                  <input
                    id="occupation"
                    type="text"
                    placeholder="Your occupation"
                    value={formData.occupation}
                    onChange={(e) => updateField('occupation', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    type="text"
                    placeholder="Your home address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="childStudentId">Child's Student ID (Optional)</label>
                  <input
                    id="childStudentId"
                    type="text"
                    placeholder="Link to your child's account"
                    value={formData.childStudentId}
                    onChange={(e) => updateField('childStudentId', e.target.value)}
                  />
                  <p className="form-help">You can add more children after registration</p>
                </div>
              </>
            )}

            <div className={styles.formActions}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Continue
                <Icons.ChevronRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Password & Complete */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                required
                minLength={6}
              />
              <p className="form-help">Minimum 6 characters</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                required
              />
            </div>

            <div className={styles.summary}>
              <h3>Registration Summary</h3>
              <div className={styles.summaryItem}>
                <span>Account Type:</span>
                <span>{registrationType === 'parent' ? 'Parent/Guardian' : 'Student'}</span>
              </div>
              <div className={styles.summaryItem}>
                <span>Name:</span>
                <span>{formData.firstName} {formData.lastName}</span>
              </div>
              <div className={styles.summaryItem}>
                <span>Phone:</span>
                <span>{formData.phone}</span>
              </div>
              {registrationType === 'student' && (
                <div className={styles.summaryItem}>
                  <span>Class:</span>
                  <span>{CLASS_LEVELS.find(c => c.value === formData.classLevel)?.label || '-'}</span>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
                Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Icons.Check size={18} />
                    Complete Registration
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
