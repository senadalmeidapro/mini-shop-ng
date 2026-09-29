import { DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { Review } from '../../../core/models';
import { ReviewStore } from '../../data-access/review.store';

@Component({
  selector: 'app-admin-reviews',
  imports: [DatePipe, DecimalPipe],
  styleUrl: './admin-reviews.scss',
  templateUrl: './admin-reviews.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReviews implements OnInit {
  private readonly reviewStore = inject(ReviewStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reviews = this.reviewStore.reviews;
  protected readonly loading = signal(true);
  protected readonly busyId = signal<string | null>(null);

  protected readonly stars = [0, 1, 2, 3, 4];

  protected readonly averageRating = computed(() => {
    const rated = this.reviews().filter((review) => (review.rating ?? 0) > 0);
    if (rated.length === 0) {
      return 0;
    }

    const total = rated.reduce((sum, review) => sum + (review.rating ?? 0), 0);
    return total / rated.length;
  });

  ngOnInit(): void {
    this.reviewStore
      .getReviews()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected initialsOf(review: Review): string {
    const source = review.user?.fullName?.trim() || review.user?.email || 'Client';
    return source.charAt(0).toUpperCase();
  }

  protected deleteReview(id: string): void {
    this.busyId.set(id);

    this.reviewStore
      .deleteReview(id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
