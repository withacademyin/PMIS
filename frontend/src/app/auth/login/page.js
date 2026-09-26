'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Logo } from '@/components/ui/logo';
import { useRouter, useSearchParams } from 'next/navigation';

import { WebGLBackground } from '@/components/ui/webgl-background';

function LoginScreen() {
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'LEARNER' || user.role === 'WORKER') {
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
    if (!email || !password) return;
    
    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred');
    }
  };

  const socialBtn = {
    width:"100%", padding:"0.65rem", borderRadius:6,
    border:"1px solid #e5e7eb", background:"#fff", color:"#000",
    fontWeight:500, fontSize:"0.875rem", cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem",
    marginBottom:"0.4rem",
  };
  
  const inputStyle = {
    width:"100%", padding:"0.65rem 0.85rem", borderRadius:6,
    border:"1px solid #e5e7eb", background:"#f9fafb", color:"#000",
    fontSize:"0.875rem", outline:"none",
  };

  const GoogleIcon = (
    <svg viewBox="0 0 24 24" style={{width:16,height:16,flexShrink:0}}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div style={{position:"relative",width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"#fff",color:"#000",fontFamily:"'Inter',-apple-system,sans-serif"}}>

      <WebGLBackground backgroundColor="white" dotColors={[[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]} />
      <div style={{position:"absolute",inset:0,zIndex:1,background:"radial-gradient(circle at center,rgba(255,255,255,0.75) 0%,rgba(255,255,255,0) 100%)",pointerEvents:"none"}}/>

      <div style={{position:"relative",zIndex:2,width:"100%",maxWidth:"420px",backgroundColor:"white",borderRadius:"1rem",boxShadow:"0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",overflow:"hidden",border:"1px solid #e5e7eb"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"1.5rem 1.5rem 0",borderBottom:"1px solid #f1f5f9",paddingBottom:"1.25rem"}}>
          <div style={{width:"2rem",height:"2rem",borderRadius:"0.35rem",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Logo style={{width:"100%",height:"100%",objectFit:"cover"}} />
          </div>
          <h1 style={{fontSize:"1.35rem",fontWeight:600,letterSpacing:"-0.025em"}}>Sign In to TalentPortal</h1>
        </div>
        <div style={{padding:"1.5rem"}}>
          <p style={{fontSize:"0.85rem",color:"#6b7280",marginBottom:"0.85rem",lineHeight:1.5}}>Sign in to your TalentPortal account.</p>

          {errorMsg && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:"0.5rem"}}>{errorMsg}</p>}

          <form onSubmit={handleSubmit} style={{width:"100%",display:"flex",flexDirection:"column",gap:"0.65rem"}}>
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
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" style={{width:"100%",padding:"0.65rem",borderRadius:6,border:"none",background:"#000",color:"#fff",fontWeight:500,fontSize:"0.875rem",cursor:"pointer",marginTop:"0.5rem"}}>
              Sign In
            </button>
          </form>

          <div style={{height:1,background:"#e5e7eb",width:"100%",margin:"1.25rem 0"}}/>

          <button style={socialBtn} type="button">{GoogleIcon}Continue with Google</button>

          <div style={{marginTop:"1.5rem",fontSize:"0.875rem",color:"#6b7280"}}>
            Don't have an account?{" "}
            <Link href="/auth/signup" style={{color:"#000",fontWeight:500}}>Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1 flex items-center justify-center relative">
        <Suspense fallback={<div className="text-slate-500">Loading...</div>}>
          <LoginScreen />
        </Suspense>
      </div>
    </div>
  );
}
