import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { Http } from './http';

describe('Http', () => {
  let service: Http;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(Http);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
