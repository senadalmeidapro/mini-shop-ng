import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer, Header } from '../components';

@Component({
  selector: 'app-main-layout',
  imports: [Header, Footer, RouterOutlet],
  styleUrl: './main-layout.scss',
  templateUrl: './main-layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {}
