using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.DTOs;

namespace BateauEcole.Api.Tests;

// Own fixture, like RateLimitTests — the "contact" limiter's counter is
// shared app-wide, so sharing a fixture with ContactTests would make this
// flaky (or make those tests flaky) depending on run order.
public class ContactRateLimitTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Submit_AllowsFiveAttemptsPerMinute_ThenReturnsTooManyRequests()
    {
        var client = fixture.CreateClient();
        var dto = new CreateContactMessageDto("Jean Dupont", "jean.dupont@example.com", null, "Question.");

        var statusCodes = new List<HttpStatusCode>();
        for (var i = 0; i < 6; i++)
        {
            var response = await client.PostAsJsonAsync("/api/contact", dto);
            statusCodes.Add(response.StatusCode);
        }

        Assert.Equal(5, statusCodes.Count(s => s == HttpStatusCode.OK));
        Assert.Equal(HttpStatusCode.TooManyRequests, statusCodes[5]);
    }
}
