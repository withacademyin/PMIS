'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Briefcase, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function WorkerOnboarding() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [itis, setItis] = useState([]);
  const [isLoadingItis, setIsLoadingItis] = useState(true);
  
  const [formData, setFormData] = useState({
    trade: '',
    experienceYears: '0',
    certificationGrade: 'A',
    itiId: '',
    skills: '',
    languages: 'Hindi, English',
  });

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'WORKER') {
        router.replace('/');
        return;
      }
      
      if (user.workerProfile) {
        setFormData(prev => ({
          ...prev,
          trade: user.workerProfile.trade || '',
          experienceYears: user.workerProfile.experienceYears?.toString() || '0',
          certificationGrade: user.workerProfile.certificationGrade || 'A',
          itiId: user.workerProfile.itiId || '',
          skills: user.workerProfile.skills?.join(', ') || '',
          languages: user.workerProfile.languages?.join(', ') || 'Hindi, English',
        }));
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchItis = async () => {
      try {
        const res = await api.getITIs();
        if (res.success && res.data) {
          setItis(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch ITIs', err);
      } finally {
        setIsLoadingItis(false);
      }
    };
    fetchItis();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (!user?.workerProfile?.id) {
        throw new Error("Worker profile not found. Please contact support.");
      }
      
      const payload = {
        trade: formData.trade,
        experienceYears: parseInt(formData.experienceYears, 10) || 0,
        certificationGrade: formData.certificationGrade,
        itiId: formData.itiId || null,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        languages: formData.languages.split(',').map(s => s.trim()).filter(Boolean),
      };

      const res = await api.updateWorkerProfile(user.workerProfile.id, payload);
      
      if (res.success) {
        updateProfile(payload); // Context update
        router.push('/dashboard/worker');
      } else {
        setErrorMsg(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-2xl bg-white shadow-lg border-slate-200">
          <CardHeader className="text-center space-y-2 border-b border-slate-100 pb-6 mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Briefcase className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Complete Your Worker Profile
            </CardTitle>
            <CardDescription className="text-base">
              Add your trade and ITI details so Nodal Officers can match you with local work opportunities.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium border border-red-100">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Primary Trade</label>
                  <Input 
                    placeholder="e.g. Electrician, Fitter, Welder"
                    value={formData.trade}
                    onChange={(e) => setFormData({...formData, trade: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Years of Experience</label>
                  <Input 
                    type="number"
                    min="0"
                    max="50"
                    placeholder="0"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({...formData, experienceYears: e.target.value})}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Certification Grade</label>
                  <select 
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    value={formData.certificationGrade}
                    onChange={(e) => setFormData({...formData, certificationGrade: e.target.value})}
                  >
                    <option value="A">Grade A (Excellent)</option>
                    <option value="B">Grade B (Good)</option>
                    <option value="C">Grade C (Average)</option>
                    <option value="None">No Certification</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">ITI Institute</label>
                  <select 
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    value={formData.itiId}
                    onChange={(e) => setFormData({...formData, itiId: e.target.value})}
                    disabled={isLoadingItis}
                  >
                    <option value="">-- Select your ITI --</option>
                    {itis.map((iti) => (
                      <option key={iti.id} value={iti.id}>
                        {iti.name} ({iti.district})
                      </option>
                    ))}
                  </select>
                  {isLoadingItis && <p className="text-xs text-slate-500">Loading ITIs...</p>}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700">Core Skills</label>
                <Input 
                  placeholder="e.g. Wiring, Welding, Plumbing"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  className="h-11"
                />
                <p className="text-xs text-slate-500">Separate multiple skills with commas.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Languages Spoken</label>
                <Input 
                  placeholder="e.g. Hindi, English"
                  value={formData.languages}
                  onChange={(e) => setFormData({...formData, languages: e.target.value})}
                  className="h-11"
                />
              </div>

              <div className="pt-6">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isSubmitting || !formData.trade}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Profile...</>
                  ) : (
                    <><CheckCircle2 className="mr-2 h-5 w-5" /> Complete Onboarding</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
