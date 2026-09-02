import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AvailabilitySlot } from '../../core/models/availability-slot.model';
import { Session } from '../../core/models/session.model';
import { InstructorService } from '../../core/services/instructor.service';
import { SessionService } from '../../core/services/session.service';
import { extractApiErrors } from '../../core/utils/api-error.util';

@Component({
  selector: 'app-instructor-portal',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './instructor-portal.html',
  styleUrl: './instructor-portal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorPortal {
  private readonly fb = inject(FormBuilder);
  private readonly instructorService = inject(InstructorService);
  private readonly sessionService = inject(SessionService);

  private instructorId: string | null = null;

  protected readonly sessions = signal<Session[]>([]);
  protected readonly availability = signal<AvailabilitySlot[]>([]);
  protected readonly loaded = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
  });

  constructor() {
    this.instructorService.getMe().subscribe({
      next: (instructor) => {
        this.instructorId = instructor.id;
        this.loadSessions();
        this.loadAvailability();
      },
      error: () => this.loaded.set(true),
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting() || !this.instructorId) {
      this.form.markAllAsTouched();
      return;
    }

    this.errors.set([]);
    this.submitting.set(true);
    const raw = this.form.getRawValue();

    this.instructorService
      .addAvailability(this.instructorId, {
        startsAt: new Date(raw.startsAt).toISOString(),
        endsAt: new Date(raw.endsAt).toISOString(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.form.reset();
          this.loadAvailability();
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.errors.set(extractApiErrors(error));
        },
      });
  }

  protected deleteSlot(slot: AvailabilitySlot): void {
    if (!this.instructorId) return;

    this.errors.set([]);
    this.instructorService.deleteAvailability(this.instructorId, slot.id).subscribe({
      next: () => this.loadAvailability(),
      error: (error: unknown) => this.errors.set(extractApiErrors(error)),
    });
  }

  private loadSessions(): void {
    this.sessionService.getUpcoming({ instructorId: this.instructorId! }).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  private loadAvailability(): void {
    this.instructorService.getAvailability(this.instructorId!).subscribe((slots) => this.availability.set(slots));
  }
}
