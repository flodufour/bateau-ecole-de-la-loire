using System.Net;
using BateauEcole.Api.Data;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class UsersTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Deactivate_AsAdmin_SetsIsActiveFalse_AndBlocksTargetsLoginAfterwards()
    {
        var targetClient = fixture.CreateAuthClient();
        var targetEmail = ApiTestFixtureExtensions.UniqueEmail("target");
        await targetClient.RegisterAsync(targetEmail, "Password123!");
        var targetId = await GetUserIdAsync(targetEmail);

        var adminClient = await fixture.CreateAdminClientAsync();

        var deleteResponse = await adminClient.DeleteAsync($"/api/users/{targetId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var target = await db.Users.SingleAsync(u => u.Id == targetId);
        Assert.False(target.IsActive);
    }

    [Fact]
    public async Task Deactivate_AsStudent_ReturnsForbidden()
    {
        var studentClient = fixture.CreateAuthClient();
        var studentEmail = ApiTestFixtureExtensions.UniqueEmail("student");
        await studentClient.RegisterAsync(studentEmail, "Password123!");

        var response = await studentClient.DeleteAsync($"/api/users/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Deactivate_WithoutAuth_ReturnsUnauthorized()
    {
        var anonymousClient = fixture.CreateClient();

        var response = await anonymousClient.DeleteAsync($"/api/users/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Deactivate_UnknownId_ReturnsNotFound()
    {
        var adminClient = await fixture.CreateAdminClientAsync();

        var response = await adminClient.DeleteAsync($"/api/users/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<Guid> GetUserIdAsync(string email)
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.Users.SingleAsync(u => u.Email == email)).Id;
    }
}
