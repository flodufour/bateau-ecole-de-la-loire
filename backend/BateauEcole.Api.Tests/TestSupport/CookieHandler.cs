using System.Net;

namespace BateauEcole.Api.Tests.TestSupport;

// WebApplicationFactory's HttpClient talks directly to the TestServer and
// doesn't persist cookies between requests on its own — our auth is entirely
// cookie-based, so tests need this to carry access_token/refresh_token across
// calls the same way a browser would.
public class CookieHandler(Uri baseUri) : DelegatingHandler
{
    private readonly CookieContainer _cookies = new();

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        var cookieHeader = _cookies.GetCookieHeader(baseUri);
        if (!string.IsNullOrEmpty(cookieHeader))
            request.Headers.Add("Cookie", cookieHeader);

        var response = await base.SendAsync(request, ct);

        if (response.Headers.TryGetValues("Set-Cookie", out var setCookies))
        {
            foreach (var setCookie in setCookies)
                _cookies.SetCookies(baseUri, setCookie);
        }

        return response;
    }
}
