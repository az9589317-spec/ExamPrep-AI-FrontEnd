
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { type Notification, getNotifications, markNotificationsAsRead } from '@/services/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getNotifications().then(data => {
      const sorted = data.sort((a, b) => (b.createdAt as any).seconds - (a.createdAt as any).seconds);
      setNotifications(sorted);
    });
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
        // When panel is opened, mark all currently unread notifications as read.
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
        if (unreadIds.length > 0) {
            await markNotificationsAsRead(unreadIds);
            // Optimistically update the UI to reflect the change immediately
            setNotifications(prev => prev.map(n => ({...n, isRead: true})));
        }
    }
  };


  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute top-0 right-0 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
        </div>
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                const content = (
                  <div className="flex items-start gap-3">
                      <div className={cn("flex-1 space-y-1")}>
                          <p className={cn("font-medium text-sm", !notification.isRead && "font-bold")}>{notification.title}</p>
                          {notification.imageUrl && (
                              <div className="relative aspect-video w-full overflow-hidden rounded-md my-2">
                                  <Image 
                                      src={notification.imageUrl} 
                                      alt={notification.title} 
                                      fill 
                                      className="object-cover"
                                  />
                              </div>
                          )}
                          <p className="text-xs text-muted-foreground">{notification.description}</p>
                          <p className="text-xs text-muted-foreground pt-1">
                              {formatDistanceToNow(new Date((notification.createdAt as any).seconds * 1000), { addSuffix: true })}
                          </p>
                      </div>
                      {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-2" />}
                  </div>
                );
                return (
                  <div
                    key={notification.id}
                    className={cn("p-4 hover:bg-accent", !notification.isRead && "bg-secondary")}
                  >
                    {notification.link ? (
                       <Link href={notification.link} className="block" onClick={() => setIsOpen(false)}>
                         {content}
                       </Link>
                    ) : (
                      <div className="cursor-default">{content}</div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>You have no new notifications.</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
