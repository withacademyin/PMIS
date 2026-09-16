'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle2, Loader2, GraduationCap, Clock, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { api } from '@/lib/api';
import { useSettings } from '@/hooks/useSettings';
import { ProgressUpload } from '@/components/ui/progress-upload';
import { MorphingInfinity } from '@/components/ui/morphing-infinity';
import { Progress } from '@/components/ui/progress';

const ParsingProgress = () => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 25;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (progress >= 100) setTimeout(() => setProgress(0), 4000);
  }, [progress]);

  return <Progress value={progress} className="h-1.5 w-full bg-slate-200" />;
};

export default function StudentOnboarding() {
  const { user, loading, completeOnboarding, token } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    institute: '',
    course: '',
    skills: '',
    languages: '',
    projectTypes: '',
    certifications: '',
  });
  
  const [resumeFile, setResumeFile] = useState(null);

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [scores, setScores] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPasteWarning, setShowPasteWarning] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [infractions, setInfractions] = useState(0);

  // Timer & Tab Visibility effect
  useEffect(() => {
    let timer;
    if (assessment && !scores && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && assessment && !scores && !isEvaluating) {
      // Auto submit when time runs out
      submitAssessment();
    }

    const handleVisibilityChange = () => {
      if (document.hidden && assessment && !scores && timeLeft > 0 && !isEvaluating) {
        setInfractions(prev => prev + 1);
        setShowTabWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [assessment, scores, timeLeft, isEvaluating]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePreventCheating = (e) => {
    e.preventDefault();
    setInfractions(prev => prev + 1);
    setShowPasteWarning(true);
    setTimeout(() => setShowPasteWarning(false), 4000);
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/auth/login?role=learner');
      } else if (user.role.toLowerCase() !== 'learner' && user.role.toLowerCase() !== 'student') {
        router.replace('/');
      } else {
        // Safe parser for arrays
        const safeJoin = (val) => Array.isArray(val) ? val.join(', ') : (typeof val === 'string' ? val : '');

        // Initialize form data from user profile if it exists
        setFormData(prev => ({
          ...prev,
          institute: user.studentProfile?.college || prev.institute,
          skills: safeJoin(user.studentProfile?.skills) || prev.skills,
          languages: safeJoin(user.studentProfile?.languages) || prev.languages,
          projectTypes: safeJoin(user.studentProfile?.projectTypes) || prev.projectTypes,
          certifications: safeJoin(user.studentProfile?.certifications) || prev.certifications,
        }));

        if (user.profileCompleted) {
          const hasScores = user.studentProfile?.skillScores && Object.keys(user.studentProfile.skillScores).length > 0;
          const lastAssessmentAt = user.studentProfile?.lastAssessmentAt ? new Date(user.studentProfile.lastAssessmentAt) : null;
          const canRetake = lastAssessmentAt && (new Date() - lastAssessmentAt) >= 3 * 24 * 60 * 60 * 1000;

          if (!hasScores || canRetake) {
            // If they skipped the assessment or are eligible for a retake, jump to step 4
            setStep(4);
          } else {
            // Fully onboarded with assessment taken and not eligible for retake
            router.replace('/dashboard/student');
          }
        }
      }
    }
  }, [user, loading, router]);

  const hasScores = user?.studentProfile?.skillScores && Object.keys(user.studentProfile.skillScores).length > 0;
  const lastAssessmentAt = user?.studentProfile?.lastAssessmentAt ? new Date(user.studentProfile.lastAssessmentAt) : null;
  const canRetake = lastAssessmentAt && (new Date() - lastAssessmentAt) >= 3 * 24 * 60 * 60 * 1000;
  const shouldRenderAssessmentOnly = user?.profileCompleted && (!hasScores || canRetake);

  if (loading || !user || (user.role.toLowerCase() !== 'learner' && user.role.toLowerCase() !== 'student') || (user.profileCompleted && !shouldRenderAssessmentOnly)) {
    return null;
  }

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const uploadAndParseResume = async () => {
    if (!resumeFile || !formData.institute || !formData.course) return;
    
    setIsParsing(true);
    setErrorMsg('');
    
    const data = new FormData();
    data.append('institute', formData.institute);
    data.append('course', formData.course);
    data.append('resume', resumeFile);

    try {
      const response = await api.completeOnboarding(data);
      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          skills: response.profile?.skills?.join(', ') || '',
          languages: response.profile?.languages?.join(', ') || '',
          projectTypes: response.profile?.projectTypes?.join(', ') || '',
          certifications: response.profile?.certifications?.join(', ') || '',
        }));
        
        // Show a helpful message if AI failed to parse anything
        if (!response.profile?.skills?.length && !response.profile?.projectTypes?.length) {
          setErrorMsg('AI Parser is busy (High Demand). Please enter your details manually.');
        } else {
          setErrorMsg('');
        }
        
        setStep(3);
      } else {
        setErrorMsg(response.message || 'Failed to parse resume');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to connect to server');
    } finally {
      setIsParsing(false);
    }
  };

  const saveProfileData = async () => {
    try {
      const data = new FormData();
      data.append('institute', formData.institute);
      data.append('course', formData.course);
      data.append('skills', formData.skills);
      data.append('languages', formData.languages);
      data.append('projectTypes', formData.projectTypes);
      data.append('certifications', formData.certifications);
      data.append('manualUpdate', 'true');
      
      await api.completeOnboarding(data); 
      setStep(4);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile');
    }
  };

  const handleFinishOnboarding = () => {
    completeOnboarding({ 
      ...formData, 
      profileCompleted: true,
      skillScores: scores && Object.keys(scores).length > 0 ? scores : null,
      lastAssessmentAt: scores && Object.keys(scores).length > 0 ? new Date().toISOString() : null
    });
  };

  const generateAssessment = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.generateSkillAssessment(skillsArray);
      if (res.success && res.data) {
        setAssessment(res.data);
        setTimeLeft(res.data.length * 120); // 2 minutes per skill
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate assessment');
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAssessment = async () => {
    setIsEvaluating(true);
    setErrorMsg('');
    try {
      const formattedAnswers = [];
      assessment.forEach((skillBlock) => {
        skillBlock.questions.forEach((q) => {
          const key = `${skillBlock.skill}_${q.type}`;
          formattedAnswers.push({
            skill: skillBlock.skill,
            type: q.type,
            question: q.question,
            answer: answers[key] || '',
          });
        });
      });

      const res = await api.evaluateSkillAssessment(formattedAnswers, infractions);
      if (res.success) {
        setScores(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to evaluate assessment');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        
        <div className="w-full max-w-2xl mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= s ? 'bg-[#4CAF50] text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`h-1 flex-1 mx-2 rounded-full transition-colors ${step > s ? 'bg-[#4CAF50]' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="w-full max-w-3xl bg-white shadow-xs border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">
              {step === 1 && "Academic Details"}
              {step === 2 && "Upload Resume"}
              {step === 3 && "Confirm Your Profile"}
              {step === 4 && "Skill Verification"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us where and what you are studying."}
              {step === 2 && "Upload your latest resume. Our AI will instantly parse your skills."}
              {step === 3 && "Review the skills extracted from your resume."}
              {step === 4 && "Take a quick AI-powered assessment to verify your skills and boost your ranking."}
            </CardDescription>
            {errorMsg && <p className="text-sm text-red-500 mt-2">{errorMsg}</p>}
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4 py-4">
                {settingsLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Institute / University</label>
                      {settings.allowedColleges?.length > 0 ? (
                        <select 
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.institute}
                          onChange={(e) => setFormData({...formData, institute: e.target.value})}
                        >
                          <option value="" disabled>Select your college...</option>
                          {settings.allowedColleges.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <Input 
                          placeholder="e.g. Stanford University"
                          value={formData.institute}
                          onChange={(e) => setFormData({...formData, institute: e.target.value})}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Course / Degree</label>
                      {settings.allowedCourses?.length > 0 ? (
                        <select 
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formData.course}
                          onChange={(e) => setFormData({...formData, course: e.target.value})}
                        >
                          <option value="" disabled>Select your course...</option>
                          {settings.allowedCourses.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      ) : (
                        <Input 
                          placeholder="e.g. B.S. Computer Science"
                          value={formData.course}
                          onChange={(e) => setFormData({...formData, course: e.target.value})}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 py-2">
                {isParsing ? (
                  <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-8 text-center space-y-5">
                    <div className="flex justify-center">
                      <MorphingInfinity className="w-10 h-10 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Analyzing your resume with AI...
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Extracting technical stack, academic background, and competencies
                      </p>
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <ParsingProgress />
                      <p className="text-[11px] text-indigo-700 font-medium flex items-center justify-center gap-1.5">
                        <Logo className="w-3.5 h-3.5 animate-spin" /> Deep profile synthesis in progress...
                      </p>
                    </div>
                  </div>
                ) : (
                  <ProgressUpload
                    maxFiles={1}
                    multiple={false}
                    accept=".pdf"
                    maxSize={5 * 1024 * 1024}
                    title="Upload your resume (PDF)"
                    description="Drag and drop your PDF resume or click to select"
                    onFilesChange={(files) => {
                      if (files.length > 0 && (files[0].file || files[0] instanceof File)) {
                        setResumeFile(files[0].file || files[0]);
                      } else {
                        setResumeFile(null);
                      }
                    }}
                  />
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Skills</label>
                  <Input 
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                    placeholder="e.g. React, Node.js, Python"
                  />
                  <p className="text-xs text-slate-500">Separate multiple entries with commas</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Languages</label>
                  <Input 
                    value={formData.languages}
                    onChange={(e) => setFormData({...formData, languages: e.target.value})}
                    placeholder="e.g. English, Spanish"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Project Types</label>
                  <Input 
                    value={formData.projectTypes}
                    onChange={(e) => setFormData({...formData, projectTypes: e.target.value})}
                    placeholder="e.g. Full-Stack Web App, API Service"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Certifications</label>
                  <Input 
                    value={formData.certifications}
                    onChange={(e) => setFormData({...formData, certifications: e.target.value})}
                    placeholder="e.g. AWS Cloud Practitioner"
                  />
                </div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3 mt-4">
                  <GraduationCap className="w-5 h-5 text-[#4CAF50]" />
                  <p className="text-sm text-green-900 font-medium">
                    Profile ready to be saved!
                  </p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 py-2">
                {!assessment && !isGenerating && !scores && (
                  <div className="text-center space-y-4 py-4">
                    <Logo className="w-16 h-16 mx-auto" />
                    <h3 className="text-lg font-semibold text-slate-900">Verify Your Skills with AI</h3>
                    
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-left mx-auto max-w-lg shadow-sm">
                      <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Assessment Information
                      </h4>
                      <p className="text-sm text-indigo-800 mb-4 bg-white p-3 rounded-md border border-indigo-50">
                        {resumeFile 
                          ? "Based on the deep profile we extracted from your resume, you will be assessed on the core skills identified."
                          : "Based on the skills you manually entered, you will be assessed on your declared proficiencies."}
                      </p>
                      <ul className="text-sm text-indigo-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <Clock className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
                          <span><strong>Timed Assessment:</strong> You will have 2 minutes per skill. The test auto-submits when time runs out.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-indigo-600" />
                          <span><strong>Anti-Cheating:</strong> Copy-pasting is strictly disabled. Attempts are flagged and blocked.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Logo className="w-4 h-4 mt-0.5 shrink-0" />
                          <span><strong>Contextual MCQs:</strong> Questions are generated live and tailored to your specific profile.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                      <Button variant="outline" onClick={handleFinishOnboarding}>
                        Skip for now
                      </Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={generateAssessment}>
                        Start Timed Assessment
                      </Button>
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-12 space-y-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-sm font-medium text-slate-700">Generating personalized assessment...</p>
                  </div>
                )}

                {assessment && !scores && (
                  <div 
                    className="fixed inset-0 z-50 bg-slate-50 flex flex-col"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' fill='%23000000' fill-opacity='0.03' font-size='18' font-weight='bold' font-family='sans-serif' text-anchor='middle' transform='rotate(-45 150 150)'%3E${encodeURIComponent(user?.email || 'Candidate')}%3C/text%3E%3C/svg%3E")`
                    }}
                  >
                    {/* Tab Switch Full Screen Warning */}
                    {showTabWarning && (
                      <div className="absolute inset-0 z-[100] bg-red-950 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
                        <h1 className="text-5xl font-black text-white tracking-tight mb-4">TAB SWITCH DETECTED</h1>
                        <p className="text-2xl text-red-200 mb-2 font-medium">Navigating away from the assessment is strictly prohibited.</p>
                        <p className="text-red-400 font-mono text-lg mb-12 bg-red-900/50 px-6 py-2 rounded-lg">
                          Infraction logged. A 10-point penalty will be applied.
                        </p>
                        <Button 
                          size="lg"
                          className="bg-red-600 hover:bg-red-500 text-white border-none h-14 px-8 text-lg rounded-full"
                          onClick={() => setShowTabWarning(false)}
                        >
                          I understand. Return to Assessment
                        </Button>
                      </div>
                    )}

                    {/* Sticky Header with Timer */}
                    <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm px-8">
                      <div className="flex items-center gap-2">
                        <Logo className="w-6 h-6" />
                        <h2 className="text-lg font-bold text-slate-900">AI Skill Assessment</h2>
                      </div>
                      <div className="flex items-center gap-6">
                        {showPasteWarning && (
                          <div className="animate-pulse bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            ⚠️ Flagged: Tab Switch / Paste Blocked
                          </div>
                        )}
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-mono text-lg font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                          <Clock className="w-5 h-5" />
                          {formatTime(timeLeft)}
                        </div>
                        <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8" 
                          onClick={submitAssessment}
                          disabled={isEvaluating}
                        >
                          {isEvaluating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                          Submit Exam
                        </Button>
                      </div>
                    </div>

                    {/* Questions Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                      <div className="max-w-4xl mx-auto space-y-8 pb-12">
                        {assessment.map((skillBlock, sIdx) => (
                          <div key={sIdx} className="border border-slate-200 rounded-xl p-6 space-y-6 bg-white shadow-sm">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Logo className="w-4 h-4" />
                              </div>
                              <h4 className="text-lg font-bold text-slate-900">{skillBlock.skill}</h4>
                            </div>
                            
                            {skillBlock.questions.map((q, qIdx) => {
                              const key = `${skillBlock.skill}_${q.type}`;
                              return (
                                <div key={qIdx} className="space-y-4">
                                  <p className="text-base font-medium text-slate-800">
                                    <span className="text-indigo-600 font-bold mr-2 text-lg">Q{qIdx + 1}.</span> {q.question}
                                  </p>
                                  
                                  {q.type === 'mcq' && q.options && (
                                    <div className="space-y-3 pl-8">
                                      {q.options.map((opt, oIdx) => (
                                        <label key={oIdx} className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                          <input 
                                            type="radio" 
                                            name={key}
                                            value={opt}
                                            checked={answers[key] === opt}
                                            onChange={(e) => setAnswers({...answers, [key]: e.target.value})}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                                          />
                                          <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium">{opt}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}

                                  {q.type === 'practical' && (
                                    <div className="pl-8 pt-2">
                                      <Textarea 
                                        placeholder="Write your answer or code snippet here... (Pasting is disabled)"
                                        className="font-mono text-sm h-40 bg-slate-50 border-slate-200 focus:bg-white"
                                        value={answers[key] || ''}
                                        onChange={(e) => setAnswers({...answers, [key]: e.target.value})}
                                        onCopy={handlePreventCheating}
                                        onPaste={handlePreventCheating}
                                        onCut={handlePreventCheating}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {scores && (
                  <div className="text-center space-y-6 py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-[#4CAF50]" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">Assessment Complete!</h3>
                    <div className="max-w-sm mx-auto space-y-3">
                      {Object.entries(scores).map(([skill, score]) => (
                        <div key={skill} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="font-medium text-slate-700">{skill}</span>
                          <span className="font-bold text-indigo-600">{score}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 max-w-md mx-auto pt-2">
                      These verified scores have been added to your profile and will boost your visibility to recruiters.
                    </p>
                    <div className="pt-4">
                      <Button className="bg-[#4CAF50] hover:bg-green-600 text-white px-8" onClick={handleFinishOnboarding}>
                        Go to Dashboard
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
              {(step === 2 || step === 3) && (
                <Button 
                  variant="outline" 
                  onClick={handlePrev}
                  disabled={isParsing}
                  className="text-slate-600"
                >
                  Back
                </Button>
              )}
              {step === 1 && <div />}
              
              {step === 1 && (
                <Button 
                  onClick={handleNext}
                  className="bg-[#4CAF50] hover:bg-green-600 text-white"
                  disabled={!formData.institute || !formData.course}
                >
                  Continue
                </Button>
              )}
              
              {step === 2 && (
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setResumeFile(null);
                      setErrorMsg('');
                      setStep(3);
                    }}
                    disabled={isParsing}
                    className="text-slate-600"
                  >
                    Skip & Enter Manually
                  </Button>
                  <Button 
                    onClick={uploadAndParseResume}
                    className="bg-[#4CAF50] hover:bg-green-600 text-white"
                    disabled={!resumeFile || isParsing}
                  >
                    {isParsing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</>
                    ) : (
                      "Upload & Parse"
                    )}
                  </Button>
                </div>
              )}

              {step === 3 && (
                <Button 
                  onClick={saveProfileData}
                  className="bg-[#4CAF50] hover:bg-green-600 text-white"
                >
                  Save & Continue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
