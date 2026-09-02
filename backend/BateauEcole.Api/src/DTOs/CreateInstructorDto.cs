using System.ComponentModel.DataAnnotations;

namespace BateauEcole.Api.DTOs;

// Creates both the underlying account and the instructor profile in one call
// — there was previously no way to onboard an instructor at all (only
// PUT /instructors/{id}/availability existed, which needs a profile to
// already exist), and a new instructor doesn't have an account yet either.
public record CreateInstructorDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FirstName,
    [Required] string LastName,
    string Bio,
    string[] Specialties);
