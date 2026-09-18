'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Logo } from '@/components/ui/logo';
import { WebGLBackground } from '@/components/ui/webgl-background';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function AcceptInviteScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !password) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, token, password, name })
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setErrorMsg(data.message || 'Failed to accept invitation');
      }
    } catch (err) {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !emailParam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-slate-800">Invalid Link</h2>
        <p className="text-sm text-slate-500 mt-2">The invitation link is missing or invalid.</p>
      </div>
    );
  }

  return (
    <div style={{position:"relative",width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"#fff",color:"#000",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <WebGLBackground backgroundColor="white" dotColors={[[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]} />
      <div style={{position:"absolute",inset:0,zIndex:1,background:"radial-gradient(circle at center,rgba(255,255,255,0.75) 0%,rgba(255,255,255,0) 100%)",pointerEvents:"none"}}/>

      <div style={{position:"relative",zIndex:2,background:"#ffffff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:400,boxShadow:"0 10px 40px rgba(0,0,0,0.1)",display:"flex",flexDirection:"column",alignItems:"center",border:"1px solid #e5e7eb"}}>
        
        <Logo style={{width:44,height:44,marginBottom:"0.75rem"}} />
        <h1 style={{fontSize:"1.35rem",fontWeight:600,marginBottom:"0.25rem",letterSpacing:"-0.025em"}}>Accept Invitation</h1>
        <p style={{fontSize:"0.85rem",color:"#6b7280",marginBottom:"1.25rem",lineHeight:1.5,textAlign:"center"}}>
          Set up your recruiter profile for <strong>{emailParam}</strong>
        </p>

        {errorMsg && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded w-full text-center">{errorMsg}</p>}
        {success && <p className="text-emerald-600 text-sm mb-4 bg-emerald-50 p-2 rounded w-full text-center">Account created successfully! Redirecting to login...</p>}

        {!success && (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <Input 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Jane Doe" 
                className="bg-slate-50/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <Input 
                required 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Create a strong password" 
                className="bg-slate-50/50"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-2 bg-black text-white hover:bg-slate-800">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Create Account'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center relative">
        <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
          <AcceptInviteScreen />
        </Suspense>
      </div>
    </div>
  );
}
