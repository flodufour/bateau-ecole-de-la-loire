import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('starts not loading', () => {
    expect(service.isLoading()).toBeFalse();
  });

  it('is loading while at least one request is active', () => {
    service.start();
    expect(service.isLoading()).toBeTrue();
  });

  it('stops loading once every active request has stopped', () => {
    service.start();
    service.start();
    service.stop();
    expect(service.isLoading()).toBeTrue();

    service.stop();
    expect(service.isLoading()).toBeFalse();
  });

  it('never goes negative when stop is called more than start', () => {
    service.stop();
    service.stop();
    service.start();
    expect(service.isLoading()).toBeTrue();

    service.stop();
    expect(service.isLoading()).toBeFalse();
  });
});
