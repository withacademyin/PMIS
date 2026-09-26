'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { api } from '@/lib/api';
import { WebGLBackground } from '@/components/ui/webgl-background';
import { Logo } from '@/components/ui/logo';

function SignupScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const invitationToken = searchParams.get('token');
  const { signup, user, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trade, setTrade] = useState('Electrician');
  const [district, setDistrict] = useState('');
  const [department, setDepartment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'WORKER') {
        router.replace(user.profileCompleted ? '/dashboard/worker' : '/onboarding/worker');
      } else if (user.role === 'OFFICER') {
        router.replace('/dashboard/officer');
      } else if (user.role === 'ADMIN') {
        router.replace('/dashboard/admin');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      if (invitationToken) {
        const result = await api.acceptOfficerInvitation({
          email,
          token: invitationToken,
          name,
          password,
          department,
        });
        if (!result.success) throw new Error(result.message || 'Unable to accept invitation');
        router.replace('/auth/login?role=officer&invited=1');
        return;
      }
      const result = await signup({ name, email, password, role: 'WORKER', trade });
      if (!result.success) setErrorMsg(result.message || 'Signup failed');
    } catch (error) {
      setErrorMsg(error.message || 'An error occurred during registration');
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
      By proceeding, you agree to creating an account subject to our{' '}
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
          <h1 style={{ fontSize: '1.35rem', fontWeight: 600, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>{invitationToken ? 'Accept Officer Invitation' : 'Create a Worker Account'}</h1>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem', lineHeight: 1.5 }}>
            {invitationToken ? 'Complete your invited nodal officer account.' : 'Join the ITI Portal to find opportunities matching your trade.'}
          </p>

          {errorMsg && (
            <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.85rem', width: '100%', textAlign: 'left' }}>
              <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>{errorMsg}</p>
              {errorMsg.toLowerCase().includes('already in use') && (
                <p style={{ fontSize: '0.78rem', color: '#4b5563', marginTop: '0.35rem', marginBottom: 0 }}>
                  Already have an account?{' '}
                  <Link href={`/auth/login?email=${encodeURIComponent(email)}`} style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}>
                    Log in with this email &rarr;
                  </Link>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <input style={inputStyle} type="text" placeholder="Full Name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} />
            <input style={inputStyle} type="email" placeholder="Email address" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <input style={inputStyle} type="password" placeholder="Password (min 10 characters)" required minLength={10} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />

            {invitationToken ? (
              <>
                <input style={inputStyle} type="text" placeholder="Department (optional)" maxLength={120} value={department} onChange={(event) => setDepartment(event.target.value)} />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'left' }}>Your district assignment comes from the administrator invitation.</p>
              </>
            ) : (
              <select style={inputStyle} value={trade} onChange={(event) => setTrade(event.target.value)}>
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
            )}

            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '0.65rem', borderRadius: 6, border: 'none', background: '#000', color: '#fff', fontWeight: 500, fontSize: '0.875rem', cursor: submitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Creating account...' : invitationToken ? 'Accept Invitation' : 'Sign Up as Worker'}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Already have an account? <Link href="/auth/login" style={{ color: '#000', fontWeight: 500 }}>Log In</Link>
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
