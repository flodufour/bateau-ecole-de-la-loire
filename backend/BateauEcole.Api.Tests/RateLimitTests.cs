using System.Net;
using System.Net.Http.Json;

namespace BateauEcole.Api.Tests;

// Deliberately isolated in its own fixture: the "auth" rate limiter's counter
// is shared by every request the app handles, so sharing a fixture with other
// tests would make this flaky (or make THEM flaky) depending on run order.
public class RateLimitTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Login_AllowsFiveAttemptsPerMinute_ThenReturnsTooManyRequests()
    {
        var client = fixture.CreateClient();
        var payload = new { email = "nobody@example.com", password = "wrong" };

        var statusCodes = new List<HttpStatusCode>();
        for (var i = 0; i < 6; i++)
        {
            var response = await client.PostAsJsonAsync("/api/auth/login", payload);
            statusCodes.Add(response.StatusCode);
        }

        Assert.Equal(5, statusCodes.Count(s => s == HttpStatusCode.Unauthorized));
        Assert.Equal(HttpStatusCode.TooManyRequests, statusCodes[5]);
    }
}
