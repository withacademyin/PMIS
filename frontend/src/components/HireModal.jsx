import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function HireModal({ open, onOpenChange, application, onHired }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!application) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.createInternship({
        applicationId: application.id,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
      });

      if (res.success) {
        onHired(res.data);
        onOpenChange(false);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to hire candidate.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Hire {application?.student?.fullName || 'Candidate'}
          </DialogTitle>
        </DialogHeader>

        {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">Start Date</label>
            <Input 
              type="date" 
              required 
              value={formData.startDate}
              onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              className="h-8 text-xs shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">End Date (Optional)</label>
            <Input 
              type="date" 
              value={formData.endDate}
              onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              className="h-8 text-xs shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="h-7 text-[11px] shadow-none">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="h-7 text-[11px] bg-slate-900 text-white hover:bg-slate-800 shadow-none">
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Confirm Hire
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
