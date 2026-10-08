import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Shield, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDateTime } from '@/lib/utils';
import { Complaint } from '@/types';
import { cn } from '@/lib/utils';

export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaint = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'complaints', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setComplaint({ id: docSnap.id, ...docSnap.data() } as Complaint);
        }
      } catch (error) {
        console.error("Error fetching complaint:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaint();
  }, [id]);

  if (loading) return <LoadingState variant="full" />;
  if (!complaint) return <ErrorState title="Complaint not found" />;

  const getStatusLabel = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const statusOrder = ['submitted', 'under_review', 'action_taken', 'resolved'];
  const currentStatusIndex = statusOrder.indexOf(complaint.status);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <Button variant="ghost" className="mb-4" asChild>
        <Link to="/complaints"><ArrowLeft className="w-4 h-4 mr-2" /> Back to My Complaints</Link>
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Complaint #{complaint.trackingCode}</h1>
            {complaint.isAnonymous && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                <Shield className="w-3 h-3 mr-1" /> Anonymous
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">{complaint.subject}</p>
        </div>
        <Badge className={cn("text-lg px-4 py-1", 
          complaint.status === 'resolved' ? "bg-green-500 hover:bg-green-600" :
          complaint.status === 'action_taken' ? "bg-blue-500 hover:bg-blue-600" :
          "bg-yellow-500 hover:bg-yellow-600"
        )}>
          {getStatusLabel(complaint.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                <div>
                  <p className="text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold">{complaint.category.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Submitted On</p>
                  <p className="font-semibold">{formatDateTime(complaint.createdAt)}</p>
                </div>
              </div>
              
              <div>
                <p className="font-semibold mb-2">Description</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{complaint.description}</p>
              </div>

              {complaint.attachmentUrl && (
                <div className="pt-4 border-t">
                  <p className="font-semibold mb-2">Attachments</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={complaint.attachmentUrl} target="_blank" rel="noreferrer">
                      <Paperclip className="w-4 h-4 mr-2" /> View Attached File
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {statusOrder.map((stepStatus, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const historyEntry = complaint.statusHistory.find(h => h.status === stepStatus);
                  
                  return (
                    <div key={stepStatus} className="relative flex gap-4">
                      {/* Vertical line connector */}
                      {index < statusOrder.length - 1 && (
                        <div className={cn("absolute left-[11px] top-8 bottom-[-24px] w-0.5", isCompleted && index < currentStatusIndex ? "bg-primary" : "bg-muted")} />
                      )}
                      
                      <div className={cn("relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ring-4 ring-background",
                        isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current opacity-50" />}
                      </div>
                      
                      <div className="flex-1 pb-1">
                        <p className={cn("font-medium leading-none mb-1", isCurrent ? "text-primary" : !isCompleted ? "text-muted-foreground" : "")}>
                          {getStatusLabel(stepStatus)}
                        </p>
                        {historyEntry && (
                          <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            <p>{formatDateTime(historyEntry.updatedAt)}</p>
                            {historyEntry.note && (
                              <p className="italic bg-muted/50 p-2 rounded mt-1 border-l-2 border-primary/30">"{historyEntry.note}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
