import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function KraModal({ open, onOpenChange, internships, selectedDate, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    internshipId: '',
    title: '',
    description: '',
    startDate: '',
    dueDate: '',
  });

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        internshipId: internships?.[0]?.id || '',
        dueDate: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
    }
  }, [open, selectedDate, internships]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.internshipId) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.createKRA(formData.internshipId, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate || new Date().toISOString(),
        dueDate: formData.dueDate,
        priority: 'MEDIUM'
      });

      if (res.success) {
        onCreated();
        onOpenChange(false);
        setFormData({ title: '', description: '', startDate: '', dueDate: '' });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to create KRA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Add KRA / Task
          </DialogTitle>
        </DialogHeader>

        {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">Intern</label>
            <select
              required
              value={formData.internshipId}
              onChange={(e) => setFormData({...formData, internshipId: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300"
            >
              <option value="" disabled>Select an intern...</option>
              {internships?.map(internship => (
                <option key={internship.id} value={internship.id}>
                  {internship.application?.student?.fullName || internship.application?.student?.user?.name || 'Unknown'} - {internship.application?.job?.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">Title</label>
            <Input 
              type="text" 
              required 
              placeholder="e.g. Complete User Authentication"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="h-8 text-xs shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">Description</label>
            <textarea 
              required 
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
              placeholder="Describe the task..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-600">Due Date</label>
            <Input 
              type="date" 
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="h-8 text-xs shadow-none border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading} className="h-7 text-[11px] shadow-none">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="h-7 text-[11px] bg-slate-900 text-white hover:bg-slate-800 shadow-none">
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
