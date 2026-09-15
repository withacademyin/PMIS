'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { ProgressUpload } from '@/components/ui/progress-upload';

export default function UpdateResumeModal({ open, onOpenChange }) {
  const { user, token, updateProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    institute: '',
    course: '',
    skills: '',
  });
  
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);

  // Pre-fill existing data
  useEffect(() => {
    if (open && user?.studentProfile) {
      setFormData({
        institute: user.studentProfile.college || '',
        course: user.studentProfile.degree || '',
        skills: user.studentProfile.skills?.join(', ') || '',
      });
      setStep(1);
      setResumeFile(null);
      setErrorMsg('');
    }
  }, [open, user]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const uploadAndParseResume = async () => {
    if (!resumeFile || !formData.institute || !formData.course) {
      setErrorMsg('Please fill all fields and upload a resume');
      return;
    }
    
    setIsParsing(true);
    setErrorMsg('');
    
    const data = new FormData();
    data.append('institute', formData.institute);
    data.append('course', formData.course);
    data.append('resume', resumeFile);

    try {
      const result = await api.completeOnboarding(data);

      if (result.success) {
        const parsedSkills = result.profile?.skills || [];
        setFormData({ ...formData, skills: parsedSkills.join(', ') });
        setStep(2); 
      } else {
        setErrorMsg(result.message || 'Failed to parse resume');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to server');
    } finally {
      setIsParsing(false);
    }
  };

  const handleComplete = () => {
    updateProfile({
      institute: formData.institute,
      course: formData.course,
      skills: formData.skills,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{step === 1 ? 'Update Profile & Resume' : 'Parsed Profile Data'}</DialogTitle>
          <DialogDescription>
            {step === 1 
              ? 'Upload your latest resume to re-parse your skills and update your university.' 
              : 'Our AI has successfully parsed your new resume. Please review.'}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && <div className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{errorMsg}</div>}

        <div className="py-2">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Institute / University</label>
                <Input 
                  placeholder="e.g. Stanford University"
                  value={formData.institute}
                  onChange={(e) => setFormData({...formData, institute: e.target.value})}
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Course / Degree</label>
                <Input 
                  placeholder="e.g. B.S. Computer Science"
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  className="bg-slate-50"
                />
              </div>

              <div className="pt-2">
                <ProgressUpload
                  maxFiles={1}
                  multiple={false}
                  accept=".pdf"
                  maxSize={5 * 1024 * 1024}
                  title="Upload updated resume (PDF)"
                  description="Drag and drop or click to browse"
                  onFilesChange={(files) => {
                    if (files.length > 0 && (files[0].file || files[0] instanceof File)) {
                      setResumeFile(files[0].file || files[0]);
                    } else {
                      setResumeFile(null);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Parsed Skills (Comma separated)</label>
                <Input 
                  value={formData.skills}
                  readOnly
                  className="bg-slate-50 text-slate-600 text-sm"
                />
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                  Your resume has been successfully parsed and your profile is ready to be updated.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between border-t border-slate-100 pt-3 mt-1">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="text-slate-600 border-slate-200"
          >
            Cancel
          </Button>
          
          {step === 1 ? (
            <Button 
              onClick={uploadAndParseResume}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
              disabled={!resumeFile || !formData.institute || isParsing}
            >
              {isParsing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</>
              ) : (
                "Upload & Parse AI"
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Profile
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
