'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import { Building2, GraduationCap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { WebGLBackground } from '@/components/ui/webgl-background';
import { api } from '@/lib/api';
import { Logo } from '@/components/ui/logo';

function SignupScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultRole = searchParams.get('role') || '';
  const { signup, user, loading } = useAuth();

  const [role, setRole] = useState(defaultRole);
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'LEARNER') {
        router.replace(user.profileCompleted ? '/dashboard/student' : '/onboarding/student');
      } else if (user.role === 'RECRUITER') {
        router.replace('/dashboard/recruiter');
      } else if (user.role === 'ADMIN') {
        router.replace('/dashboard/admin');
      } else {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'learner' && !email.endsWith('.edu') && !email.endsWith('.ac.in')) {
      setErrorMsg('Please use a valid college email address (.edu or .ac.in)');
      return;
    }
    setErrorMsg('');
    if (!name || !email || !password) return;
    
    try {
      const res = await signup(name, email, password, role);
      if (!res.success) {
        setErrorMsg(res.message || 'Signup failed');
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

  const Footer = (
    <div style={{marginTop:"0.85rem",fontSize:"0.75rem",color:"#6b7280",lineHeight:1.5,textAlign:"center"}}>
      By proceeding, you agree to creating an account<br/>subject to our{" "}
      <a href="#" style={{color:"#4b5563"}}>Terms of Service</a> and <a href="#" style={{color:"#4b5563"}}>Privacy Policy</a>.
    </div>
  );

  return (
    <div style={{position:"relative",width:"100%",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"#fff",color:"#000",fontFamily:"'Inter',-apple-system,sans-serif"}}>

      <WebGLBackground backgroundColor="white" dotColors={[[0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0]]} />
      <div style={{position:"absolute",inset:0,zIndex:1,background:"radial-gradient(circle at center,rgba(255,255,255,0.75) 0%,rgba(255,255,255,0) 100%)",pointerEvents:"none"}}/>

      <div style={{position:"relative",zIndex:2,background:"#ffffff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:400,boxShadow:"0 10px 40px rgba(0,0,0,0.1)",display:"flex",flexDirection:"column",alignItems:"center",border:"1px solid #e5e7eb"}}>
        
        {!role ? (
          <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
            <h1 style={{fontSize:"1.35rem",fontWeight:600,marginBottom:"0.25rem",letterSpacing:"-0.025em"}}>Join TalentPortal</h1>
            <p style={{fontSize:"0.85rem",color:"#6b7280",marginBottom:"1.5rem",lineHeight:1.5}}>To begin, tell us what you're looking for.</p>

            <div className="flex flex-col gap-3 w-full mb-6">
              <button 
                onClick={() => setSelectedRole('learner')}
                className={`flex items-center p-4 border rounded-lg transition-all text-left group relative ${
                  selectedRole === 'learner' 
                    ? 'border-indigo-600 bg-indigo-50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-slate-50 border flex items-center justify-center text-slate-700 transition-colors mr-4 shrink-0 ${
                  selectedRole === 'learner' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200'
                }`}>
                  <GraduationCap className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className={`font-medium text-sm transition-colors ${selectedRole === 'learner' ? 'text-indigo-900' : 'text-slate-900'}`}>I'm looking for a job</h3>
                  <p className={`text-xs mt-0.5 transition-colors ${selectedRole === 'learner' ? 'text-indigo-600' : 'text-slate-500'}`}>Discover internships & entry-level roles</p>
                </div>
                {selectedRole === 'learner' && (
                  <div className="absolute right-4 h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
              </button>
              
              <button 
                onClick={() => setSelectedRole('recruiter')}
                className={`flex items-center p-4 border rounded-lg transition-all text-left group relative ${
                  selectedRole === 'recruiter' 
                    ? 'border-indigo-600 bg-indigo-50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg bg-slate-50 border flex items-center justify-center text-slate-700 transition-colors mr-4 shrink-0 ${
                  selectedRole === 'recruiter' ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200'
                }`}>
                  <Building2 className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className={`font-medium text-sm transition-colors ${selectedRole === 'recruiter' ? 'text-indigo-900' : 'text-slate-900'}`}>I'm looking for candidates</h3>
                  <p className={`text-xs mt-0.5 transition-colors ${selectedRole === 'recruiter' ? 'text-indigo-600' : 'text-slate-500'}`}>Post jobs and discover verified talent</p>
                </div>
                {selectedRole === 'recruiter' && (
                  <div className="absolute right-4 h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                )}
              </button>
            </div>

            <button 
              onClick={() => {
                if (selectedRole) setRole(selectedRole);
              }}
              disabled={!selectedRole}
              className={`w-full padding-[0.65rem] py-2.5 rounded-md font-medium text-sm transition-all duration-200 ${
                selectedRole 
                  ? 'bg-black text-white hover:bg-slate-800 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continue
            </button>

            <div style={{marginTop:"1.5rem",fontSize:"0.875rem",color:"#6b7280"}}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{color:"#000",fontWeight:500}}>Log In</Link>
            </div>
            {Footer}
          </div>
        ) : (
          <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
            <div className="w-full flex justify-start mb-2">
              <button onClick={() => {setRole(''); setErrorMsg('');}} className="text-slate-500 hover:text-black text-xs flex items-center">
                ← Back
              </button>
            </div>
            <Logo style={{width:44,height:44,marginBottom:"0.75rem"}} />
            <h1 style={{fontSize:"1.35rem",fontWeight:600,marginBottom:"0.25rem",letterSpacing:"-0.025em"}}>Create an Account</h1>
            <p style={{fontSize:"0.85rem",color:"#6b7280",marginBottom:"0.85rem",lineHeight:1.5}}>Register as a {role === 'learner' ? 'applicant' : 'recruiter'}.</p>

            {errorMsg && <p style={{color:"#ef4444",fontSize:"0.85rem",marginBottom:"0.5rem"}}>{errorMsg}</p>}

            <form onSubmit={handleSubmit} style={{width:"100%",display:"flex",flexDirection:"column",gap:"0.65rem"}}>
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
                placeholder="Password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" style={{width:"100%",padding:"0.65rem",borderRadius:6,border:"none",background:"#000",color:"#fff",fontWeight:500,fontSize:"0.875rem",cursor:"pointer",marginTop:"0.5rem"}}>
                Sign Up
              </button>
            </form>

            <div style={{height:1,background:"#e5e7eb",width:"100%",margin:"1.25rem 0"}}/>

            <button style={socialBtn} type="button">{GoogleIcon}Sign up with Google</button>

            <div style={{marginTop:"1.5rem",fontSize:"0.875rem",color:"#6b7280"}}>
              Already have an account?{" "}
              <Link href="/auth/login" style={{color:"#000",fontWeight:500}}>Log In</Link>
            </div>
            {Footer}
          </div>
        )}
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
