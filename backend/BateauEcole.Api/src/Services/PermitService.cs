using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public enum DeletePermitResult { Success, NotFound, HasSessions }

public record UpdatePermitResult(PermitDto? Permit, bool NotFound, string[] Errors);

public class PermitService(AppDbContext db)
{
    public async Task<List<PermitDto>> GetAllAsync()
    {
        var permits = await db.Permits.OrderBy(p => p.Name).ToListAsync();
        return permits.Select(ToDto).ToList();
    }

    public async Task<PermitDto?> GetByIdAsync(Guid id)
    {
        var permit = await db.Permits.FindAsync(id);
        return permit is null ? null : ToDto(permit);
    }

    public async Task<(PermitDto? Result, string[] Errors)> CreateAsync(PermitInputDto dto)
    {
        if (await db.Permits.AnyAsync(p => p.Slug == dto.Slug))
            return (null, ["Ce slug est déjà utilisé par un autre permis."]);

        var permit = new Permit
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Slug = dto.Slug,
            Description = dto.Description,
            Price = dto.Price,
            IncludesTheory = dto.IncludesTheory,
            IncludesPractical = dto.IncludesPractical,
            IsBundle = dto.IsBundle,
        };

        db.Permits.Add(permit);
        await db.SaveChangesAsync();

        return (ToDto(permit), []);
    }

    public async Task<UpdatePermitResult> UpdateAsync(Guid id, PermitInputDto dto)
    {
        var permit = await db.Permits.FindAsync(id);
        if (permit is null)
            return new UpdatePermitResult(null, NotFound: true, []);

        if (await db.Permits.AnyAsync(p => p.Slug == dto.Slug && p.Id != id))
            return new UpdatePermitResult(null, NotFound: false, ["Ce slug est déjà utilisé par un autre permis."]);

        permit.Name = dto.Name;
        permit.Slug = dto.Slug;
        permit.Description = dto.Description;
        permit.Price = dto.Price;
        permit.IncludesTheory = dto.IncludesTheory;
        permit.IncludesPractical = dto.IncludesPractical;
        permit.IsBundle = dto.IsBundle;

        await db.SaveChangesAsync();
        return new UpdatePermitResult(ToDto(permit), NotFound: false, []);
    }

    public async Task<DeletePermitResult> DeleteAsync(Guid id)
    {
        var permit = await db.Permits.FindAsync(id);
        if (permit is null)
            return DeletePermitResult.NotFound;

        if (await db.Sessions.AnyAsync(s => s.PermitId == id))
            return DeletePermitResult.HasSessions;

        db.Permits.Remove(permit);
        await db.SaveChangesAsync();
        return DeletePermitResult.Success;
    }

    private static PermitDto ToDto(Permit p) =>
        new(p.Id, p.Name, p.Slug, p.Description, p.Price, p.IncludesTheory, p.IncludesPractical, p.IsBundle);
}
