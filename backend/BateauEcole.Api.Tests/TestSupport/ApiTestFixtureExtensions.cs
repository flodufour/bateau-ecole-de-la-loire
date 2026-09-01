using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests.TestSupport;

public static class ApiTestFixtureExtensions
{
    // https, not http: our auth cookies are Secure, and CookieContainer silently
    // refuses to send a Secure cookie back over a plain-http origin. TestServer
    // doesn't need a real TLS handshake — the scheme alone is enough.
    private static readonly Uri BaseUri = new("https://localhost");

    // A client that carries cookies across requests, like a browser would.
    public static HttpClient CreateAuthClient(this ApiTestFixture fixture) =>
        fixture.CreateDefaultClient(BaseUri, new CookieHandler(BaseUri));

    public static async Task<(HttpResponseMessage Response, UserDto? User)> RegisterAsync(
        this HttpClient client, string email, string password = "Password123!", string firstName = "Test", string lastName = "User")
    {
        var response = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterDto(email, password, firstName, lastName));
        var user = response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<UserDto>(ApiJsonOptions.Default) : null;
        return (response, user);
    }

    public static async Task<(HttpResponseMessage Response, UserDto? User)> LoginAsync(
        this HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginDto(email, password));
        var user = response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<UserDto>(ApiJsonOptions.Default) : null;
        return (response, user);
    }

    // There's no API to grant Admin — only a person setting up the school's
    // back-office would do this, directly in the database. Tests do the same.
    public static async Task PromoteToAdminAsync(this ApiTestFixture fixture, string email)
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.SingleAsync(u => u.Email == email);
        user.Role = UserRole.Admin;
        await db.SaveChangesAsync();
    }

    public static string UniqueEmail(string label) => $"{label}.{Guid.NewGuid():N}@example.com";
}
