using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;

namespace BateauEcole.Api.Services;

public class InstructorService(AppDbContext db)
{
    public async Task<List<InstructorDto>> GetAllAsync()
    {
        var instructors = await db.Instructors
            .Include(i => i.User)
            .OrderBy(i => i.User.LastName)
            .ToListAsync();

        return instructors.Select(ToDto).ToList();
    }

    public async Task<InstructorDto?> GetByIdAsync(Guid id)
    {
        var instructor = await db.Instructors
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.Id == id);

        return instructor is null ? null : ToDto(instructor);
    }

    private static InstructorDto ToDto(Models.Instructor i) =>
        new(i.Id, i.User.FirstName, i.User.LastName, i.Bio, i.PhotoUrl, i.Specialties);
}
