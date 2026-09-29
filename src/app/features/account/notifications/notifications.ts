import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { NotificationStore } from '../../data-access/notification.store';

@Component({
  selector: 'app-notifications',
  imports: [NgClass],
  styleUrl: './notifications.scss',
  templateUrl: './notifications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notifications implements OnInit {
  private readonly notificationStore = inject(NotificationStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly notifications = this.notificationStore.notifications;
  protected readonly unreadCount = this.notificationStore.unreadCount;

  ngOnInit(): void {
    this.notificationStore.getNotifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected markAsRead(id: string): void {
    this.notificationStore.markAsRead(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected markAllAsRead(): void {
    this.notificationStore.markAllAsRead().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected formatDate(value?: string): string {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleString('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }
}
