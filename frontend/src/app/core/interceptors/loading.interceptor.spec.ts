import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LoadingService } from '../services/loading.service';
import { loadingInterceptor } from './loading.interceptor';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([loadingInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => httpMock.verify());

  it('is loading while the request is in flight, and stops once it completes', () => {
    http.get('/api/permits').subscribe();

    expect(loading.isLoading()).toBeTrue();

    httpMock.expectOne('/api/permits').flush([]);

    expect(loading.isLoading()).toBeFalse();
  });

  it('stops loading even when the request errors', () => {
    http.get('/api/permits').subscribe({ error: () => {} });

    httpMock.expectOne('/api/permits').flush(null, { status: 500, statusText: 'Server Error' });

    expect(loading.isLoading()).toBeFalse();
  });
});
