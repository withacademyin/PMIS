import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function KraSubmissionModal({ open, onOpenChange, kra, internshipId, onSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    evidenceUrl: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kra || !internshipId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.submitKRAEvidence(internshipId, kra.id, formData);

      if (res.success) {
        onSubmitted();
        onOpenChange(false);
        setFormData({ evidenceUrl: '', notes: '' });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit evidence.');
    } finally {
      setLoading(false);
    }
  };

  const markInProgress = async () => {
    if (!kra || !internshipId) return;
    setLoading(true);
    try {
      await api.updateKRAStatus(internshipId, kra.id, { status: 'IN_PROGRESS' });
      onSubmitted();
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {kra?.title || 'KRA'}
          </DialogTitle>
        </DialogHeader>

        {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <div className="text-xs text-slate-600 mb-2">
          {kra?.description}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">Evidence URL (e.g. GitHub PR, Figma, Drive)</label>
            <Input 
              type="url" 
              required 
              placeholder="https://..."
              value={formData.evidenceUrl}
              onChange={(e) => setFormData({...formData, evidenceUrl: e.target.value})}
              className="h-8 text-xs shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">Notes (Optional)</label>
            <textarea 
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
              placeholder="Any details for your recruiter..."
            />
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between">
            {kra?.status === 'PENDING' || kra?.status === 'NOT_STARTED' ? (
              <Button type="button" variant="outline" size="sm" onClick={markInProgress} disabled={loading} className="h-7 text-[11px] text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-none">
                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Mark In Progress
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="h-7 text-[11px] shadow-none">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="h-7 text-[11px] bg-slate-900 text-white hover:bg-slate-800 shadow-none">
                {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Submit Work
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
