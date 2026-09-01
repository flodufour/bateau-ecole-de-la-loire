using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class InstructorsTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task GetById_JoinsUser_AndReturnsNameFromIt()
    {
        var client = fixture.CreateClient();
        var instructor = await SeedInstructorAsync("Jean", "Dupont");

        var response = await client.GetAsync($"/api/instructors/{instructor.Id}");
        var dto = await response.Content.ReadFromJsonAsync<InstructorDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Jean", dto!.FirstName);
        Assert.Equal("Dupont", dto.LastName);
        Assert.Contains("cotier", dto.Specialties);
    }

    [Fact]
    public async Task GetById_WithUnknownId_ReturnsNotFound()
    {
        var client = fixture.CreateClient();

        var response = await client.GetAsync($"/api/instructors/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<Instructor> SeedInstructorAsync(string firstName, string lastName)
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = $"{Guid.NewGuid():N}@example.com",
            Email = $"{Guid.NewGuid():N}@example.com",
            FirstName = firstName,
            LastName = lastName,
            Role = UserRole.Instructor,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var instructor = new Instructor
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Bio = "Moniteur",
            Specialties = ["cotier"],
        };

        db.Users.Add(user);
        db.Instructors.Add(instructor);
        await db.SaveChangesAsync();
        return instructor;
    }
}
