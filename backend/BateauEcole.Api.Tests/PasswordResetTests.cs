using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Tests.TestSupport;

namespace BateauEcole.Api.Tests;

// forgot-password shares the same rate-limit policy as login — isolated here
// for the same reason AuthLoginTests is split out from AuthTests.
public class PasswordResetTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task ForgotPassword_AlwaysReturnsNoContent_RegardlessOfWhetherEmailExists()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("forgot");
        await client.RegisterAsync(email);

        var known = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        var unknown = await client.PostAsJsonAsync("/api/auth/forgot-password",
            new { email = ApiTestFixtureExtensions.UniqueEmail("unknown") });

        // Same status either way — the endpoint must not leak whether an email is registered.
        Assert.Equal(HttpStatusCode.NoContent, known.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, unknown.StatusCode);
    }

    [Fact]
    public async Task ResetPassword_WithInvalidToken_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("reset-bad-token");
        await client.RegisterAsync(email);

        var response = await client.PostAsJsonAsync("/api/auth/reset-password",
            new { email, token = "not-a-real-token", newPassword = "BrandNewPassword123!" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
