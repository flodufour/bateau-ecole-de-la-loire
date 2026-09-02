using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Tests.TestSupport;

namespace BateauEcole.Api.Tests;

public class ExamDatesAdminTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    private static ExamDateInputDto NewInput() =>
        new("cotier", DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)), "Nantes", null);

    [Fact]
    public async Task Create_AsAdmin_ReturnsCreatedExamDate()
    {
        var admin = await fixture.CreateAdminClientAsync();

        var response = await admin.PostAsJsonAsync("/api/exam-dates", NewInput());
        var dto = await response.Content.ReadFromJsonAsync<ExamDateDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("cotier", dto!.PermitType);
    }

    [Fact]
    public async Task Create_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("examdate-student"));

        var response = await student.PostAsJsonAsync("/api/exam-dates", NewInput());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Delete_AsAdmin_RemovesTheExamDate()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var created = await admin.PostAsJsonAsync("/api/exam-dates", NewInput());
        var dto = await created.Content.ReadFromJsonAsync<ExamDateDto>(ApiJsonOptions.Default);

        var response = await admin.DeleteAsync($"/api/exam-dates/{dto!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_UnknownId_ReturnsNotFound()
    {
        var admin = await fixture.CreateAdminClientAsync();

        var response = await admin.DeleteAsync($"/api/exam-dates/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
