import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { About } from './about';

describe('About', () => {
  let fixture: ComponentFixture<About>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [About],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(About);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the static sections', () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.about-hero__title')?.textContent).toContain('Mini Shop');
    expect(root.querySelector('.about-story')).toBeTruthy();
    expect(root.querySelector('.about-values__grid')).toBeTruthy();
    expect(root.querySelector('.about-stats')).toBeTruthy();
  });
});
