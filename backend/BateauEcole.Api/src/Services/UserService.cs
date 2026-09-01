using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;

namespace BateauEcole.Api.Services;

public class UserService(AppDbContext db)
{
    public async Task<bool> DeactivateAsync(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null)
            return false;

        user.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }
}
