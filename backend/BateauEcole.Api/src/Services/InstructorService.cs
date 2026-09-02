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

    public async Task<InstructorDto?> GetByUserIdAsync(Guid userId)
    {
        var instructor = await db.Instructors
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.UserId == userId);

        return instructor is null ? null : ToDto(instructor);
    }

    public async Task<bool> IsOwnedByUserAsync(Guid instructorId, Guid userId) =>
        await db.Instructors.AnyAsync(i => i.Id == instructorId && i.UserId == userId);

    public async Task<List<AvailabilitySlotDto>> GetAvailabilityAsync(Guid instructorId)
    {
        var slots = await db.AvailabilitySlots
            .Where(a => a.InstructorId == instructorId && a.EndsAt >= DateTimeOffset.UtcNow)
            .OrderBy(a => a.StartsAt)
            .ToListAsync();

        return slots.Select(ToAvailabilityDto).ToList();
    }

    public async Task<(AvailabilitySlotDto? Result, string[] Errors)> AddAvailabilityAsync(
        Guid instructorId, CreateAvailabilitySlotDto dto)
    {
        if (dto.EndsAt <= dto.StartsAt)
            return (null, ["L'heure de fin doit être après l'heure de début."]);

        if (dto.StartsAt <= DateTimeOffset.UtcNow)
            return (null, ["Impossible d'ajouter un créneau dans le passé."]);

        var overlaps = await db.AvailabilitySlots.AnyAsync(a =>
            a.InstructorId == instructorId && a.StartsAt < dto.EndsAt && dto.StartsAt < a.EndsAt);
        if (overlaps)
            return (null, ["Ce créneau chevauche un créneau existant."]);

        var slot = new AvailabilitySlot
        {
            Id = Guid.NewGuid(),
            InstructorId = instructorId,
            StartsAt = dto.StartsAt,
            EndsAt = dto.EndsAt,
        };

        db.AvailabilitySlots.Add(slot);
        await db.SaveChangesAsync();

        return (ToAvailabilityDto(slot), []);
    }

    public async Task<bool> DeleteAvailabilityAsync(Guid instructorId, Guid slotId)
    {
        var slot = await db.AvailabilitySlots.FirstOrDefaultAsync(a => a.Id == slotId && a.InstructorId == instructorId);
        if (slot is null)
            return false;

        db.AvailabilitySlots.Remove(slot);
        await db.SaveChangesAsync();
        return true;
    }

    // Links a fresh instructor profile to an *existing* user (an Admin who
    // will also teach) — unlike CreateAsync, which onboards a brand new
    // Instructor-role account for someone else.
    public async Task<(InstructorDto? Result, string[] Errors)> CreateForOwnAccountAsync(
        Guid userId, CreateOwnInstructorProfileDto dto)
    {
        if (await db.Instructors.AnyAsync(i => i.UserId == userId))
            return (null, ["Vous avez déjà un profil moniteur."]);

        var user = await db.Users.FindAsync(userId);
        var instructor = new Instructor
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            User = user!,
            Bio = dto.Bio,
            Specialties = dto.Specialties,
        };

        db.Instructors.Add(instructor);
        await db.SaveChangesAsync();

        return (ToDto(instructor), []);
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

    private static AvailabilitySlotDto ToAvailabilityDto(AvailabilitySlot a) =>
        new(a.Id, a.InstructorId, a.StartsAt, a.EndsAt);
}
