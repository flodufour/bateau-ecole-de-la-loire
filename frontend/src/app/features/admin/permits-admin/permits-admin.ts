import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Permit } from '../../../core/models/permit.model';
import { PermitService } from '../../../core/services/permit.service';
import { extractApiErrors } from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-permits-admin',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './permits-admin.html',
  styleUrl: './permits-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermitsAdmin {
  private readonly fb = inject(FormBuilder);
  private readonly permitService = inject(PermitService);

  protected readonly permits = signal<Permit[]>([]);
  protected readonly loaded = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected readonly errors = signal<string[]>([]);
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    includesTheory: [false],
    includesPractical: [false],
    isBundle: [false],
  });

  constructor() {
    this.load();
  }

  protected edit(permit: Permit): void {
    this.editingId.set(permit.id);
    this.errors.set([]);
    this.form.setValue({
      name: permit.name,
      slug: permit.slug,
      description: permit.description,
      price: permit.price,
      includesTheory: permit.includesTheory,
      includesPractical: permit.includesPractical,
      isBundle: permit.isBundle,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.errors.set([]);
    this.form.reset({ price: 0, includesTheory: false, includesPractical: false, isBundle: false });
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
    const input = this.form.getRawValue();
    const editingId = this.editingId();

    const request$ = editingId ? this.permitService.update(editingId, input) : this.permitService.create(input);

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

  protected delete(permit: Permit): void {
    this.errors.set([]);
    this.permitService.delete(permit.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.errors.set(extractApiErrors(error)),
    });
  }

  private load(): void {
    this.permitService.getAll().subscribe((permits) => {
      this.permits.set(permits);
      this.loaded.set(true);
    });
  }
}
