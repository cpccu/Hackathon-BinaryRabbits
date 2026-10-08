import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, BookOpen, PackageSearch, MessageSquare, Edit, BookMarked, Layers, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { collection, query, where, getCountFromServer, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Link } from 'react-router-dom';

// Import routines dynamically
import ROUTINES from '@/data/routines.json';

export function MyCampusPage() {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditForm(prev => ({ ...prev, avatarUrl: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  
  const [profileData, setProfileData] = useState({
    batch: '',
    section: '',
    avatarUrl: '',
    busRoute: ''
  });

  const [editForm, setEditForm] = useState({
    batch: '',
    section: '',
    avatarUrl: '',
    busRoute: ''
  });

  const [eventsCount, setEventsCount] = useState(0);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [lostFoundCount, setLostFoundCount] = useState(0);

  const [savedEventsList, setSavedEventsList] = useState<any[]>([]);
  const [savedResourcesList, setSavedResourcesList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      const saved = localStorage.getItem(`cu-profile-${user.uid}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfileData(parsed);
          setEditForm(parsed);
        } catch(e) {}
      } else {
        const init = { batch: user.batch || '', section: user.section || '', avatarUrl: user.avatarUrl || '', busRoute: (user as any).busRoute || '' };
        setProfileData(init);
        setEditForm(init);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const fetchCountsAndData = async () => {
      try {
        const lfQuery = query(collection(db, 'lostFoundItems'), where('userId', '==', user.uid));
        const lfSnap = await getCountFromServer(lfQuery);
        setLostFoundCount(lfSnap.data().count);

        const compQuery = query(collection(db, 'complaints'), where('studentId', '==', user.uid));
        const compSnap = await getCountFromServer(compQuery);
        setComplaintsCount(compSnap.data().count);

        const eventQuery = query(collection(db, 'eventRegistrations'), where('userId', '==', user.uid));
        const eventSnap = await getCountFromServer(eventQuery);
        setEventsCount(eventSnap.data().count);

        const resQuery = query(collection(db, 'savedResources'), where('userId', '==', user.uid));
        const resSnap = await getCountFromServer(resQuery);
        setResourcesCount(resSnap.data().count);

        // Fetch detailed lists
        const fetchedEvents = [];
        const evDocs = await getDocs(eventQuery);
        for (let d of evDocs.docs) {
          const evId = d.data().eventId;
          const evDoc = await getDoc(doc(db, 'events', evId));
          if (evDoc.exists()) fetchedEvents.push({ id: evDoc.id, ...evDoc.data() });
        }
        setSavedEventsList(fetchedEvents);

        const fetchedRes = [];
        const resDocs = await getDocs(resQuery);
        for (let d of resDocs.docs) {
          const rId = d.data().resourceId;
          const rDoc = await getDoc(doc(db, 'resources', rId));
          if (rDoc.exists()) fetchedRes.push({ id: rDoc.id, ...rDoc.data() });
        }
        setSavedResourcesList(fetchedRes);
        setLoadingData(false);

      } catch (err) {
        console.error("Failed to fetch user stats", err);
        setLoadingData(false);
      }
    };
    
    fetchCountsAndData();
  }, [user]);

  const handleSaveProfile = () => {
    if (user?.uid) {
      localStorage.setItem(`cu-profile-${user.uid}`, JSON.stringify(editForm));
      setProfileData(editForm);
      toast.success('Profile updated successfully!');
      setIsEditOpen(false);
    }
  };

  const getRunningCourses = () => {
    if (!profileData.batch || !profileData.section) return [];
    
    const routine: any = ROUTINES.find((r: any) => r.batch === profileData.batch && r.section === profileData.section);
    if (!routine) return [];

    const courseCodes = new Set<string>();
    Object.values(routine.schedule || {}).forEach((daySchedule: any) => {
      daySchedule.forEach((period: any) => {
        if (period.course && period.course.trim().length > 0) {
          courseCodes.add(period.course.trim());
        }
      });
    });

    return Array.from(courseCodes).map(code => ({
      code,
      title: routine.courses?.[code] || "Undergraduate Course"
    }));
  };

  const runningCourses = getRunningCourses();

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* User Header */}
      <Card className="border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <Avatar className="w-24 h-24 border-4 border-white dark:border-gray-800 shadow-md">
            <AvatarImage src={profileData.avatarUrl || "https://github.com/shadcn.png"} />
            <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground font-mono">ID: {user.studentId || 'Not provided'}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {user.department || 'Computer Science & Engineering'}
              </span>
              <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium capitalize">
                {user.role || 'Student'}
              </span>
              {profileData.batch && profileData.section && (
                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                  Batch {profileData.batch} ({profileData.section})
                </span>
              )}
              {profileData.busRoute && profileData.busRoute !== 'none' && (
                <span className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  🚌 {profileData.busRoute}
                </span>
              )}
            </div>
          </div>
          
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="avatar" className="text-right">Picture</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input id="avatar" type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
                    {editForm.avatarUrl && <img src={editForm.avatarUrl} className="w-8 h-8 rounded-full border" alt="Preview"/>}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="busRoute" className="text-right">Bus Route</Label>
                  <Select value={editForm.busRoute} onValueChange={v => setEditForm({...editForm, busRoute: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Bus" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {['Bus-1', 'Bus-2', 'Bus-3', 'Bus-4', 'Bus-5'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="batch" className="text-right">Batch</Label>
                  <Select value={editForm.batch} onValueChange={v => setEditForm({...editForm, batch: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Batch" /></SelectTrigger>
                    <SelectContent>
                      {['62','63','64','65','66','67','68','69','70'].map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="section" className="text-right">Section</Label>
                  <Select value={editForm.section} onValueChange={v => setEditForm({...editForm, section: v})}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select Section" /></SelectTrigger>
                    <SelectContent>
                      {['A','B','C','D'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </div>
            </DialogContent>
          </Dialog>

        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: 'My Events', value: eventsCount.toString(), color: 'text-blue-500', link: '/events' },
          { icon: BookOpen, label: 'Saved Resources', value: resourcesCount.toString(), color: 'text-green-500', link: '/resources' },
          { icon: PackageSearch, label: 'My Lost/Found', value: lostFoundCount.toString(), color: 'text-orange-500', link: '/lost-found' },
          { icon: MessageSquare, label: 'My Complaints', value: complaintsCount.toString(), color: 'text-purple-500', link: '/complaints' },
        ].map((stat, idx) => (
          <Link key={idx} to={stat.link} className="block">
            <Card className="bg-card hover:bg-accent/5 transition-all hover:-translate-y-1 cursor-pointer border-border h-full shadow-sm hover:shadow-md">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-border w-full mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary"/> Running Semester Courses</CardTitle>
          <CardDescription>Courses extracted dynamically from your Batch & Section routine.</CardDescription>
        </CardHeader>
        <CardContent>
          {!profileData.batch || !profileData.section ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl border-border">
              <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>Please edit your profile and set your Batch and Section to see your courses.</p>
            </div>
          ) : runningCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl border-border">
              <p>No routine data found for Batch {profileData.batch} Section {profileData.section}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {runningCourses.map((cObj: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                    {cObj.code.split(' ')[0] || 'CR'}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{cObj.code}</h4>
                    <p className="text-sm text-muted-foreground">{cObj.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
