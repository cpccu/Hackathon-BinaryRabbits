import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ArrowLeft, MapPin, Calendar, User, PackageSearch } from 'lucide-react';
import { LostFoundItem } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<LostFoundItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimProof, setClaimProof] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'lostFoundItems', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() } as LostFoundItem);
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleClaim = async () => {
    if (!id || !claimProof.trim()) return;
    setSubmittingClaim(true);
    try {
      await addDoc(collection(db, 'ownershipClaims'), {
        itemId: id,
        claimantId: 'user-456', // Mock user
        proofDescription: claimProof,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      toast.success('Claim submitted! The finder will review it.');
      setIsClaimDialogOpen(false);
      setClaimProof('');
    } catch (error) {
      toast.error('Failed to submit claim.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) return <LoadingState variant="full" />;
  if (!item) return <ErrorState title="Item not found" />;

  const mockUserId = 'user-456';
  const isPoster = item.userId === mockUserId;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <Button variant="ghost" className="mb-4" asChild>
        <Link to="/lost-found"><ArrowLeft className="w-4 h-4 mr-2" /> Back to List</Link>
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl overflow-hidden bg-muted flex items-center justify-center min-h-[300px]">
          {item.photoUrl ? (
            <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <PackageSearch className="w-24 h-24 text-muted-foreground opacity-50" />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex gap-2 mb-3">
              <Badge variant={item.itemType === 'lost' ? 'destructive' : 'default'}>
                {item.itemType.toUpperCase()}
              </Badge>
              {item.status === 'resolved' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">RESOLVED</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
          </div>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Location</p>
                  <p>{item.locationTag}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Date</p>
                  <p>{formatDateTime(item.incidentDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Posted By</p>
                  <p>{item.userName || 'Student (ID hidden)'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>
          </div>

          {item.status !== 'resolved' && !isPoster && item.itemType === 'found' && (
            <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">Claim Ownership</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Claim Item</DialogTitle>
                  <DialogDescription>
                    Provide specific details about this item to prove it belongs to you. The finder will review this before handing it over.
                  </DialogDescription>
                </DialogHeader>
                <Textarea 
                  placeholder="e.g. The left pocket has a small tear, and there's a blue pen inside."
                  className="min-h-[100px]"
                  value={claimProof}
                  onChange={(e) => setClaimProof(e.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsClaimDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleClaim} disabled={submittingClaim || !claimProof.trim()}>
                    {submittingClaim ? 'Submitting...' : 'Submit Claim'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isPoster && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-primary mb-1">You posted this item.</h4>
              <p className="text-sm text-muted-foreground mb-3">Manage claims and update status here.</p>
              <Button variant="outline" className="w-full">View Pending Claims</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
