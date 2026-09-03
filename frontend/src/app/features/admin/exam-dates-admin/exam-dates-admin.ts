import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExamDate } from '../../../core/models/exam-date.model';
import { ExamDateService } from '../../../core/services/exam-date.service';
import { extractApiErrors } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-exam-dates-admin',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './exam-dates-admin.html',
  styleUrl: './exam-dates-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamDatesAdmin {
  private readonly fb = inject(FormBuilder);
  private readonly examDateService = inject(ExamDateService);

  protected readonly examDates = signal<ExamDate[]>([]);
  protected readonly loaded = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    permitType: ['', Validators.required],
    date: ['', Validators.required],
    location: ['', Validators.required],
    notes: [''],
  });

  constructor() {
    this.load();
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

    this.examDateService.create({ ...raw, notes: raw.notes || null }).subscribe({
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

  protected delete(examDate: ExamDate): void {
    this.errors.set([]);
    this.examDateService.delete(examDate.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errors.set(extractApiErrors(error)),
    });
  }

  private load(): void {
    this.examDateService.getUpcoming().subscribe((examDates) => {
      this.examDates.set(examDates);
      this.loaded.set(true);
    });
  }
}
