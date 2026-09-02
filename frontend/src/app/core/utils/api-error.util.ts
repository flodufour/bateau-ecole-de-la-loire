import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models/api-error.model';

// The backend returns { errors: string[] } on validation/auth failures
// (BadRequest(new { errors }), Unauthorized(new { errors })) — this pulls
// those out, falling back to a generic message for anything else (a network
// failure, a 500, a shape we don't recognize).
export function extractApiErrors(error: unknown): string[] {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as ApiErrorBody | null;
    if (body?.errors?.length) return body.errors;
  }
  return ['Une erreur est survenue. Merci de réessayer.'];
}
