'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

import { WebGLBackground } from '@/components/ui/webgl-background';
import { Logo } from '@/components/ui/logo';

function SignupScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRole = 'WORKER';

  const { signup, user, loading } = useAuth();

  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trade, setTrade] = useState('Electrician');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'WORKER') {
        router.replace(user.profileCompleted ? '/dashboard/worker' : '/onboarding/worker');
      } else if (user.role === 'OFFICER' || user.role === 'RECRUITER') {
        router.replace('/dashboard/officer');
      } else if (user.role === 'ADMIN') {
        router.replace('/dashboard/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name || !email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await signup({
        name,
        email,
        password,
        role,
        trade,
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Signup failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred during registration');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    color: '#000',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const Footer = (
    <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.5, textAlign: 'center' }}>
      By proceeding, you agree to creating an account<br/>subject to our{' '}
      <a href="#" style={{ color: '#4b5563' }}>Terms of Service</a> and <a href="#" style={{ color: '#4b5563' }}>Privacy Policy</a>.
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff', color: '#000', fontFamily: "'Inter',-apple-system,sans-serif", padding: '2rem 1rem' }}>
      <WebGLBackground backgroundColor="white" dotColors={[[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(circle at center,rgba(255,255,255,0.75) 0%,rgba(255,255,255) 100%)', pointerEvents: 'none' }}/>

      <div style={{ position: 'relative', zIndex: 2, background: '#ffffff', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 440, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #e5e7eb' }}>
        
        <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <Logo style={{ width: 44, height: 44, marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>Create an Account</h1>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.5 }}>
            Join the ITI Portal to find opportunities matching your trade.
          </p>

          {errorMsg && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{errorMsg}</p>}

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <input 
              style={inputStyle} 
              type="text" 
              placeholder="Full Name" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input 
              style={inputStyle} 
              type="email" 
              placeholder="Email address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              style={inputStyle} 
              type="password" 
              placeholder="Password (min 6 characters)" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

                <select
                  style={inputStyle}
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Fitter">Fitter</option>
                  <option value="Welder">Welder</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Turner">Turner</option>
                  <option value="Machinist">Machinist</option>
                  <option value="COPA">COPA (Computer Operator)</option>
                  <option value="Plumber">Plumber</option>
                  <option value="General">Other / General</option>
                </select>

            <button 
              type="submit" 
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 6,
                border: 'none',
                background: '#000',
                color: '#fff',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Creating account...' : 'Sign Up as Worker'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#000', fontWeight: 500 }}>Log In</Link>
          </div>
          {Footer}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center relative">
        <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
          <SignupScreen />
        </Suspense>
      </div>
    </div>
  );
}
