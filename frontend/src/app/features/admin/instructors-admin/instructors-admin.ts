import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Instructor } from '../../../core/models/instructor.model';
import { InstructorService } from '../../../core/services/instructor.service';
import { extractApiErrors } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-instructors-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './instructors-admin.html',
  styleUrl: './instructors-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorsAdmin {
  private readonly fb = inject(FormBuilder);
  private readonly instructorService = inject(InstructorService);

  protected readonly instructors = signal<Instructor[]>([]);
  protected readonly loaded = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    bio: ['', Validators.required],
    specialtiesText: [''],
  });

  constructor() {
    this.load();
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errors.set([]);
    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const specialties = raw.specialtiesText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    this.instructorService
      .create({
        email: raw.email,
        password: raw.password,
        firstName: raw.firstName,
        lastName: raw.lastName,
        bio: raw.bio,
        specialties,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.form.reset();
          this.load();
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.errors.set(extractApiErrors(error));
        },
      });
  }

  private load(): void {
    this.instructorService.getAll().subscribe((instructors) => {
      this.instructors.set(instructors);
      this.loaded.set(true);
    });
  }
}
