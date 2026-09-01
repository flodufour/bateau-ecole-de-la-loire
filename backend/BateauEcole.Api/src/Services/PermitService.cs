using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;

namespace BateauEcole.Api.Services;

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

    private static PermitDto ToDto(Models.Permit p) =>
        new(p.Id, p.Name, p.Slug, p.Description, p.Price, p.IncludesTheory, p.IncludesPractical, p.IsBundle);
}
