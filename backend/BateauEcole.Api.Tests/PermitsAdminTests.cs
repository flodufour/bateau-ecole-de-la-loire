using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class PermitsAdminTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    private static PermitInputDto NewInput(string slugSuffix) => new(
        "Permis Côtier", $"cotier-{slugSuffix}", "desc", 450m, true, true, false);

    [Fact]
    public async Task Create_AsAdmin_ReturnsCreatedPermit()
    {
        var admin = await fixture.CreateAdminClientAsync();

        var response = await admin.PostAsJsonAsync("/api/permits", NewInput(Guid.NewGuid().ToString("N")));
        var dto = await response.Content.ReadFromJsonAsync<PermitDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Permis Côtier", dto!.Name);
    }

    [Fact]
    public async Task Create_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("permit-student"));

        var response = await student.PostAsJsonAsync("/api/permits", NewInput(Guid.NewGuid().ToString("N")));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithDuplicateSlug_ReturnsBadRequest()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var input = NewInput(Guid.NewGuid().ToString("N"));

        var first = await admin.PostAsJsonAsync("/api/permits", input);
        var second = await admin.PostAsJsonAsync("/api/permits", input);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Update_AsAdmin_ChangesThePermit()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/permits", NewInput(Guid.NewGuid().ToString("N")));
        var permit = await created.Content.ReadFromJsonAsync<PermitDto>(ApiJsonOptions.Default);

        var updateInput = new PermitInputDto(
            "Permis Côtier — mis à jour", permit!.Slug, permit.Description, permit.Price, permit.IncludesTheory, permit.IncludesPractical, permit.IsBundle);
        var response = await admin.PutAsJsonAsync($"/api/permits/{permit.Id}", updateInput);
        var updated = await response.Content.ReadFromJsonAsync<PermitDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Permis Côtier — mis à jour", updated!.Name);
    }

    [Fact]
    public async Task Update_UnknownId_ReturnsNotFound()
    {
        var admin = await fixture.CreateAdminClientAsync();

        var response = await admin.PutAsJsonAsync($"/api/permits/{Guid.NewGuid()}", NewInput(Guid.NewGuid().ToString("N")));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AsAdmin_RemovesThePermit()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/permits", NewInput(Guid.NewGuid().ToString("N")));
        var permit = await created.Content.ReadFromJsonAsync<PermitDto>(ApiJsonOptions.Default);

        var response = await admin.DeleteAsync($"/api/permits/{permit!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_WithExistingSessions_ReturnsBadRequest()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/permits", NewInput(Guid.NewGuid().ToString("N")));
        var permit = await created.Content.ReadFromJsonAsync<PermitDto>(ApiJsonOptions.Default);
        await SeedSessionForPermitAsync(permit!.Id);

        var response = await admin.DeleteAsync($"/api/permits/{permit.Id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task SeedSessionForPermitAsync(Guid permitId)
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = $"{Guid.NewGuid():N}@example.com",
            Email = $"{Guid.NewGuid():N}@example.com",
            FirstName = "Jean",
            LastName = "Dupont",
            Role = UserRole.Instructor,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var instructor = new Instructor { Id = Guid.NewGuid(), UserId = user.Id, Bio = "Moniteur" };
        var session = new Session
        {
            Id = Guid.NewGuid(),
            PermitId = permitId,
            InstructorId = instructor.Id,
            Type = SessionType.Theory,
            StartsAt = DateTimeOffset.UtcNow.AddDays(1),
            DurationMinutes = 90,
            MaxCapacity = 8,
            Location = "Nantes centre",
        };

        db.Users.Add(user);
        db.Instructors.Add(instructor);
        db.Sessions.Add(session);
        await db.SaveChangesAsync();
    }
}
