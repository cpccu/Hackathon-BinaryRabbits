import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, doc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { CampusEvent } from '@/types';
import { Search, MapPin, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatTime } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function EventsPage() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedEventIds, setSavedEventIds] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClub, setFilterClub] = useState('all-clubs');
  const [filterType, setFilterType] = useState('all-types');
  const { user } = useAuth();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsRef = collection(db, 'events');
      let q = query(eventsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CampusEvent)).filter(e => e.status === 'published');

      if (user) {
        // Fetch saved events
        const savedRef = collection(db, 'savedEvents');
        const savedQ = query(savedRef, where('userId', '==', user.uid));
        const savedSnap = await getDocs(savedQ);
        const savedMap: Record<string, string> = {};
        savedSnap.docs.forEach(d => {
          savedMap[d.data().eventId] = d.id;
        });
        setSavedEventIds(savedMap);

        // Filter based on tab
        if (activeTab === 'my') {
          const regRef = collection(db, 'eventRegistrations');
          const regQ = query(regRef, where('userId', '==', user.uid));
          const regSnap = await getDocs(regQ);
          const registeredIds = regSnap.docs.map(d => d.data().eventId);
          fetchedEvents = fetchedEvents.filter(ev => registeredIds.includes(ev.id));
        } else if (activeTab === 'saved') {
          fetchedEvents = fetchedEvents.filter(ev => savedMap[ev.id!]);
        }
      }

      // Apply dropdown filters
      if (filterClub !== 'all-clubs') {
        fetchedEvents = fetchedEvents.filter(ev => ev.clubId.toLowerCase() === filterClub.toLowerCase());
      }
      if (filterType !== 'all-types') {
        fetchedEvents = fetchedEvents.filter(ev => ev.eventType.toLowerCase() === filterType.toLowerCase());
      }
      if (searchQuery) {
        fetchedEvents = fetchedEvents.filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase()));
      }

      setEvents(fetchedEvents);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error fetching events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab, filterClub, filterType, user]);

  const toggleSave = async (eventId: string) => {
    if (!user) {
      toast.error('You must be logged in to save events.');
      return;
    }
    const savedDocId = savedEventIds[eventId];
    try {
      if (savedDocId) {
        await deleteDoc(doc(db, 'savedEvents', savedDocId));
        setSavedEventIds(prev => {
          const newMap = { ...prev };
          delete newMap[eventId];
          return newMap;
        });
        toast.success('Removed from saved events');
      } else {
        const docRef = await addDoc(collection(db, 'savedEvents'), {
          eventId,
          userId: user.uid,
          savedAt: Timestamp.now()
        });
        setSavedEventIds(prev => ({ ...prev, [eventId]: docRef.id }));
        toast.success('Event saved for later');
      }
      if (activeTab === 'saved') {
        fetchEvents(); // Refresh if on saved tab
      }
    } catch (e) {
      toast.error('Failed to update saved events');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 bg-background min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Events</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-12 p-0 space-x-8">
          <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-medium text-muted-foreground">All Events</TabsTrigger>
          <TabsTrigger value="my" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-medium text-muted-foreground">My Events</TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-medium text-muted-foreground">Saved Events</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Select value={filterClub} onValueChange={setFilterClub}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card text-card-foreground border-border">
                <SelectValue placeholder="All Clubs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-clubs">All Clubs</SelectItem>
                {['CPCCU', 'Cultural Club', 'Dance Club', 'Robotics Club', 'Partex Club', 'Debate Club'].map(club => <SelectItem key={club} value={club}>{club}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px] bg-card text-card-foreground border-border">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="contest">Contest</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search events..." 
                className="pl-9 w-full bg-card text-card-foreground border-border" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchEvents()}
              />
            </div>
            
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8" onClick={fetchEvents}>Search</Button>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex flex-col sm:flex-row bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                <div className="sm:w-64 h-40 sm:h-auto bg-muted flex-shrink-0 relative">
                  <img src={event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"} alt={event.title} className="w-full h-full object-cover" />
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        Hosted by <span className="font-semibold text-foreground/90">{event.clubId}</span>
                      </p>
                    </div>
                    <button className="text-muted-foreground hover:text-primary" onClick={() => toggleSave(event.id!)}>
                      {savedEventIds[event.id!] ? <BookmarkCheck className="w-5 h-5 fill-primary text-primary" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>{event.startTime.toDate().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-accent/10 text-accent rounded-md uppercase tracking-wider">{event.eventType}</span>
                    <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-6">
                      <Link to={`/events/${event.id}`}>Register</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {events.length === 0 && !loading && (
              <div className="text-center py-20 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No events found.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
