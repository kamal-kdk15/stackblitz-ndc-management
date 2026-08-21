'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/layout.jsx';

export default function NDCPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard with a message to use the wizard
    router.push('/dashboard');
  }, [router]);

  return (
    <Layout current="/ndc">
      <div style={{ padding: '32px', textAlign: 'center', marginTop: '60px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>Redirecting...</h2>
        <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
          The guided 3-step NDC wizard is now on your Dashboard!
        </p>
        <p style={{ fontSize: '13px', color: '#BBB' }}>
          Click the <strong>&quot;+ Create NDC&quot;</strong> button to start.
        </p>
      </div>
    </Layout>
  );
}
