using Microsoft.EntityFrameworkCore;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;

namespace BateauEcole.Api.Services;

public class ContactService(AppDbContext db)
{
    public async Task<ContactMessageDto> SubmitAsync(CreateContactMessageDto dto)
    {
        var message = new ContactMessage
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Message = dto.Message,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        db.ContactMessages.Add(message);
        await db.SaveChangesAsync();

        return ToDto(message);
    }

    public async Task<List<ContactMessageDto>> GetAllAsync()
    {
        var messages = await db.ContactMessages.OrderByDescending(m => m.CreatedAt).ToListAsync();
        return messages.Select(ToDto).ToList();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var message = await db.ContactMessages.FindAsync(id);
        if (message is null)
            return false;

        db.ContactMessages.Remove(message);
        await db.SaveChangesAsync();
        return true;
    }

    private static ContactMessageDto ToDto(ContactMessage m) =>
        new(m.Id, m.Name, m.Email, m.Phone, m.Message, m.CreatedAt);
}
