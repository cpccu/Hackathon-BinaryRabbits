import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { Complaint } from '@/types';
import { Search, Plus, FileText, CheckCircle2, Clock, Activity, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const STATUS_STAGES = [
  { id: 'submitted', label: 'Submitted', icon: Clock },
  { id: 'under_review', label: 'Under Review', icon: Activity },
  { id: 'action_taken', label: 'Action Taken', icon: Flag },
  { id: 'resolved', label: 'Resolved', icon: CheckCircle2 }
];

export function ComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Form
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '', category: 'academic', description: '', location: '', isAnonymous: false
  });

  const fetchComplaints = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, 'complaints');
      let q = query(ref, orderBy('createdAt', 'desc'));
      
      // If student, only fetch theirs. If admin, fetch all.
      if (user.role !== 'admin' && user.role !== 'complaint_manager') {
        q = query(ref, where('studentId', '==', user.uid), orderBy('createdAt', 'desc'));
      }

      const snap = await getDocs(q);
      let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint));

      if (statusFilter !== 'all') fetched = fetched.filter(c => c.status === statusFilter);
      if (categoryFilter !== 'all') fetched = fetched.filter(c => c.category === categoryFilter);

      setComplaints(fetched);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user, statusFilter, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const trackingCode = '#CU' + Math.floor(100000 + Math.random() * 900000);
      
      await addDoc(collection(db, 'complaints'), {
        ...formData,
        studentId: user.uid,
        trackingCode,
        status: 'submitted',
        statusHistory: [{ status: 'submitted', updatedAt: Timestamp.now(), updatedBy: user.uid }],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      toast.success(`Complaint submitted! Tracking ID: ${trackingCode}`);
      setOpen(false);
      setFormData({ subject: '', category: 'academic', description: '', location: '', isAnonymous: false });
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to submit complaint');
    }
  };

  const getStatusIndex = (status: string) => STATUS_STAGES.findIndex(s => s.id === status);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'complaints', id), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      toast.success('Complaint status updated successfully!');
      fetchComplaints();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };


  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Complaint Center</h1>
          <p className="text-muted-foreground mt-1">Submit & track campus issues securely.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className={`bg-red-600 hover:bg-red-700 text-white ${user?.role === 'complaint_manager' ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
              <Plus className="w-4 h-4 mr-2" /> File Complaint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File a New Complaint</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Subject / Title</Label>
                <Input required value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} placeholder="e.g. Fan not working in Room 302" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v=>setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="facility">Facility / Infrastructure</SelectItem>
                      <SelectItem value="administration">Administration</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location (Optional)</Label>
                  <Input value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} placeholder="e.g. Building A, Room 302" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Detailed Description</Label>
                <Textarea required value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Describe the issue clearly..." className="h-32" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="anon" checked={formData.isAnonymous} onChange={e=>setFormData({...formData, isAnonymous: e.target.checked})} className="rounded border-border text-primary focus:ring-primary" />
                <Label htmlFor="anon" className="font-normal text-muted-foreground">Submit anonymously</Label>
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">Submit Complaint</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-card p-4 rounded-xl border border-border">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="academic">Academic</SelectItem>
            <SelectItem value="transport">Transport</SelectItem>
            <SelectItem value="facility">Facility</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="action_taken">Action Taken</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Complaints List */}
      <div className="space-y-6">
        {complaints.map(comp => {
          const currentIndex = getStatusIndex(comp.status);
          
          return (
            <div key={comp.id} className="bg-card p-6 rounded-xl border border-border shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded text-xs">{comp.trackingCode}</span>
                    <span className="text-xs uppercase text-muted-foreground px-2 py-0.5 bg-muted rounded">{comp.category}</span>
                  </div>
                  <h3 className="text-xl font-bold">{comp.subject}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{comp.createdAt.toDate().toLocaleDateString()} {comp.location && `• ${comp.location}`}</p>
                </div>
              </div>
              
              <div className="mb-6 text-sm">
                <p className="whitespace-pre-wrap">{comp.description}</p>
              </div>

              {/* Status Tracking Pipeline */}
              <div className="relative pt-6 mt-6 border-t border-border">
                <div className="absolute top-10 left-4 right-4 h-1 bg-muted rounded-full -z-10">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${(currentIndex / (STATUS_STAGES.length - 1)) * 100}%` }}
                  />
                </div>
                
                <div className="flex justify-between relative z-10">
                  {STATUS_STAGES.map((stage, idx) => {
                    const isCompleted = idx <= currentIndex;
                    const isCurrent = idx === currentIndex;
                    const Icon = stage.icon;
                    return (
                      <div key={stage.id} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-card border-2 border-muted text-muted-foreground'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-semibold ${isCurrent ? 'text-blue-500' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              
              {(user?.role === 'admin' || user?.role === 'complaint_manager') && (
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Admin Action:</span>
                  <Select value={comp.status} onValueChange={(val) => updateStatus(comp.id, val)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs font-semibold">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="action_taken">Action Taken</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            </div>
          );
        })}
        {complaints.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No complaints found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
