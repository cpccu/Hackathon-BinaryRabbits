import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { LostFoundItem } from '@/types';
import { Search, Plus, MapPin, Calendar, ShieldAlert, Image as ImageIcon, Phone, Trash2, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function LostFoundPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // New Post Form
  const [postOpen, setPostOpen] = useState(false);
  const [formData, setFormData] = useState({
    itemType: 'lost', title: '', category: 'electronics', description: '', locationTag: '', photoUrl: '', privateDetails: '', contactInfo: ''
  });

  // Claim Form
  const [claimOpen, setClaimOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [claimProof, setClaimProof] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lostFoundItems'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as LostFoundItem));

      // Filter by Type (Lost/Found)
      fetched = fetched.filter(i => i.itemType === activeTab && i.status !== 'resolved');

      if (categoryFilter !== 'all') fetched = fetched.filter(i => i.category === categoryFilter);
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        fetched = fetched.filter(i => i.title.toLowerCase().includes(sq) || i.locationTag.toLowerCase().includes(sq));
      }

      setItems(fetched);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, categoryFilter]);

  
  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'lostFoundItems', itemId));
      toast.success('Post removed successfully!');
      fetchItems();
    } catch (e) {
      toast.error('Failed to remove post');
    }
  };

  const handleResolve = async (itemId: string) => {
    if (!confirm('Has this item been successfully returned/found?')) return;
    try {
      await updateDoc(doc(db, 'lostFoundItems', itemId), { status: 'resolved' });
      toast.success('Marked as Resolved!');
      fetchItems();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

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
        
        const base64String = canvas.toDataURL('image/jpeg', 0.6);
        setFormData({ ...formData, photoUrl: base64String });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please login");

    try {
      await addDoc(collection(db, 'lostFoundItems'), {
        ...formData,
        userId: user.uid,
        userName: user.name,
        status: 'active',
        incidentDate: Timestamp.now(),
        createdAt: Timestamp.now()
      });
      
      toast.success(`${formData.itemType === 'lost' ? 'Lost' : 'Found'} item posted!`);
      setPostOpen(false);
      setFormData({ itemType: 'lost', title: '', category: 'electronics', description: '', locationTag: '', photoUrl: '', privateDetails: '', contactInfo: '' });
      fetchItems();
    } catch (error) {
      toast.error('Failed to post item');
    }
  };

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItem) return;
    
    try {
      await addDoc(collection(db, 'ownershipClaims'), {
        itemId: selectedItem.id,
        claimantId: user.uid,
        claimantName: user.name,
        proofDescription: claimProof,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      toast.success('Secure ownership claim submitted! The poster will review it.');
      setClaimOpen(false);
      setClaimProof('');
    } catch (error) {
      toast.error('Failed to submit claim');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 bg-background min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Lost & Found</h1>
          <p className="text-muted-foreground mt-1">Recover lost items or help others find theirs.</p>
        </div>
        
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Report Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report a Lost or Found Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePostSubmit} className="space-y-4 mt-4">
              <div className="flex gap-4">
                <Button type="button" variant={formData.itemType === 'lost' ? 'default' : 'outline'} className="flex-1 bg-red-500 hover:bg-red-600 data-[state=active]:bg-red-600" data-state={formData.itemType === 'lost' ? 'active' : ''} onClick={() => setFormData({...formData, itemType: 'lost'})}>I Lost Something</Button>
                <Button type="button" variant={formData.itemType === 'found' ? 'default' : 'outline'} className="flex-1 bg-green-500 hover:bg-green-600 data-[state=active]:bg-green-600" data-state={formData.itemType === 'found' ? 'active' : ''} onClick={() => setFormData({...formData, itemType: 'found'})}>I Found Something</Button>
              </div>

              <div className="space-y-2">
                <Label>Item Title</Label>
                <Input required value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} placeholder="e.g. Black Casio Calculator" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={v=>setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="id_card">ID Card</SelectItem>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="personal_accessories">Accessories</SelectItem>
                      <SelectItem value="bags">Bags/Wallets</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input required value={formData.locationTag} onChange={e=>setFormData({...formData, locationTag: e.target.value})} placeholder="e.g. Library 2nd Floor" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea required value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Provide visible details..." />
              </div>

              {formData.itemType === 'found' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-orange-600 flex items-center"><ShieldAlert className="w-4 h-4 mr-1"/> Private Verification Detail</Label>
                    <Input value={formData.privateDetails} onChange={e=>setFormData({...formData, privateDetails: e.target.value})} placeholder="Secret detail only owner would know (e.g. scratch mark)" />
                    <p className="text-xs text-muted-foreground">Keep this secret. The claimant must mention this to prove ownership.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Instructions</Label>
                    <Input value={formData.contactInfo} onChange={e=>setFormData({...formData, contactInfo: e.target.value})} placeholder="e.g. Call 017XXXXXX or meet at Room 302" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Upload Photo</Label>
                <div className="flex items-center gap-4">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} className="flex-1" />
                  {formData.photoUrl && (
                    <img src={formData.photoUrl} alt="Preview" className="w-10 h-10 object-cover rounded border" />
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full">Post Item</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-card p-2 rounded-xl border border-border gap-4">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="lost" className="px-8 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Lost Items</TabsTrigger>
            <TabsTrigger value="found" className="px-8 data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Found Items</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&fetchItems()} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="id_card">ID Card</SelectItem>
              <SelectItem value="bags">Bags/Wallets</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
            {item.photoUrl ? (
              <div className="h-48 w-full bg-muted relative border-b border-border">
                <img src={item.photoUrl} alt={item.title} className="w-full h-full object-cover" />
                <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold uppercase ${item.itemType === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {item.itemType}
                </div>
              </div>
            ) : (
              <div className="h-48 w-full bg-muted flex items-center justify-center relative border-b border-border">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold uppercase ${item.itemType === 'lost' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {item.itemType}
                </div>
              </div>
            )}
            
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <div className="flex items-center"><MapPin className="w-4 h-4 mr-2"/> {item.locationTag}</div>
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-2"/> {item.incidentDate.toDate().toLocaleDateString()}</div>
                {item.itemType === 'found' && item.contactInfo && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                    <Phone className="w-4 h-4 mr-2"/> {item.contactInfo}
                  </div>
                )}
              </div>
              <p className="text-sm line-clamp-2 mb-4">{item.description}</p>
              
              <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Posted by {item.userName || 'Student'}</span>
                
                
                {user?.uid === item.userId ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleResolve(item.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Resolved
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (

                  <Dialog open={claimOpen && selectedItem?.id === item.id} onOpenChange={(o) => {setClaimOpen(o); if(o) setSelectedItem(item);}}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant={item.itemType === 'found' ? 'default' : 'secondary'} className={item.itemType === 'found' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}>
                        {item.itemType === 'found' ? 'I think this is mine' : 'I found this'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Secure Ownership Claim</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={submitClaim} className="space-y-4">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800 text-sm text-orange-800 dark:text-orange-200 flex items-start gap-2 mb-4">
                          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                          <p>To prevent fraud, please provide specific proof of ownership. The poster will review this before handing it over.</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Proof of Ownership</Label>
                          <Textarea 
                            required 
                            value={claimProof} 
                            onChange={e=>setClaimProof(e.target.value)} 
                            placeholder="e.g. The calculator has a red sticker on the back..." 
                            className="h-32"
                          />
                        </div>
                        <Button type="submit" className="w-full">Submit Claim</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No {activeTab} items found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
