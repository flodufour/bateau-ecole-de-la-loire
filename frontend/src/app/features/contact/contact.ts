import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContactService } from '../../core/services/contact.service';
import { extractApiErrors } from '../../core/utils/api-error.util';

// The school's Facebook page — a hardcoded constant, never user input, so
// bypassing Angular's iframe-src sanitization for the embed URL below is
// safe (same reasoning as the Google Map on the home page).
const FACEBOOK_PAGE_URL = 'https://www.facebook.com/833683606680871';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly sanitizer = inject(DomSanitizer);

  // adapt_container_width is only meaningful for the JS-SDK (fb-page div)
  // embed method, which resizes the resulting iframe itself. Here we embed
  // plugins/page.php directly as a plain iframe with a fixed width/height —
  // leaving that param on made Facebook render content wider than the fixed
  // 340px box, clipping text. Without it, the plugin renders correctly at
  // exactly the width asked for.
  protected readonly facebookUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(FACEBOOK_PAGE_URL)}` +
      '&tabs=timeline&width=340&height=500&small_header=true&hide_cover=false&show_facepile=false',
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected readonly submitted = signal(false);
  protected readonly submitting = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errors.set([]);
    this.submitting.set(true);
    const raw = this.form.getRawValue();

    this.contactService.submit({ ...raw, phone: raw.phone || null }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errors.set(extractApiErrors(error));
      },
    });
  }
}
