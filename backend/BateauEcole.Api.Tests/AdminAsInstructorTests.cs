using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Tests.TestSupport;

namespace BateauEcole.Api.Tests;

// Covers an Admin who also teaches — the one confirmed real case for a user
// needing more than their single role's endpoints (see backend/docs/api.md).
public class AdminAsInstructorTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task CreateMyProfile_AsAdmin_CreatesIt_AndGetMeReturnsIt()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var dto = new CreateOwnInstructorProfileDto("Moniteur et gérant", ["cotier", "hauturier"]);

        var response = await admin.PostAsJsonAsync("/api/instructors/me", dto);
        var created = await response.Content.ReadFromJsonAsync<InstructorDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("cotier", created!.Specialties);

        var meResponse = await admin.GetAsync("/api/instructors/me");
        var me = await meResponse.Content.ReadFromJsonAsync<InstructorDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        Assert.Equal(created.Id, me!.Id);
    }

    [Fact]
    public async Task CreateMyProfile_WhenAlreadyExists_ReturnsBadRequest()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var dto = new CreateOwnInstructorProfileDto("Moniteur", []);
        await admin.PostAsJsonAsync("/api/instructors/me", dto);

        var response = await admin.PostAsJsonAsync("/api/instructors/me", dto);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateMyProfile_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("admin-instructor-student"));
        var dto = new CreateOwnInstructorProfileDto("Moniteur", []);

        var response = await student.PostAsJsonAsync("/api/instructors/me", dto);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetMe_AsAdminWithoutProfile_ReturnsNotFound()
    {
        var admin = await fixture.CreateAdminClientAsync();

        var response = await admin.GetAsync("/api/instructors/me");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task AddAndDeleteAvailability_AsAdminWithOwnProfile_Succeeds()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var created = await admin.PostAsJsonAsync(
            "/api/instructors/me", new CreateOwnInstructorProfileDto("Moniteur", []));
        var instructor = await created.Content.ReadFromJsonAsync<InstructorDto>(ApiJsonOptions.Default);

        var start = DateTimeOffset.UtcNow.AddDays(2);
        var addResponse = await admin.PostAsJsonAsync(
            $"/api/instructors/{instructor!.Id}/availability",
            new CreateAvailabilitySlotDto(start, start.AddHours(2)));
        var slot = await addResponse.Content.ReadFromJsonAsync<AvailabilitySlotDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, addResponse.StatusCode);

        var deleteResponse = await admin.DeleteAsync($"/api/instructors/{instructor.Id}/availability/{slot!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }
}
