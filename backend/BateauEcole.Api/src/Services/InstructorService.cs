using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public class InstructorService(AppDbContext db, UserManager<User> userManager)
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

    public async Task<(InstructorDto? Result, string[] Errors)> CreateAsync(CreateInstructorDto dto)
    {
        var user = new User
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = UserRole.Instructor,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var createResult = await userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
            return (null, createResult.Errors.Select(e => e.Description).ToArray());

        var instructor = new Instructor
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Bio = dto.Bio,
            Specialties = dto.Specialties,
        };

        db.Instructors.Add(instructor);
        await db.SaveChangesAsync();

        return (ToDto(instructor), []);
    }

    private static InstructorDto ToDto(Instructor i) =>
        new(i.Id, i.User.FirstName, i.User.LastName, i.Bio, i.PhotoUrl, i.Specialties);
}
