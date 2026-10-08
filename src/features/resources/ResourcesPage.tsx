import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc, deleteDoc, Timestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { Resource } from '@/types';
import { Search, FileText, Upload, Download, ExternalLink, Bookmark, BookmarkCheck, ThumbsUp, ShieldCheck, BookOpen, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const DEPARTMENTS = ['CSE', 'EEE', 'ME', 'Pharmacy', 'English', 'BBA', 'Civil', 'Textile', 'Architecture', 'Law'];

const BI_SEMESTERS = [
  '1st Year 1st Sem', '1st Year 2nd Sem',
  '2nd Year 1st Sem', '2nd Year 2nd Sem',
  '3rd Year 1st Sem', '3rd Year 2nd Sem',
  '4th Year 1st Sem', '4th Year 2nd Sem'
];

const TRI_SEMESTERS = [
  '1st Year 1st Sem', '1st Year 2nd Sem', '1st Year 3rd Sem',
  '2nd Year 1st Sem', '2nd Year 2nd Sem', '2nd Year 3rd Sem',
  '3rd Year 1st Sem', '3rd Year 2nd Sem', '3rd Year 3rd Sem',
  '4th Year 1st Sem', '4th Year 2nd Sem', '4th Year 3rd Sem'
];

export function ResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterSem, setFilterSem] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  
  const [savedResourceIds, setSavedResourceIds] = useState<Record<string, string>>({});
  
  // Upload Modal State
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '', department: 'CSE', academicSystem: 'bi', semester: '1st Year 1st Sem', courseCode: '', category: 'note', fileUrl: '', session: ''
  });

  const isRM = user?.role === 'resource_manager' || user?.role === 'admin';

  const fetchResources = async () => {
    setLoading(true);
    try {
      const resRef = collection(db, 'resources');
      const q = query(resRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      let fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Resource));

      if (user) {
        const savedRef = collection(db, 'savedResources');
        const savedQ = query(savedRef, where('userId', '==', user.uid));
        const savedSnap = await getDocs(savedQ);
        const sMap: Record<string, string> = {};
        savedSnap.docs.forEach(d => {
          sMap[d.data().resourceId] = d.id;
        });
        setSavedResourceIds(sMap);

        if (activeTab === 'saved') {
          fetched = fetched.filter(r => sMap[r.id]);
        }
      }

      // Apply Filters
      if (filterDept !== 'all') fetched = fetched.filter(r => r.department === filterDept);
      if (filterSem !== 'all') fetched = fetched.filter(r => r.semester === filterSem);
      if (filterType !== 'all') fetched = fetched.filter(r => r.category === filterType);
      
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        fetched = fetched.filter(r => 
          r.title.toLowerCase().includes(sq) || 
          r.courseCode.toLowerCase().includes(sq)
        );
      }
      
      // Apply Sorting
      if (sortBy === 'upvotes') {
        fetched.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
      }

      setResources(fetched);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [activeTab, filterDept, filterSem, filterType, sortBy, user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Must be logged in");

    try {
      // Duplicate check for Question Papers
      if (uploadData.category === 'question_paper') {
        if (!uploadData.session) {
          return toast.error("Session (e.g. Fall-2026) is required for question papers");
        }
        
        const resRef = collection(db, 'resources');
        const dupQ = query(
          resRef, 
          where('courseCode', '==', uploadData.courseCode.toUpperCase()),
          where('category', '==', 'question_paper'),
          where('session', '==', uploadData.session)
        );
        const dupSnap = await getDocs(dupQ);
        
        if (!dupSnap.empty) {
          return toast.error(`A question paper for ${uploadData.courseCode} (${uploadData.session}) already exists! Upload rejected.`);
        }
      }

      await addDoc(collection(db, 'resources'), {
        ...uploadData,
        courseCode: uploadData.courseCode.toUpperCase(),
        uploaderId: user.uid,
        isVerified: user.role === 'faculty' || user.role === 'cr', 
        upvoteCount: 0,
        upvotedBy: [],
        tags: [],
        createdAt: Timestamp.now()
      });
      toast.success("Resource uploaded successfully!");
      setUploadOpen(false);
      setUploadData({ title: '', department: 'CSE', academicSystem: 'bi', semester: '1st Year 1st Sem', courseCode: '', category: 'note', fileUrl: '', session: '' });
      fetchResources();
    } catch (err) {
      toast.error("Upload failed");
    }
  };

  const toggleSave = async (resourceId: string) => {
    if (!user) return toast.error('Please login');
    const savedDocId = savedResourceIds[resourceId];
    try {
      if (savedDocId) {
        await deleteDoc(doc(db, 'savedResources', savedDocId));
        setSavedResourceIds(prev => { const n = {...prev}; delete n[resourceId]; return n; });
        toast.success('Removed from saved');
      } else {
        const d = await addDoc(collection(db, 'savedResources'), { resourceId, userId: user.uid, savedAt: Timestamp.now() });
        setSavedResourceIds(prev => ({ ...prev, [resourceId]: d.id }));
        toast.success('Saved resource');
      }
      if (activeTab === 'saved') fetchResources();
    } catch (e) {
      toast.error('Failed to update saved resources');
    }
  };

  const toggleUpvote = async (resource: Resource) => {
    if (!user) return toast.error('Please login');
    try {
      const ref = doc(db, 'resources', resource.id);
      const hasUpvoted = resource.upvotedBy?.includes(user.uid);
      if (hasUpvoted) {
        await updateDoc(ref, {
          upvoteCount: Math.max(0, (resource.upvoteCount || 0) - 1),
          upvotedBy: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(ref, {
          upvoteCount: (resource.upvoteCount || 0) + 1,
          upvotedBy: arrayUnion(user.uid)
        });
      }
      fetchResources();
    } catch (e) {
      toast.error('Failed to upvote');
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteDoc(doc(db, 'resources', resourceId));
      toast.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      toast.error('Failed to delete resource');
    }
  };

  const viewCoursePack = (courseCode: string) => {
    setSearchQuery(courseCode);
    setFilterDept('all');
    setFilterSem('all');
    setFilterType('all');
    setSortBy('upvotes');
    toast.success(`Loaded Course Pack for ${courseCode}`);
  };

  const semesterOptions = uploadData.academicSystem === 'bi' ? BI_SEMESTERS : TRI_SEMESTERS;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Resource Hub</h1>
          <p className="text-muted-foreground mt-1">Your central academic library</p>
        </div>
        
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Upload className="w-4 h-4 mr-2" /> Upload Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Academic Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input required value={uploadData.title} onChange={e => setUploadData({...uploadData, title: e.target.value})} placeholder="e.g. Midterm Suggestions" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={uploadData.department} onValueChange={v => setUploadData({...uploadData, department: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Course Code</Label>
                  <Input required value={uploadData.courseCode} onChange={e => setUploadData({...uploadData, courseCode: e.target.value})} placeholder="e.g. CSE 221" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Academic System</Label>
                  <Select value={uploadData.academicSystem} onValueChange={v => setUploadData({...uploadData, academicSystem: v, semester: v === 'bi' ? BI_SEMESTERS[0] : TRI_SEMESTERS[0] })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bi">Bi-Semester</SelectItem>
                      <SelectItem value="tri">Tri-Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={uploadData.semester} onValueChange={v => setUploadData({...uploadData, semester: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {semesterOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={uploadData.category} onValueChange={v => setUploadData({...uploadData, category: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Notes</SelectItem>
                      <SelectItem value="question_paper">Question Papers</SelectItem>
                      <SelectItem value="lab">Lab Manuals</SelectItem>
                      <SelectItem value="slide">Slides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {uploadData.category === 'question_paper' && (
                  <div className="space-y-2">
                    <Label>Session / Year</Label>
                    <Input required value={uploadData.session} onChange={e => setUploadData({...uploadData, session: e.target.value})} placeholder="e.g. Fall-2026" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>File Link (Google Drive / OneDrive)</Label>
                <Input required type="url" value={uploadData.fileUrl} onChange={e => setUploadData({...uploadData, fileUrl: e.target.value})} placeholder="https://..." />
              </div>
              <Button type="submit" className="w-full">Submit Resource</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-12 p-0 space-x-8">
          <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-medium text-muted-foreground">All Resources</TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 font-medium text-muted-foreground">My Saved Resources</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl shadow-sm border border-border flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search course code, topic..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchResources()} className="pl-9 bg-muted border-none" />
            </div>
            
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[130px] bg-muted border-none"><SelectValue placeholder="Dept" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dept</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterSem} onValueChange={setFilterSem}>
              <SelectTrigger className="w-[150px] bg-muted border-none"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <optgroup label="Bi-Semester">
                  {BI_SEMESTERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </optgroup>
                <optgroup label="Tri-Semester">
                  {TRI_SEMESTERS.map(s => <SelectItem key={'tri_'+s} value={s}>{s} (Tri)</SelectItem>)}
                </optgroup>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px] bg-muted border-none"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
                <SelectItem value="question_paper">Questions</SelectItem>
                <SelectItem value="lab">Lab Manuals</SelectItem>
                <SelectItem value="slide">Slides</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px] bg-muted border-none"><SelectValue placeholder="Sort By" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="upvotes">Most Upvoted</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchResources}>Search</Button>
          </div>

          <div className="space-y-4">
            {resources.map((res: any) => (
              <div key={res.id} className="flex bg-card p-4 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center justify-start pr-4 border-r border-border mr-4">
                  <button onClick={() => toggleUpvote(res)} className={`p-1 rounded hover:bg-muted ${res.upvotedBy?.includes(user?.uid || '') ? 'text-primary' : 'text-muted-foreground'}`}>
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-sm mt-1">{res.upvoteCount || 0}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => viewCoursePack(res.courseCode)} className="font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded text-xs transition-colors" title="View 1-Click Course Pack">{res.courseCode}</button>
                    <span className="text-xs text-muted-foreground uppercase">{res.category.replace('_', ' ')}</span>
                    {res.category === 'question_paper' && res.session && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded ml-1">{res.session}</span>
                    )}
                    {res.isVerified && (
                      <span className="flex items-center text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3 mr-1"/> Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{res.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{res.department} • {res.semester}</span>
                    <span>Uploaded: {res.createdAt?.toDate().toLocaleDateString()}</span>
                  </p>
                </div>
                
                <div className="flex flex-col items-end justify-between ml-4">
                  <div className="flex items-center gap-2">
                    {isRM && (
                      <button onClick={() => handleDelete(res.id)} className="text-red-500 hover:text-red-600 p-2" title="Delete Resource">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => toggleSave(res.id)} className="text-muted-foreground hover:text-primary p-2">
                      {savedResourceIds[res.id] ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <a href={res.fileUrl} target="_blank" rel="noreferrer">
                      View <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
            {resources.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No resources found. Be the first to upload!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
