using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class SessionsAdminTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Create_AsAdmin_ReturnsCreatedSession()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var dto = new SessionInputDto(permit.Id, instructor.Id, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(3), 90, 8, "Nantes centre");

        var response = await admin.PostAsJsonAsync("/api/sessions", dto);
        var session = await response.Content.ReadFromJsonAsync<SessionDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(permit.Name, session!.PermitName);
    }

    [Fact]
    public async Task Create_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("session-student"));
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var dto = new SessionInputDto(permit.Id, instructor.Id, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(3), 90, 8, "Nantes centre");

        var response = await student.PostAsJsonAsync("/api/sessions", dto);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithUnknownPermitOrInstructor_ReturnsBadRequest()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var dto = new SessionInputDto(Guid.NewGuid(), Guid.NewGuid(), SessionType.Theory, DateTimeOffset.UtcNow.AddDays(3), 90, 8, "Nantes centre");

        var response = await admin.PostAsJsonAsync("/api/sessions", dto);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_AsAdmin_ChangesTheSession()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var created = await admin.PostAsJsonAsync(
            "/api/sessions", new SessionInputDto(permit.Id, instructor.Id, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(3), 90, 8, "Nantes centre"));
        var session = await created.Content.ReadFromJsonAsync<SessionDto>(ApiJsonOptions.Default);

        var updateDto = new SessionInputDto(permit.Id, instructor.Id, SessionType.Practical, session!.StartsAt, 120, 4, "Port de Nantes");
        var response = await admin.PutAsJsonAsync($"/api/sessions/{session.Id}", updateDto);
        var updated = await response.Content.ReadFromJsonAsync<SessionDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(SessionType.Practical, updated!.Type);
        Assert.Equal(4, updated.MaxCapacity);
    }

    [Fact]
    public async Task Update_UnknownId_ReturnsNotFound()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var dto = new SessionInputDto(permit.Id, instructor.Id, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(3), 90, 8, "Nantes centre");

        var response = await admin.PutAsJsonAsync($"/api/sessions/{Guid.NewGuid()}", dto);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AsAdmin_RemovesTheSession()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var created = await admin.PostAsJsonAsync(
            "/api/sessions", new SessionInputDto(permit.Id, instructor.Id, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(3), 90, 8, "Nantes centre"));
        var session = await created.Content.ReadFromJsonAsync<SessionDto>(ApiJsonOptions.Default);

        var response = await admin.DeleteAsync($"/api/sessions/{session!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_WithExistingBookings_ReturnsBadRequest()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var created = await admin.PostAsJsonAsync(
            "/api/sessions", new SessionInputDto(permit.Id, instructor.Id, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(3), 90, 8, "Nantes centre"));
        var session = await created.Content.ReadFromJsonAsync<SessionDto>(ApiJsonOptions.Default);

        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("session-delete-blocker"));
        await student.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session!.Id));

        var response = await admin.DeleteAsync($"/api/sessions/{session.Id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<(Permit Permit, Instructor Instructor)> SeedPermitAndInstructorAsync()
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var permit = new Permit
        {
            Id = Guid.NewGuid(),
            Name = "Permis Côtier",
            Slug = $"cotier-{Guid.NewGuid():N}",
            Description = "desc",
            Price = 450m,
            IncludesTheory = true,
            IncludesPractical = true,
        };

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
        var instructor = new Instructor { Id = Guid.NewGuid(), UserId = user.Id, Bio = "Moniteur", User = user };

        db.Permits.Add(permit);
        db.Users.Add(user);
        db.Instructors.Add(instructor);
        await db.SaveChangesAsync();

        return (permit, instructor);
    }
}
