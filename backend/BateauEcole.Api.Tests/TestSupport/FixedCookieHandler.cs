namespace BateauEcole.Api.Tests.TestSupport;

// Attaches a fixed Cookie header to every request. Used for admin test
// clients built directly from a signed token (see CreateAdminClientAsync)
// rather than through /auth/login — avoids spending that endpoint's shared
// rate-limit budget just to get an authenticated client for CRUD tests.
public class FixedCookieHandler(string cookieHeader) : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        request.Headers.Add("Cookie", cookieHeader);
        return base.SendAsync(request, ct);
    }
}
