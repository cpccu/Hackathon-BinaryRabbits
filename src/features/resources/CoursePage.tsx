import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Eye, ThumbsUp, CheckCircle, FileText, Upload } from 'lucide-react';
import { Course, Resource } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseAndResources = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
        }

        const resRef = collection(db, 'resources');
        const q = query(resRef, where('courseId', '==', id));
        const resSnap = await getDocs(q);
        setResources(resSnap.docs.map(d => ({ id: d.id, ...d.data() } as Resource)));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndResources();
  }, [id]);

  const handleUpvote = async (resourceId: string, isUpvoted: boolean) => {
    try {
      const mockUserId = 'user-123';
      const resRef = doc(db, 'resources', resourceId);
      
      if (isUpvoted) {
        await updateDoc(resRef, {
          upvotedBy: arrayRemove(mockUserId),
          upvoteCount: (resources.find(r => r.id === resourceId)?.upvoteCount || 1) - 1
        });
      } else {
        await updateDoc(resRef, {
          upvotedBy: arrayUnion(mockUserId),
          upvoteCount: (resources.find(r => r.id === resourceId)?.upvoteCount || 0) + 1
        });
      }
      
      // Optimistic update
      setResources(prev => prev.map(r => {
        if (r.id === resourceId) {
          const newUpvotedBy = isUpvoted 
            ? (r.upvotedBy || []).filter(u => u !== mockUserId)
            : [...(r.upvotedBy || []), mockUserId];
          return { ...r, upvotedBy: newUpvotedBy, upvoteCount: newUpvotedBy.length };
        }
        return r;
      }));
    } catch (error) {
      toast.error('Failed to update upvote');
    }
  };

  if (loading) return <LoadingState variant="full" />;
  if (!course) return <div className="p-8 text-center">Course not found.</div>;

  const mockUserId = 'user-123';

  const ResourceList = ({ type }: { type: string }) => {
    const filtered = resources.filter(r => r.category === type).sort((a, b) => b.upvoteCount - a.upvoteCount);
    
    if (filtered.length === 0) {
      return <EmptyState icon={FileText} title={`No ${type}s found`} description={`Be the first to upload a ${type} for this course.`} />;
    }

    return (
      <div className="space-y-4 mt-4">
        {filtered.map(res => {
          const isUpvoted = (res.upvotedBy || []).includes(mockUserId);
          return (
            <div key={res.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-xl border bg-card">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{res.title}</h4>
                  {res.isVerified && <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><CheckCircle className="w-3 h-3 mr-1"/> Verified</Badge>}
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>By {res.uploaderId}</span>
                  <span>•</span>
                  <span>{formatDateTime(res.createdAt)}</span>
                  <span>•</span>
                  <span>{(res.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  variant={isUpvoted ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => handleUpvote(res.id, isUpvoted)}
                  className="flex-1 sm:flex-none"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" /> {res.upvoteCount}
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                  <a href={res.fileUrl} target="_blank" rel="noreferrer"><Eye className="w-4 h-4" /></a>
                </Button>
                <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                  <a href={res.fileUrl} download><Download className="w-4 h-4" /></a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <Button variant="ghost" asChild className="mb-2">
        <Link to="/resources"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub</Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{course.courseCode}: {course.title}</h1>
          </div>
          <p className="text-muted-foreground">{course.departmentId} • Level {course.levelTerm}</p>
        </div>
        <Button asChild>
          <Link to={`/resources/upload?courseId=${course.id}`}>
            <Upload className="w-4 h-4 mr-2" /> Upload Material
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="pyq" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="pyq">Previous Questions</TabsTrigger>
          <TabsTrigger value="slide">Lecture Slides</TabsTrigger>
          <TabsTrigger value="note">Student Notes</TabsTrigger>
          <TabsTrigger value="lab">Lab Materials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pyq">
          <ResourceList type="pyq" />
        </TabsContent>
        <TabsContent value="slide">
          <ResourceList type="slide" />
        </TabsContent>
        <TabsContent value="note">
          <ResourceList type="note" />
        </TabsContent>
        <TabsContent value="lab">
          <ResourceList type="lab" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
