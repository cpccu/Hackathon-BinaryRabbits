import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy, query } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CampusEvent } from '@/types';
import { toast } from 'sonner';
import { ImagePlus, Trash2, Edit, Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react';

export function ManageEventsPage() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    clubId: '',
    venue: '',
    regStartDate: '',
    regEndDate: '',
    eventDate: '',
    eventTime: '10:00',
    eventType: 'other',
    capacity: 100,
    bannerUrl: '',
    isPayable: false,
    ticketPrice: 0
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CampusEvent)));
    } catch (e) {
      toast.error('Failed to load events');
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setFormData(prev => ({ ...prev, bannerUrl: compressedBase64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toLocalDateString = (date: Date) => {
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toLocalTimeString = (date: Date) => {
    if (isNaN(date.getTime())) return '10:00';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleEdit = (ev: CampusEvent) => {
    try {
      setEditingId(ev.id);
      
      let startObj = new Date();
      if (ev.startTime) {
        if (typeof (ev.startTime as any).toDate === 'function') {
          startObj = (ev.startTime as any).toDate();
        } else if (ev.startTime instanceof Date) {
          startObj = ev.startTime;
        } else {
          startObj = new Date(ev.startTime as any);
        }
      }

      let regObj = startObj;
      if (ev.registrationDeadline) {
        if (typeof (ev.registrationDeadline as any).toDate === 'function') {
          regObj = (ev.registrationDeadline as any).toDate();
        } else if (ev.registrationDeadline instanceof Date) {
          regObj = ev.registrationDeadline;
        } else {
          regObj = new Date(ev.registrationDeadline as any);
        }
      }
      
      setFormData({
        title: ev.title || '',
        department: ev.tags?.[0] || '',
        clubId: ev.clubId || '',
        venue: ev.venue || '',
        regStartDate: toLocalDateString(regObj),
        regEndDate: toLocalDateString(regObj),
        eventDate: toLocalDateString(startObj),
        eventTime: toLocalTimeString(startObj),
        eventType: ev.eventType || 'other',
        capacity: ev.capacity || 100,
        bannerUrl: ev.bannerUrl || '',
        isPayable: ev.isPayable || false,
        ticketPrice: ev.ticketPrice || 0
      });
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (error) {
      console.error("Error setting edit data:", error);
      toast.error('Failed to load event details for editing');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', department: '', clubId: '', venue: '', regStartDate: '', regEndDate: '', eventDate: '', eventTime: '10:00', eventType: 'other', capacity: 100, bannerUrl: '', isPayable: false, ticketPrice: 0 });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime}`);
      const regStart = formData.regStartDate ? new Date(formData.regStartDate) : new Date();
      const regEnd = formData.regEndDate ? new Date(formData.regEndDate) : eventDateTime;

      const eventData = {
        title: formData.title,
        description: `Hosted by ${formData.clubId} (${formData.department})`,
        clubId: formData.clubId,
        venue: formData.venue,
        eventType: formData.eventType || "other",
        status: 'published',
        capacity: Number(formData.capacity) || 100,
        bannerUrl: formData.bannerUrl,
        isPayable: formData.isPayable,
        ticketPrice: formData.isPayable ? Number(formData.ticketPrice) : 0,
        tags: [formData.department, formData.clubId],
        startTime: Timestamp.fromDate(eventDateTime),
        endTime: Timestamp.fromDate(new Date(eventDateTime.getTime() + 2 * 3600000)),
        registrationDeadline: Timestamp.fromDate(regEnd),
        createdBy: 'admin',
        updatedAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'events', editingId), eventData);
        toast.success('Event updated successfully!');
      } else {
        await addDoc(collection(db, 'events'), { ...eventData, createdAt: Timestamp.now() });
        toast.success('Event created successfully!');
      }
      
      handleCancelEdit();
      fetchEvents();
    } catch (e) {
      toast.error(`Failed to ${editingId ? 'update' : 'create'} event`);
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      toast.success('Event deleted');
      fetchEvents();
    } catch (e) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 bg-background min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Manage Events</h1>
        <p className="text-muted-foreground mt-1">Create, update, and manage campus events.</p>
      </div>
      
      {/* Create/Edit Event Form */}
      <div ref={formRef} className="bg-card text-card-foreground border border-border p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{editingId ? 'Update Event' : 'Create New Event'}</h2>
          {editingId && (
            <Button variant="ghost" onClick={handleCancelEdit}>Cancel Edit</Button>
          )}
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input required placeholder="e.g. Annual Tech Fest" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="bg-muted border-none" />
            </div>
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Select value={formData.department} onValueChange={val => setFormData({ ...formData, department: val })}>
                <SelectTrigger className="bg-muted border-none"><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {['CSE', 'EEE', 'ME', 'Pharmacy', 'English', 'BBA', 'Civil', 'Textile'].map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Club / Organizer</Label>
              <Select value={formData.clubId} onValueChange={val => setFormData({ ...formData, clubId: val })}>
                <SelectTrigger className="bg-muted border-none"><SelectValue placeholder="Select Club" /></SelectTrigger>
                <SelectContent>
                  {['CPCCU', 'Cultural Club', 'Dance Club', 'Robotics Club', 'Partex Club', 'Debate Club'].map(club => <SelectItem key={club} value={club}>{club}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={formData.eventType} onValueChange={val => setFormData({ ...formData, eventType: val })}>
                <SelectTrigger className="bg-muted border-none"><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contest">Contest</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Venue / Location</Label>
              <Input required placeholder="e.g. Auditorium" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="bg-muted border-none" />
            </div>
            <div className="space-y-2">
              <Label>Registration Start Date</Label>
              <Input type="date" required value={formData.regStartDate} onChange={e => setFormData({ ...formData, regStartDate: e.target.value })} className="bg-muted border-none" />
            </div>
            <div className="space-y-2">
              <Label>Registration End Date</Label>
              <Input type="date" required value={formData.regEndDate} onChange={e => setFormData({ ...formData, regEndDate: e.target.value })} className="bg-muted border-none" />
            </div>
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Input type="date" required value={formData.eventDate} onChange={e => setFormData({ ...formData, eventDate: e.target.value })} className="bg-muted border-none" />
            </div>
            <div className="space-y-2">
              <Label>Event Time</Label>
              <Input type="time" required value={formData.eventTime} onChange={e => setFormData({ ...formData, eventTime: e.target.value })} className="bg-muted border-none" />
            </div>
            <div className="space-y-2">
              <Label>Event Type (Payment)</Label>
              <Select value={formData.isPayable ? 'payable' : 'free'} onValueChange={val => setFormData({ ...formData, isPayable: val === 'payable' })}>
                <SelectTrigger className="bg-muted border-none"><SelectValue placeholder="Free / Payable" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free Event</SelectItem>
                  <SelectItem value="payable">Payable (Requires Ticket)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.isPayable && (
              <div className="space-y-2">
                <Label>Ticket Price (৳)</Label>
                <Input type="number" required={formData.isPayable} placeholder="e.g. 500" value={formData.ticketPrice} onChange={e => setFormData({ ...formData, ticketPrice: Number(e.target.value) })} className="bg-muted border-none" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Capacity (Max Participants)</Label>
              <Input type="number" required placeholder="e.g. 100" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} className="bg-muted border-none" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>Event Image (Banner)</Label>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <Button type="button" variant="outline" className="w-full bg-muted border-none justify-start text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="w-4 h-4 mr-2" /> 
                {formData.bannerUrl ? 'Image Selected (Click to change)' : 'Upload Image'}
              </Button>
            </div>
          </div>
          
          {formData.bannerUrl && (
            <div className="mt-4 rounded-lg overflow-hidden border border-border h-48 w-full max-w-md bg-muted">
              <img src={formData.bannerUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground px-8">
              {saving ? 'Saving...' : (editingId ? 'Update Event' : 'Create Event')}
            </Button>
          </div>
        </form>
      </div>

      {/* Events List */}
      <div>
        <h2 className="text-xl font-bold mb-4">Existing Events</h2>
        {loading ? <p className="text-muted-foreground">Loading events...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(ev => (
              <div key={ev.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="h-32 bg-muted relative">
                  {ev.bannerUrl ? (
                    <img src={ev.bannerUrl} alt={ev.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-md" onClick={() => handleEdit(ev)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full shadow-md" onClick={() => handleDelete(ev.id!)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-foreground text-lg line-clamp-1 flex-1">{ev.title}</h3>
                    {ev.isPayable ? (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded ml-2">৳{ev.ticketPrice}</span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded ml-2">FREE</span>
                    )}
                  </div>
                  <p className="text-sm text-primary font-medium mt-1">{ev.clubId}</p>
                  
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{ev.startTime.toDate().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-muted-foreground col-span-full">No events found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
