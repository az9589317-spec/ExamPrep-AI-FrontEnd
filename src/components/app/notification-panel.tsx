
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { type Notification, getNotifications } from '@/services/firestore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getNotifications().then(setNotifications);
    }
  }, [isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
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
                    className="p-4 hover:bg-accent cursor-pointer"
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
