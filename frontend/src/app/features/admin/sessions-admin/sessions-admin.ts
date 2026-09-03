import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Instructor } from '../../../core/models/instructor.model';
import { Permit } from '../../../core/models/permit.model';
import { Session, SessionType } from '../../../core/models/session.model';
import { InstructorService } from '../../../core/services/instructor.service';
import { PermitService } from '../../../core/services/permit.service';
import { SessionService } from '../../../core/services/session.service';
import { extractApiErrors } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-sessions-admin',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './sessions-admin.html',
  styleUrl: './sessions-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsAdmin {
  private readonly fb = inject(FormBuilder);
  private readonly sessionService = inject(SessionService);
  private readonly permitService = inject(PermitService);
  private readonly instructorService = inject(InstructorService);

  protected readonly sessions = signal<Session[]>([]);
  protected readonly permits = signal<Permit[]>([]);
  protected readonly instructors = signal<Instructor[]>([]);
  protected readonly loaded = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errors = signal<string[]>([]);
  protected readonly submitting = signal(false);

  // Lets the "Moniteur" dropdown mark the caller's own instructor profile
  // with "(moi)" — silently stays null if the Admin has no profile
  // (GET /instructors/me 404s), which is a normal, expected case.
  protected readonly myInstructorId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    permitId: ['', Validators.required],
    instructorId: ['', Validators.required],
    type: ['Theory' as SessionType, Validators.required],
    startsAt: ['', Validators.required],
    durationMinutes: [90, [Validators.required, Validators.min(1)]],
    maxCapacity: [8, [Validators.required, Validators.min(1)]],
    location: ['', Validators.required],
  });

  constructor() {
    this.permitService.getAll().subscribe((permits) => this.permits.set(permits));
    this.instructorService.getAll().subscribe((instructors) => this.instructors.set(instructors));
    this.instructorService.getMe().subscribe({
      next: (instructor) => this.myInstructorId.set(instructor.id),
      error: () => this.myInstructorId.set(null),
    });
    this.load();
  }

  protected edit(session: Session): void {
    this.editingId.set(session.id);
    this.errors.set([]);
    this.form.setValue({
      permitId: session.permitId,
      instructorId: session.instructorId,
      type: session.type,
      startsAt: toDatetimeLocal(session.startsAt),
      durationMinutes: session.durationMinutes,
      maxCapacity: session.maxCapacity,
      location: session.location,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.errors.set([]);
    this.form.reset({ type: 'Theory', durationMinutes: 90, maxCapacity: 8 });
  }

  protected submit(): void {
    if (this.submitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errors.set(['Veuillez remplir tous les champs.']);
      return;
    }

    this.errors.set([]);
    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const input = { ...raw, startsAt: new Date(raw.startsAt).toISOString() };
    const editingId = this.editingId();

    const request$ = editingId ? this.sessionService.update(editingId, input) : this.sessionService.create(input);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.cancelEdit();
        this.load();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errors.set(extractApiErrors(error));
      },
    });
  }

  protected delete(session: Session): void {
    this.errors.set([]);
    this.sessionService.delete(session.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errors.set(extractApiErrors(error)),
    });
  }

  private load(): void {
    this.sessionService.getUpcoming().subscribe((sessions) => {
      this.sessions.set(sessions);
      this.loaded.set(true);
    });
  }
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
