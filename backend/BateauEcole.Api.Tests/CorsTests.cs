namespace BateauEcole.Api.Tests;

// AllowAnyOrigin + AllowCredentials would be a real vulnerability (any site
// could ride the browser's cookie jar to call the API as the logged-in user)
// — these tests exist specifically to catch that regression, not just to
// prove CORS "works".
public class CorsTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    private const string AllowedOrigin = "http://localhost:4200";
    private const string DisallowedOrigin = "http://evil.example.com";

    [Fact]
    public async Task Preflight_FromTheFrontendOrigin_IsAllowedWithCredentials()
    {
        var client = fixture.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/auth/login");
        request.Headers.Add("Origin", AllowedOrigin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        var response = await client.SendAsync(request);

        Assert.Equal(AllowedOrigin, response.Headers.GetValues("Access-Control-Allow-Origin").Single());
        Assert.Equal("true", response.Headers.GetValues("Access-Control-Allow-Credentials").Single());
    }

    [Fact]
    public async Task Preflight_FromAnUnlistedOrigin_IsNotGrantedCorsHeaders()
    {
        var client = fixture.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/auth/login");
        request.Headers.Add("Origin", DisallowedOrigin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");

        var response = await client.SendAsync(request);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task ActualRequest_FromTheFrontendOrigin_EchoesTheOriginBack()
    {
        var client = fixture.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/permits");
        request.Headers.Add("Origin", AllowedOrigin);

        var response = await client.SendAsync(request);

        Assert.Equal(AllowedOrigin, response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task CsrfCookie_IsNotHttpOnly()
    {
        // The whole point of this cookie is that frontend JS reads it
        // (document.cookie) and echoes it back in a header — ASP.NET Core
        // defaults cookie options to HttpOnly=true, which would silently make
        // that impossible. Caught for real once already; this pins it down.
        var client = fixture.CreateClient();

        var response = await client.GetAsync("/api/auth/csrf");

        var setCookie = response.Headers.GetValues("Set-Cookie").Single(c => c.StartsWith("XSRF-TOKEN=", StringComparison.Ordinal));
        Assert.DoesNotContain("httponly", setCookie, StringComparison.OrdinalIgnoreCase);
    }
}
