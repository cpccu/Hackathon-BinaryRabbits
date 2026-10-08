import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Bell, Calendar, BookOpen, AlertTriangle, CheckCircle, PackageSearch, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/feedback/LoadingState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { AppNotification } from '@/types';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const mockUserId = 'user-123';

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'notifications'), where('userId', '==', mockUserId));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
        setNotifications(data.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, 'notifications', n.id), { isRead: true })));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'resource': return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'urgent_notice': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'complaint_update': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'lost_found': return <PackageSearch className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) return <LoadingState variant="full" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCircle className="w-4 h-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <Card key={notification.id} className={cn("transition-colors", !notification.read ? "bg-primary/5 border-primary/20" : "")}>
              <CardContent className="p-4 flex gap-4">
                <div className="mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={cn("font-semibold", !notification.read && "text-primary")}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  
                  {notification.link && (
                    <Button variant="link" className="p-0 h-auto mt-2 text-sm" onClick={() => {
                      if (!notification.read) handleMarkAsRead(notification.id);
                      window.location.href = notification.link || '/';
                    }}>
                      View Details
                    </Button>
                  )}
                </div>
                {!notification.read && (
                  <div className="flex flex-col items-end justify-between">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => handleMarkAsRead(notification.id)}>
                      Mark Read
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState icon={Bell} title="All caught up!" description="You don't have any notifications at the moment." />
        )}
      </div>
    </div>
  );
}
