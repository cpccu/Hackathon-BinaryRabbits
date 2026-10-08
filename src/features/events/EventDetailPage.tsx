import { Timestamp } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ArrowLeft, Calendar, MapPin, Users, Share2, BookmarkPlus, CheckCircle, QrCode } from 'lucide-react';
import { CampusEvent, EventRegistration } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { useAuth } from '@/hooks/useAuth';
import { deleteDoc, updateDoc, arrayUnion, arrayRemove, getCountFromServer } from 'firebase/firestore';

export function EventDetailPage() {
  const { eventId: id } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<CampusEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [regCount, setRegCount] = useState(0);
  const [regFormOpen, setRegFormOpen] = useState(false);
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [savedEventId, setSavedEventId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'events', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const evData = { id: docSnap.id, ...docSnap.data() } as CampusEvent;
          setEvent(evData);
          if (user?.followedClubIds?.includes(evData.clubId)) setIsFollowing(true);
          
          // Check if already registered
          if (user) {
            const regRef = collection(db, 'eventRegistrations');
            const countQ = query(regRef, where('eventId', '==', id));
            const countSnap = await getCountFromServer(countQ);
            setRegCount(countSnap.data().count);
            
            const q = query(regRef, where('eventId', '==', id), where('userId', '==', user.uid));
            const regSnap = await getDocs(q);
            if (!regSnap.empty) {
              const regData = regSnap.docs[0].data() as EventRegistration;
              setRegistration(regData);
              QRCode.toDataURL(regData.qrToken).then(url => setQrCodeUrl(url));
            }

            const savedRef = collection(db, 'savedEvents');
            const savedQ = query(savedRef, where('eventId', '==', id), where('userId', '==', user.uid));
            const savedSnap = await getDocs(savedQ);
            if (!savedSnap.empty) {
              setSavedEventId(savedSnap.docs[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (event?.isPayable && (!bkashNumber || !trxId)) {
      toast.error('Please complete the payment details');
      return;
    }
    if (!event || !id) return;
    setRegistering(true);
    try {
      if (!user) {
        toast.error('You must be logged in to register.');
        return;
      }
      const qrToken = `qr-${id}-${user.uid}-${Date.now()}`;
      
      const newReg: Omit<EventRegistration, 'id'> = {
        eventId: id,
        userId: user.uid,
        qrToken,
        attendanceStatus: 'registered',
        registeredAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'eventRegistrations'), newReg);
      const fullReg = { id: docRef.id, ...newReg } as EventRegistration;
      setRegistration(fullReg);
      
      const url = await QRCode.toDataURL(qrToken);
      setQrCodeUrl(url);
      
      toast.success('Successfully registered for event!');
      setRegFormOpen(false);
      setRegCount(prev => prev + 1);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleDownloadIcs = () => {
    if (!event) return;
    const dtStart = event.startTime.toDate().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtEnd = event.endTime.toDate().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${event.title}
LOCATION:${event.venue}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const handleFollowClub = async () => {
    if (!user || !event) return;
    try {
      // Using local state for toggle
      const userRef = doc(db, 'users', user.uid);
      if (isFollowing) {
        await updateDoc(userRef, {
          followedClubIds: arrayRemove(event.clubId)
        });
        toast.success(`Unfollowed ${event.clubId}`);
        setIsFollowing(false);
        // We'd ideally update local user state here, but for hackathon a refresh or next login works
      } else {
        await updateDoc(userRef, {
          followedClubIds: arrayUnion(event.clubId)
        });
        toast.success(`Followed ${event.clubId}`);
        setIsFollowing(true);
      }
    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };

  const handleSaveForLater = async () => {
    if (!user || !event) return;
    try {
      if (savedEventId) {
        await deleteDoc(doc(db, 'savedEvents', savedEventId));
        setSavedEventId(null);
        toast.success('Removed from saved events');
      } else {
        const docRef = await addDoc(collection(db, 'savedEvents'), {
          eventId: event.id,
          userId: user.uid,
          savedAt: Timestamp.now()
        });
        setSavedEventId(docRef.id);
        toast.success('Event saved for later');
      }
    } catch (e) {
      toast.error('Failed to update saved events');
    }
  };

  if (loading) return <LoadingState variant="full" />;
  if (!event) return <ErrorState title="Event not found" message="This event may have been removed or doesn't exist." />;

  const isFull = event.capacity !== undefined && regCount >= event.capacity;

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <Button variant="ghost" className="mb-4" asChild>
        <Link to="/events"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Events</Link>
      </Button>

      {/* Banner */}
      <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden bg-muted">
        {event.bannerUrl ? (
          <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-blue-300 opacity-50" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex gap-2 mb-3">
              <Badge>{event.eventType.toUpperCase()}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
            
            <div className="flex items-center gap-4 py-4 border-y">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {/* Club Icon Placeholder */} C
              </div>
              <div>
                <p className="font-semibold">{event.clubId}</p>
                <p className="text-sm text-muted-foreground">Organizer</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={handleFollowClub}>{isFollowing ? "Unfollow" : "Follow"}</Button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">{formatDateTime(event.startTime)}</p>
                    <p className="text-sm text-muted-foreground">to {formatDateTime(event.endTime)}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                </div>

                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Capacity</p>
                      <p className="text-sm text-muted-foreground">{regCount} / {event.capacity} registered</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                {registration ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                        <CheckCircle className="w-4 h-4 mr-2" /> View My QR Pass
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-center">Your Event Pass</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                          {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />}
                        </div>
                        <div className="text-center">
                          <h4 className="font-bold text-lg">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">Show this QR code at the entrance</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  
                  <Dialog open={regFormOpen} onOpenChange={setRegFormOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg" disabled={isFull}>
                        {isFull ? 'Event Full' : 'Register Now'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Register for {event.title}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRegister} className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input value={user?.name || ''} disabled className="bg-muted border-none" />
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Input value={user?.department || ''} disabled className="bg-muted border-none" />
                        </div>
                        
                        {event.isPayable && (
                          <div className="mt-6 p-4 border border-border rounded-lg bg-card space-y-4">
                            <div className="flex justify-between items-center border-b border-border pb-2">
                              <span className="font-semibold text-foreground">Ticket Price</span>
                              <span className="text-lg font-bold text-green-600">৳{event.ticketPrice}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mb-4">
                              <p className="font-medium text-primary mb-1">Payment Instructions:</p>
                              1. Go to your bKash Menu<br/>
                              2. Select <strong>Send Money</strong><br/>
                              3. Enter Number: <strong>01712345678</strong><br/>
                              4. Enter Amount: <strong>৳{event.ticketPrice}</strong><br/>
                              5. Provide the details below
                            </div>
                            <div className="space-y-2">
                              <Label>Your bKash Number</Label>
                              <Input required placeholder="01XXXXXXXXX" value={bkashNumber} onChange={e => setBkashNumber(e.target.value)} className="bg-muted border-none" />
                            </div>
                            <div className="space-y-2">
                              <Label>Transaction ID (TrxID)</Label>
                              <Input required placeholder="e.g. 8N3JX9R" value={trxId} onChange={e => setTrxId(e.target.value)} className="bg-muted border-none" />
                            </div>
                          </div>
                        )}
                        
                        <Button type="submit" className="w-full mt-4" disabled={registering}>
                          {registering ? 'Processing...' : 'Confirm Registration'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleDownloadIcs}>
              <Calendar className="w-4 h-4 mr-2" /> Add to Calendar
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleSaveForLater}>
              <BookmarkPlus className={`w-4 h-4 mr-2 ${savedEventId ? 'fill-primary' : ''}`} /> 
              {savedEventId ? 'Saved' : 'Save for Later'}
            </Button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
