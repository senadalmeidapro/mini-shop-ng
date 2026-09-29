import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface AboutValue {
  title: string;
  desc: string;
}

interface AboutStat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-about',
  imports: [NgClass, RouterLink],
  styleUrl: './about.scss',
  templateUrl: './about.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly values: AboutValue[] = [
    {
      title: 'Qualité',
      desc: 'Chaque produit est rigoureusement sélectionné pour vous garantir le meilleur.',
    },
    {
      title: 'Confiance',
      desc: 'Transparence totale sur nos prix, nos engagements et la protection de vos données.',
    },
    {
      title: 'Passion',
      desc: 'Une équipe passionnée qui travaille chaque jour pour vous offrir le meilleur.',
    },
  ];

  protected readonly stats: AboutStat[] = [
    { value: '2024', label: 'Année de création' },
    { value: '500+', label: 'Produits' },
    { value: '10K+', label: 'Clients satisfaits' },
    { value: '99%', label: 'Taux de satisfaction' },
  ];

  protected revealDelay(index: number): number {
    return Math.min(index + 1, 6);
  }
}
