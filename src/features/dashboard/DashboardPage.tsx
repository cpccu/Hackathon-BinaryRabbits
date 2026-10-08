import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { CampusEvent, UrgentNotice } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/feedback/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Calendar as CalendarIcon, BookOpen, Bus, Bell, ArrowRight, AlertTriangle, 
  Search, BookMarked, Ticket
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import ROUTINES from '@/data/routines.json';

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'event_manager') {
    return <Navigate to="/admin/events" replace />;
  }
  if (user?.role === 'resource_manager') {
    return <Navigate to="/resources" replace />;
  }
  if (user?.role === 'complaint_manager') {
    return <Navigate to="/complaints" replace />;
  }
  if (user?.role === 'notice_manager') {
    return <Navigate to="/admin/notices" replace />;
  }

  const [urgentNotices, setUrgentNotices] = useState<UrgentNotice[]>([]);
  const [allNotices, setAllNotices] = useState<UrgentNotice[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CampusEvent[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourceCount, setResourceCount] = useState(0);
  const [myEventsCount, setMyEventsCount] = useState(0);

  const savedProfileStr = localStorage.getItem(`cu-profile-${user?.uid}`);
  const profile = savedProfileStr ? JSON.parse(savedProfileStr) : { batch: '', section: '', busRoute: 'none' };


  useEffect(() => {
    if (user?.uid) {
      const fetchMyEvents = async () => {
        try {
          const eventQuery = query(collection(db, 'eventRegistrations'), where('userId', '==', user.uid));
          const eventSnap = await getCountFromServer(eventQuery);
          setMyEventsCount(eventSnap.data().count);
        } catch (e) {}
      };
      fetchMyEvents();
    }
  }, [user?.uid]);

  useEffect(() => {
    const noticesRef = collection(db, 'notices');
    const qNotices = query(noticesRef, where('activeUntil', '>', new Date().toISOString()));
    const unsubNotices = onSnapshot(qNotices, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UrgentNotice));
      docs.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bTime.getTime() - aTime.getTime();
      });
      setAllNotices(docs);
      setUrgentNotices(docs.filter(d => d.severity === 'warning' || d.severity === 'critical'));
    });

    const eventsRef = collection(db, 'events');
    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      const allEvents = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CampusEvent));
      const upcoming = allEvents
        .filter(e => e.status === 'published' && e.startTime && e.startTime.toDate() > new Date())
        .sort((a, b) => a.startTime.toDate().getTime() - b.startTime.toDate().getTime())
        .slice(0, 3);
      setUpcomingEvents(upcoming);
    });

    const lfRef = collection(db, 'lostFoundItems');
    const qLf = query(lfRef, orderBy('createdAt', 'desc'), limit(2));
    const unsubLf = onSnapshot(qLf, (snapshot) => {
      setRecentItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const fetchResCount = async () => {
      try {
        const snap = await getCountFromServer(collection(db, 'resources'));
        setResourceCount(snap.data().count);
      } catch (e) {}
    };
    fetchResCount();

  return () => {
      unsubNotices();
      unsubEvents();
      unsubLf();
    };
  }, []);

  if (loading) return <LoadingState />;

  const hour = new Date().getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';

  // Extract Today's routine
  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };
  const todayName = getDayName();
  
  const routine: any = ROUTINES.find((r: any) => r.batch === profile.batch && r.section === profile.section);
  const todaysClasses = routine?.schedule?.[todayName] || [];

  let nextClass = null;
  if (todaysClasses.length > 0) {
    nextClass = todaysClasses[0];
  }


  const getNextBusInfo = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const schedule = [
      { label: '7:30 AM', mins: 7 * 60 + 30 },
      { label: '1:00 PM', mins: 13 * 60 + 0 },
      { label: '4:30 PM', mins: 16 * 60 + 30 },
    ];
    
    for (let s of schedule) {
      if (currentMins < s.mins) {
        return { timeLabel: s.label, diffMins: s.mins - currentMins };
      }
    }
    // Next day
    return { timeLabel: '7:30 AM (Tomorrow)', diffMins: (24 * 60 - currentMins) + schedule[0].mins };
  };

  const nextBusInfo = getNextBusInfo();
  const busHrs = Math.floor(nextBusInfo.diffMins / 60);
  const busMins = nextBusInfo.diffMins % 60;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{greeting}, {user?.name?.split(' ')[0] || 'User'} <span className="inline-block animate-wave">👋</span></h1>
          <p className="text-muted-foreground mt-1 text-lg">Here's what's happening on your campus today.</p>
        </div>
      </div>

      {nextClass ? (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-blue-800 dark:text-blue-200 text-sm font-medium flex-1">
            <span className="font-bold mr-1">Next Class:</span> {routine?.courses?.[nextClass.course] || nextClass.course} at {nextClass.time} in {nextClass.room || 'TBA'}
          </p>
        </div>
      ) : urgentNotices.length > 0 ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-red-800 dark:text-red-200 text-sm font-medium flex-1">
            <span className="font-bold mr-1">Urgent:</span> {urgentNotices[0].title} - {urgentNotices[0].message}
          </p>
          <Button variant="link" className="text-red-700 dark:text-red-300 font-semibold p-0 h-auto">View Details <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Upcoming Events', value: `${upcomingEvents.length} active`, icon: CalendarIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', link: '/events' },
          { title: 'New Resources', value: `${resourceCount} total`, icon: BookOpen, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', link: '/resources' },
          { title: 'My Events', value: `${myEventsCount} registered`, icon: Ticket, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', link: '/my-campus' },
          { title: 'New Notices', value: `${allNotices.length} active`, icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', isAction: true },
        ].map((stat, i) => {
          const cardContent = (
            <Card className="rounded-2xl shadow-sm border-border/50 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{stat.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
          
          if (stat.isAction) {
            return (
              <Dialog key={i}>
                <DialogTrigger asChild>
                  <div className="h-full">{cardContent}</div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Campus Notices</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {allNotices.length === 0 ? (
                      <p className="text-center text-muted-foreground">No active notices.</p>
                    ) : (
                      allNotices.map((n) => (
                        <div key={n.id} className={cn(
                          "p-4 rounded-xl border",
                          n.severity === 'critical' ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50" :
                          n.severity === 'warning' ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50" :
                          "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={n.severity === 'critical' ? 'destructive' : 'default'} className={
                              n.severity === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 
                              n.severity === 'info' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
                            }>
                              {n.severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString() : new Date((n.createdAt as any) || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-bold mb-1 text-foreground">{n.title}</h4>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            );
          }

          return (
            <Link to={stat.link || '#'} key={i}>
              {cardContent}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Upcoming Events</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-blue-50" asChild>
                <Link to="/events">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {upcomingEvents.length > 0 ? upcomingEvents.map((ev, i) => (
                  <div key={ev.id || i} className="flex flex-col sm:flex-row justify-between p-4 rounded-xl border border-border/50 hover:border-blue-100 hover:shadow-sm transition-all gap-4 bg-card">
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      {ev.bannerUrl ? (
                        <div className="h-24 w-full sm:w-32 rounded-lg bg-muted flex-shrink-0 overflow-hidden relative">
                          <img src={ev.bannerUrl} alt={ev.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-24 w-full sm:w-32 rounded-lg bg-blue-50/50 flex items-center justify-center flex-shrink-0 text-blue-300">
                          <CalendarIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="flex flex-col justify-center flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{ev.clubId}</Badge>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{ev.eventType}</span>
                        </div>
                        <h4 className="font-bold text-lg text-foreground line-clamp-1">{ev.title}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>{ev.startTime?.toDate().toLocaleDateString()} at {ev.startTime?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-slate-500">{ev.isPayable ? `Fee: ৳${ev.ticketPrice || 0}` : 'Free Event'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center sm:pl-4">
                      <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-lg w-full sm:w-auto shadow-sm">
                        <Link to={`/events/${ev.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                )) : <p className="text-muted-foreground py-8 text-center bg-card border border-border/50 rounded-xl">No upcoming events found</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Lost & Found</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary font-semibold hover:bg-blue-50" asChild>
                <Link to="/lost-found">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                {recentItems.length > 0 ? recentItems.slice(0, 2).map(item => (
                  <div key={item.id} className="flex flex-col p-4 rounded-xl border border-border/50 hover:border-blue-100 hover:shadow-sm transition-all bg-card">
                    <div className="flex items-start gap-4">
                      {item.photoUrl ? (
                        <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
                           <img src={item.photoUrl} alt="Item" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 relative">
                          <Search className="w-6 h-6 text-muted-foreground/70" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-base truncate">{item.title}</h4>
                        <div className="flex items-center text-xs mt-1 gap-2">
                           <span className={`uppercase font-bold px-2 py-0.5 rounded-full ${item.itemType === 'lost' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{item.itemType}</span>
                           <span className="text-muted-foreground truncate">{item.locationTag}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{item.description}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                   <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/50 rounded-xl md:col-span-2">No recent items reported.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm border-border/50 bg-gradient-to-br from-[#0B1729] to-[#142033] text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Next Bus</CardTitle>
            </CardHeader>
            <CardContent>
              {!profile.busRoute || profile.busRoute === 'none' ? (
                <div className="text-center py-8">
                   <p className="text-sm opacity-80 mb-4">You haven't selected a bus route.</p>
                   <Button asChild variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                     <Link to="/my-campus">Select Bus Route</Link>
                   </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Bus className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{profile.busRoute} Route</h4>
                      <p className="text-sm text-blue-200">Main Campus Gate</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-5 pb-2">
                    <p className="text-center text-sm text-blue-200 mb-2">Scheduled at <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded ml-1">{nextBusInfo.timeLabel}</span></p>
                    <div className="text-center flex items-baseline justify-center gap-2">
                      {busHrs > 0 && (
                        <>
                          <span className="text-3xl font-black text-green-400">{busHrs}</span>
                          <span className="text-green-400 font-medium -ml-1">hr</span>
                        </>
                      )}
                      <span className="text-3xl font-black text-green-400">{busMins}</span>
                      <span className="text-green-400 font-medium -ml-1">min</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Today's Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {!profile.batch || !profile.section ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-4 text-sm">Please set your Batch and Section in Profile.</p>
                  <Button asChild variant="outline" size="sm"><Link to="/my-campus">Go to Profile</Link></Button>
                </div>
              ) : todaysClasses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl border-border">
                  <p>No classes today!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysClasses.map((cls: any, i: number) => (
                    <div key={i} className="flex gap-3 text-sm text-muted-foreground p-3 rounded-lg border border-border bg-card shadow-sm">
                      <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground truncate">{cls.course}</p>
                        <p className="text-xs truncate text-muted-foreground">{routine?.courses?.[cls.course] || 'Course'}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs font-semibold text-primary">{cls.time}</p>
                          <p className="text-xs">{cls.room || 'TBA'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
