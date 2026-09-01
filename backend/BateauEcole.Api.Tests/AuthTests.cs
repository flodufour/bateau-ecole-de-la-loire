using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Tests.TestSupport;

namespace BateauEcole.Api.Tests;

// Register/refresh/logout — none of these hit the "auth" rate-limit policy,
// unlike login and forgot-password (see AuthLoginTests / PasswordResetTests,
// each isolated in their own fixture for exactly that reason).
public class AuthTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Register_WithValidData_ReturnsUserAndSetsAuthCookies()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("register");

        var (response, user) = await client.RegisterAsync(email);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(user);
        Assert.Equal(email, user!.Email);
        Assert.Equal("Student", user.Role.ToString());

        var setCookies = string.Join(';', response.Headers.GetValues("Set-Cookie"));
        Assert.Contains("access_token=", setCookies);
        Assert.Contains("refresh_token=", setCookies);
        Assert.Contains("httponly", setCookies, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("duplicate");

        await client.RegisterAsync(email);
        var (response, _) = await client.RegisterAsync(email);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Refresh_RotatesRefreshToken_AndRejectsReuseOfTheOldOne()
    {
        // A plain client here (no CookieHandler) so we control exactly which
        // refresh_token value goes out on each request.
        var client = fixture.CreateClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("refresh");

        var register = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "Password123!", firstName = "Test", lastName = "User" });
        var oldRefreshToken = ExtractCookieValue(register, "refresh_token");

        using var firstRefresh = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        firstRefresh.Headers.Add("Cookie", $"refresh_token={oldRefreshToken}");
        var first = await client.SendAsync(firstRefresh);
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        // The token from registration was just rotated away — reusing it must fail.
        using var reuse = new HttpRequestMessage(HttpMethod.Post, "/api/auth/refresh");
        reuse.Headers.Add("Cookie", $"refresh_token={oldRefreshToken}");
        var second = await client.SendAsync(reuse);
        Assert.Equal(HttpStatusCode.Unauthorized, second.StatusCode);
    }

    private static string ExtractCookieValue(HttpResponseMessage response, string cookieName)
    {
        var setCookie = response.Headers.GetValues("Set-Cookie")
            .First(c => c.StartsWith($"{cookieName}=", StringComparison.Ordinal));
        return setCookie[(cookieName.Length + 1)..setCookie.IndexOf(';')];
    }

    [Fact]
    public async Task Refresh_WithoutCookie_ReturnsUnauthorized()
    {
        var client = fixture.CreateAuthClient(); // fresh client, no cookies at all

        var response = await client.PostAsync("/api/auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesRefreshToken_SoRefreshFailsAfterwards()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("logout");
        await client.RegisterAsync(email);

        var logout = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        var refreshAfterLogout = await client.PostAsync("/api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshAfterLogout.StatusCode);
    }
}
