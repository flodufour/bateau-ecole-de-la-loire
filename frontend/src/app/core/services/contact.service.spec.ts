import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ContactMessage } from '../models/contact-message.model';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let httpMock: HttpTestingController;

  const message: ContactMessage = {
    id: 'c1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '0762463741',
    message: 'Je souhaite des informations.',
    createdAt: '2026-09-02T10:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('submit posts the contact message request', () => {
    const request = { name: message.name, email: message.email, phone: message.phone, message: message.message };
    let result: ContactMessage | undefined;
    service.submit(request).subscribe((m) => (result = m));

    const req = httpMock.expectOne(`${environment.apiUrl}/contact`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(message);

    expect(result).toEqual(message);
  });

  it('getAll fetches the message list', () => {
    let result: ContactMessage[] | undefined;
    service.getAll().subscribe((messages) => (result = messages));

    httpMock.expectOne(`${environment.apiUrl}/contact`).flush([message]);

    expect(result).toEqual([message]);
  });

  it('delete removes the message by id', () => {
    let completed = false;
    service.delete(message.id).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${environment.apiUrl}/contact/${message.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBeTrue();
  });
});
