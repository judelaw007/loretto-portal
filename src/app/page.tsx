'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './home.module.css';
import { Icons } from '@/components/icons';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.logo}>
          <Icons.School size={64} />
        </div>
        <h1 className={styles.title}>Loretto School of Childhood</h1>
        <p className={styles.subtitle}>Student & Parent Portal</p>
        <p className={styles.description}>
          Welcome to the Loretto School Portal. Access your academic records,
          manage fees, and stay connected with the school community.
        </p>

        <div className={styles.actions}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push('/login')}
          >
            <Icons.Lock size={20} />
            Login to Portal
          </button>
          <button
            className="btn btn-outline btn-lg"
            onClick={() => router.push('/register')}
          >
            <Icons.UserPlus size={20} />
            New Registration
          </button>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <Icons.Award size={32} />
            <h3>View Results</h3>
            <p>Access academic performance and report cards</p>
          </div>
          <div className={styles.feature}>
            <Icons.Wallet size={32} />
            <h3>Pay Fees</h3>
            <p>View fee status and make online payments</p>
          </div>
          <div className={styles.feature}>
            <Icons.Bell size={32} />
            <h3>Announcements</h3>
            <p>Stay updated with school news and events</p>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Loretto School of Childhood. All rights reserved.</p>
        <p className={styles.address}>
          12 Wali Street, Nkpolu, Port Harcourt | Aboga Iguruta, Port Harcourt
        </p>
      </footer>
    </div>
  );
}
