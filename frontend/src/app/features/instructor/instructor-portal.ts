import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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

  // Only reachable by an Admin: an Instructor-role account always already
  // has a profile (POST /instructors creates both atomically), so a 404
  // here means an Admin who also teaches hasn't linked their own yet.
  protected readonly needsProfile = signal(false);
  protected readonly creatingProfile = signal(false);
  protected readonly profileErrors = signal<string[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
  });

  protected readonly profileForm = this.fb.nonNullable.group({
    bio: ['', Validators.required],
    specialties: [''],
  });

  constructor() {
    this.loadProfile();
  }

  protected createProfile(): void {
    if (this.profileForm.invalid || this.creatingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileErrors.set([]);
    this.creatingProfile.set(true);
    const raw = this.profileForm.getRawValue();
    const specialties = raw.specialties
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.instructorService.createMyProfile({ bio: raw.bio, specialties }).subscribe({
      next: () => {
        this.creatingProfile.set(false);
        this.loadProfile();
      },
      error: (error: unknown) => {
        this.creatingProfile.set(false);
        this.profileErrors.set(extractApiErrors(error));
      },
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

  private loadProfile(): void {
    this.instructorService.getMe().subscribe({
      next: (instructor) => {
        this.instructorId = instructor.id;
        this.needsProfile.set(false);
        this.loadSessions();
        this.loadAvailability();
      },
      error: (error: unknown) => {
        this.needsProfile.set(error instanceof HttpErrorResponse && error.status === 404);
        this.loaded.set(true);
      },
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
