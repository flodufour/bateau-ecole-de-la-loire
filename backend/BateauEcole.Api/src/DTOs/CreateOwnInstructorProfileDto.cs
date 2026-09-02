namespace BateauEcole.Api.DTOs;

// For an Admin who is also the one giving the courses — links an instructor
// profile to their own, existing account instead of onboarding a brand new
// user (see CreateInstructorDto, which does that for separate instructor
// hires). The admin already has an account, so only the profile is needed.
public record CreateOwnInstructorProfileDto(string Bio, string[] Specialties);
