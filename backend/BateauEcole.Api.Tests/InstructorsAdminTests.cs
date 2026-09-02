using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Tests.TestSupport;

namespace BateauEcole.Api.Tests;

public class InstructorsAdminTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Create_AsAdmin_ReturnsCreatedInstructor_WithAWorkingAccount()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var email = ApiTestFixtureExtensions.UniqueEmail("new-instructor");
        var dto = new CreateInstructorDto(email, "Password123!", "Jean", "Dupont", "Moniteur expérimenté", ["cotier", "hauturier"]);

        var response = await admin.PostAsJsonAsync("/api/instructors", dto);
        var instructor = await response.Content.ReadFromJsonAsync<InstructorDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Jean", instructor!.FirstName);
        Assert.Contains("cotier", instructor.Specialties);

        // The whole point: the new instructor can actually log in afterwards.
        var loginClient = fixture.CreateAuthClient();
        var (loginResponse, _) = await loginClient.LoginAsync(email, "Password123!");
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Create_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("instructor-student"));
        var dto = new CreateInstructorDto(
            ApiTestFixtureExtensions.UniqueEmail("blocked-instructor"), "Password123!", "Jean", "Dupont", "bio", []);

        var response = await student.PostAsJsonAsync("/api/instructors", dto);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithAnEmailAlreadyInUse_ReturnsBadRequest()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var email = ApiTestFixtureExtensions.UniqueEmail("dup-instructor");
        var dto = new CreateInstructorDto(email, "Password123!", "Jean", "Dupont", "bio", []);

        var first = await admin.PostAsJsonAsync("/api/instructors", dto);
        var second = await admin.PostAsJsonAsync("/api/instructors", dto);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }
}
