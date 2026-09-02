import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ContactMessage } from '../../../core/models/contact-message.model';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-messages-admin',
  imports: [DatePipe],
  templateUrl: './messages-admin.html',
  styleUrl: './messages-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesAdmin {
  private readonly contactService = inject(ContactService);

  protected readonly messages = signal<ContactMessage[]>([]);
  protected readonly loaded = signal(false);

  constructor() {
    this.load();
  }

  protected delete(message: ContactMessage): void {
    this.contactService.delete(message.id).subscribe(() => {
      this.messages.update((messages) => messages.filter((m) => m.id !== message.id));
    });
  }

  private load(): void {
    this.contactService.getAll().subscribe((messages) => {
      this.messages.set(messages);
      this.loaded.set(true);
    });
  }
}
