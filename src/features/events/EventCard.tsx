import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CampusEvent, Club } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface EventCardProps {
  event: CampusEvent;
  club?: Club;
  isRegistered?: boolean;
  onRegister?: () => void;
  className?: string;
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'contest': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'workshop': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'seminar': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export function EventCard({ event, club, isRegistered, onRegister, className }: EventCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} className={cn("h-full", className)}>
      <Card className="flex flex-col h-full overflow-hidden shadow-sm">
        {event.bannerUrl ? (
          <div className="h-32 w-full bg-cover bg-center" style={{ backgroundImage: `url(${event.bannerUrl})` }} />
        ) : (
          <div className="h-32 w-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center">
             <Calendar className="w-10 h-10 text-blue-300 opacity-50" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className={cn("text-xs font-medium border-none", getTypeColor(event.eventType))}>
              {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
            </Badge>
            {club && <span className="text-xs text-muted-foreground font-medium">{club.name}</span>}
          </div>
          <h3 className="font-bold text-lg line-clamp-2">{event.title}</h3>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDateTime(event.startTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{event.venue}</span>
            </div>
            {event.capacity !== undefined && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{(event as any).registeredCount || 0} / {event.capacity} capacity</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {isRegistered ? (
            <Button variant="secondary" className="w-full cursor-default bg-green-50 text-green-700 hover:bg-green-50 dark:bg-green-950 dark:text-green-400">
              <CheckCircle className="w-4 h-4 mr-2" />
              Registered
            </Button>
          ) : (
            <Button onClick={onRegister} className="w-full" disabled={event.capacity !== undefined && ((event as any).registeredCount || 0) >= event.capacity}>
              {event.capacity !== undefined && ((event as any).registeredCount || 0) >= event.capacity ? 'Full' : 'Register'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
