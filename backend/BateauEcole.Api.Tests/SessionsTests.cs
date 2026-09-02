using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class SessionsTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task GetUpcoming_ExcludesPastSessions()
    {
        var client = fixture.CreateClient();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();

        var past = await SeedSessionAsync(permit, instructor, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(-1));
        var future = await SeedSessionAsync(permit, instructor, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(1));

        var response = await client.GetAsync("/api/sessions");
        var sessions = await response.Content.ReadFromJsonAsync<List<SessionDto>>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(sessions!, s => s.Id == future.Id);
        Assert.DoesNotContain(sessions!, s => s.Id == past.Id);
    }

    [Fact]
    public async Task GetUpcoming_FilteredByType_OnlyReturnsMatchingSessions()
    {
        var client = fixture.CreateClient();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();

        var theory = await SeedSessionAsync(permit, instructor, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(1));
        var practical = await SeedSessionAsync(permit, instructor, SessionType.Practical, DateTimeOffset.UtcNow.AddDays(1));

        var response = await client.GetAsync("/api/sessions?type=Theory");
        var sessions = await response.Content.ReadFromJsonAsync<List<SessionDto>>(ApiJsonOptions.Default);

        Assert.Contains(sessions!, s => s.Id == theory.Id);
        Assert.DoesNotContain(sessions!, s => s.Id == practical.Id);
    }

    [Fact]
    public async Task GetUpcoming_FilteredByInstructor_OnlyReturnsTheirSessions()
    {
        var client = fixture.CreateClient();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var (_, otherInstructor) = await SeedPermitAndInstructorAsync();

        var own = await SeedSessionAsync(permit, instructor, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(1));
        var other = await SeedSessionAsync(permit, otherInstructor, SessionType.Theory, DateTimeOffset.UtcNow.AddDays(1));

        var response = await client.GetAsync($"/api/sessions?instructorId={instructor.Id}");
        var sessions = await response.Content.ReadFromJsonAsync<List<SessionDto>>(ApiJsonOptions.Default);

        Assert.Contains(sessions!, s => s.Id == own.Id);
        Assert.DoesNotContain(sessions!, s => s.Id == other.Id);
    }

    [Fact]
    public async Task GetById_ReturnsPermitAndInstructorNames_FromTheJoin()
    {
        var client = fixture.CreateClient();
        var (permit, instructor) = await SeedPermitAndInstructorAsync();
        var session = await SeedSessionAsync(permit, instructor, SessionType.Practical, DateTimeOffset.UtcNow.AddDays(2));

        var response = await client.GetAsync($"/api/sessions/{session.Id}");
        var dto = await response.Content.ReadFromJsonAsync<SessionDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(permit.Name, dto!.PermitName);
        Assert.Contains(instructor.User.FirstName, dto.InstructorName);
    }

    [Fact]
    public async Task GetById_WithUnknownId_ReturnsNotFound()
    {
        var client = fixture.CreateClient();

        var response = await client.GetAsync($"/api/sessions/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
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

    private async Task<Session> SeedSessionAsync(Permit permit, Instructor instructor, SessionType type, DateTimeOffset startsAt)
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var session = new Session
        {
            Id = Guid.NewGuid(),
            PermitId = permit.Id,
            InstructorId = instructor.Id,
            Type = type,
            StartsAt = startsAt,
            DurationMinutes = 90,
            MaxCapacity = 8,
            Location = "Nantes centre",
        };
        db.Sessions.Add(session);
        await db.SaveChangesAsync();
        return session;
    }
}
