import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ContactMessage } from '../../../core/models/contact-message.model';
import { MessagesAdmin } from './messages-admin';

describe('MessagesAdmin', () => {
  let fixture: ComponentFixture<MessagesAdmin>;
  let element: HTMLElement;
  let httpMock: HttpTestingController;

  const message: ContactMessage = {
    id: 'c1',
    name: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '0762463741',
    message: 'Je souhaite des informations.',
    createdAt: '2026-09-02T10:00:00Z',
  };

  function createAndFlushInitialLoad(): void {
    fixture = TestBed.createComponent(MessagesAdmin);
    element = fixture.nativeElement;
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/contact`).flush([message]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists the submitted messages', () => {
    createAndFlushInitialLoad();

    expect(element.textContent).toContain('Jean Dupont');
    expect(element.textContent).toContain('Je souhaite des informations.');
  });

  it('shows an empty-state message when there are none', () => {
    fixture = TestBed.createComponent(MessagesAdmin);
    element = fixture.nativeElement;
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiUrl}/contact`).flush([]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucun message.');
  });

  it('deletes a message and removes it from the list', () => {
    createAndFlushInitialLoad();

    element.querySelector<HTMLButtonElement>('.admin-table__actions button')!.click();

    httpMock.expectOne(`${environment.apiUrl}/contact/${message.id}`).flush(null);
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucun message.');
  });
});
