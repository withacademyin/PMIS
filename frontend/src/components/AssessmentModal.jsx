'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export function AssessmentModal({ open, onOpenChange, application, job, onAssessmentComplete }) {
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open && application?.id) {
      fetchQuestions();
      setResult(null);
      setAnswers({});
      setError(null);
    }
  }, [open, application?.id]);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    setError(null);
    try {
      const res = await api.getApplicationQuestions(application.id);
      if (res.success && Array.isArray(res.data?.questions)) {
        setQuestions(res.data.questions);
        const initialAnswers = {};
        res.data.questions.forEach((q, idx) => {
          initialAnswers[idx] = '';
        });
        setAnswers(initialAnswers);
      } else {
        throw new Error('Failed to load screening questions.');
      }
    } catch (err) {
      setError(err.message || 'Unable to fetch questions. Please check backend connection.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerChange = (idx, value) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const formattedPayload = questions.map((q, idx) => ({
      question: q,
      answer: (answers[idx] || '').trim(),
    }));

    // Ensure at least one response provided
    const hasAnyAnswer = formattedPayload.some((item) => item.answer.length > 0);
    if (!hasAnyAnswer) {
      setError('Please provide responses to the screening questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.evaluateApplicationAI(application.id, formattedPayload);
      if (res.success && res.data) {
        setResult(res.data);
        if (onAssessmentComplete) {
          onAssessmentComplete(res.data);
        }
      } else {
        throw new Error('Failed to evaluate answers.');
      }
    } catch (err) {
      setError(err.message || 'Evaluation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="w-[40vw] max-w-[40vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Technical Screening</DialogTitle>
          <DialogDescription>
            {job ? `Role: ${job.title} at ${job.recruiter?.companyName || 'TechNova'}` : 'Answer the generated screening questions below.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 mb-4 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {loadingQuestions ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <div className="text-xs text-slate-500 font-medium">
              Generating tailored questions with OpenAI...
            </div>
          </div>
        ) : result ? (
          /* Assessment Evaluation Results */
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50/75 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  AI Screening Result
                </span>
                <Badge
                  variant={result.aiScore >= 70 ? 'success' : 'warning'}
                  className="font-mono text-xs px-2.5 py-0.5"
                >
                  Score: {result.aiScore}/100
                </Badge>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-700">Evaluation Feedback:</span>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-md border border-slate-200">
                  {result.aiFeedback || 'Candidate responses demonstrated foundational technical reasoning.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-500">Updated Status:</span>
                <Badge variant={result.status === 'SHORTLISTED' ? 'info' : 'secondary'}>
                  {result.status}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Close & View Application
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Questions Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="space-y-1.5 rounded-lg border border-slate-200 p-3.5 bg-slate-50/50">
                  <label className="block text-xs font-medium text-slate-900 leading-snug">
                    <span className="inline-block font-mono text-indigo-600 mr-1.5">Q{idx + 1}.</span>
                    {q}
                  </label>
                  <Textarea
                    placeholder="Type your technical answer here..."
                    rows={3}
                    value={answers[idx] || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    disabled={submitting}
                    className="text-xs resize-none"
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[140px]">
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Evaluating AI...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Submit for AI Review</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AssessmentModal;
