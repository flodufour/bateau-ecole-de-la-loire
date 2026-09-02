// Matches the { errors: string[] } shape the backend returns on 400/401
// responses (see AuthController/BookingsController's BadRequest(new { errors })).
export interface ApiErrorBody {
  errors?: string[];
}
