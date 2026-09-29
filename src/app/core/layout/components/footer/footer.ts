import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly year = new Date().getFullYear();

  readonly publicLinks = [
    { label: 'Accueil', to: '' },
    { label: 'Produits', to: '/products' },
    { label: 'Boutiques', to: '/shops' },
    { label: 'À propos', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  readonly authlinks = [
    { label: 'Connexion', to: '/auth/login' },
    { label: 'Inscription', to: '/auth/register' },
  ];
}
