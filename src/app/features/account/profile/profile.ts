import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { roleLabel } from '../../../core/utils/roles';
import { User } from '../../../core/models';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  styleUrl: './profile.scss',
  templateUrl: './profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile implements OnInit {
  private readonly auth = inject(AuthService);

  protected readonly user = signal<User | null>(null);

  protected readonly initials = computed(() => {
    const user = this.user();

    if (!user) {
      return '?';
    }

    const name = user.fullName;

    if (!name) {
      return '?';
    }

    const parts = name.trim().split(/\s+/);
    const first = parts[0];

    if (parts.length === 1) {
      return first.charAt(0).toUpperCase();
    }

    return (first.charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  });

  protected readonly roleLabel = roleLabel;

  ngOnInit(): void {
    this.user.set(this.auth.getUser());
  }
}
