
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from './auth-provider';
import { markNotificationAsRead, type Notification } from '@/services/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { collection, onSnapshot, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NotificationPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userNotifications = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Notification & { createdAt: Timestamp }));

        setNotifications(userNotifications as Notification[]);
        setUnreadCount(userNotifications.filter(n => !n.isRead).length);
      }, (error) => {
        console.error("Error fetching notifications in real-time: ", error);
      });
      
      return () => unsubscribe();
    }
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    await Promise.all(
      unreadNotifications.map(n => markNotificationAsRead(n.id))
    );
  };


  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 transform -translate-y-1/2 translate-x-1/2 rounded-full bg-red-500 ring-2 ring-card" />
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4"/> Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                const content = (
                  <div className="flex items-start gap-3">
                      {!notification.isRead && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className={cn("flex-1 space-y-1", notification.isRead && "pl-[14px]")}>
                          <p className="font-medium text-sm">{notification.title}</p>
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
                  </div>
                );
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 hover:bg-accent",
                      !notification.isRead && "bg-secondary/50",
                       "cursor-pointer"
                    )}
                  >
                    {notification.link ? (
                       <Link href={notification.link} className="block">
                         {content}
                       </Link>
                    ) : (
                      content
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
