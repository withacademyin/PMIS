'use client';

import React, { useState } from 'react';
import { Calendar, Video, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

export function ScheduleModal({ open, onOpenChange, application, onScheduled }) {
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLink, setInterviewLink] = useState('https://meet.google.com/abc-defg-hij');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!application?.id || submitting) return;

    if (!interviewDate) {
      setError('Please select an interview date and time.');
      return;
    }

    if (!interviewLink || !interviewLink.trim()) {
      setError('Please provide a meeting link (e.g. Google Meet or Zoom).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.updateApplicationStatus(application.id, {
        status: 'INTERVIEW_SCHEDULED',
        interviewDate: new Date(interviewDate).toISOString(),
        interviewLink: interviewLink.trim(),
      });

      if (res.success && res.data) {
        if (onScheduled) {
          onScheduled(res.data);
        }
        onOpenChange(false);
      } else {
        throw new Error('Failed to schedule interview.');
      }
    } catch (err) {
      setError(err.message || 'Error scheduling interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 border border-purple-200 text-purple-700">
              <Calendar className="h-4 w-4" />
            </div>
            <DialogTitle>Schedule Technical Interview</DialogTitle>
          </div>
          <DialogDescription>
            {application?.student?.fullName
              ? `Inviting candidate: ${application.student.fullName} (${application.student.college})`
              : 'Set the date, time, and meeting link for this candidate.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 mb-4 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Interview Date & Time
            </label>
            <Input
              type="datetime-local"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              disabled={submitting}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Video className="h-3.5 w-3.5 text-slate-400" />
              Meeting URL
            </label>
            <Input
              type="url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              value={interviewLink}
              onChange={(e) => setInterviewLink(e.target.value)}
              disabled={submitting}
              className="text-xs font-mono"
              required
            />
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
            <Button
              type="submit"
              disabled={submitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching Invite...</span>
                </>
              ) : (
                'Confirm & Dispatch Invite'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ScheduleModal;
