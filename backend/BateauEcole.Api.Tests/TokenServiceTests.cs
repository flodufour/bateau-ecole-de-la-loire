using System.IdentityModel.Tokens.Jwt;
using BateauEcole.Api.Models;
using BateauEcole.Api.Services;
using Microsoft.Extensions.Configuration;

namespace BateauEcole.Api.Tests;

// No DB, no HTTP — pure logic, so a plain in-memory IConfiguration is enough.
public class TokenServiceTests
{
    private static TokenService CreateService()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "unit-test-signing-key-not-used-anywhere-real-1234567890",
                ["Jwt:Issuer"] = "BateauEcoleApi",
                ["Jwt:Audience"] = "BateauEcoleClient",
                ["Jwt:AccessTokenMinutes"] = "30",
                ["Jwt:RefreshTokenDays"] = "7",
            })
            .Build();

        return new TokenService(configuration);
    }

    [Fact]
    public void CreateAccessToken_EmbedsUserIdEmailAndRole()
    {
        var tokenService = CreateService();
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "jean.dupont@example.com",
            Role = UserRole.Instructor,
        };

        var jwt = tokenService.CreateAccessToken(user);

        var token = new JwtSecurityTokenHandler().ReadJwtToken(jwt);
        Assert.Equal(user.Id.ToString(), token.Subject);
        Assert.Contains(token.Claims, c => c.Type == System.Security.Claims.ClaimTypes.Email && c.Value == user.Email);
        Assert.Contains(token.Claims, c => c.Type == System.Security.Claims.ClaimTypes.Role && c.Value == "Instructor");
    }

    [Fact]
    public void CreateRefreshToken_ReturnsADifferentValueEachCall()
    {
        var tokenService = CreateService();

        var first = tokenService.CreateRefreshToken();
        var second = tokenService.CreateRefreshToken();

        Assert.NotEqual(first, second);
    }

    [Fact]
    public void HashRefreshToken_IsDeterministic_ButDifferentInputsHashDifferently()
    {
        var tokenService = CreateService();
        var token = tokenService.CreateRefreshToken();

        var hash1 = tokenService.HashRefreshToken(token);
        var hash2 = tokenService.HashRefreshToken(token);
        var hashOfSomethingElse = tokenService.HashRefreshToken(tokenService.CreateRefreshToken());

        Assert.Equal(hash1, hash2);
        Assert.NotEqual(hash1, hashOfSomethingElse);
        Assert.NotEqual(token, hash1); // the hash must never equal the raw token
    }
}
