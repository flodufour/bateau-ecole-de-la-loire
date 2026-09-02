using BateauEcole.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace BateauEcole.Api.Tests;

// Spins up a real, throwaway PostgreSQL container for the whole test run —
// not the EF Core InMemory provider, which silently ignores things like unique
// indexes and doesn't exercise the same SQL generation Npgsql produces.
public class ApiTestFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("bateau_ecole_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
                ["Jwt:Secret"] = "test-only-signing-key-not-used-anywhere-real-1234567890",
                ["Jwt:Issuer"] = "BateauEcoleApi",
                ["Jwt:Audience"] = "BateauEcoleClient",
                ["Jwt:AccessTokenMinutes"] = "30",
                ["Jwt:RefreshTokenDays"] = "7",
                // Explicit here rather than relying on appsettings.json's value,
                // so CorsTests doesn't silently start passing/failing whenever
                // that value changes for unrelated (deployment config) reasons.
                ["Cors:FrontendOrigins:0"] = "https://localhost:4200",
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }
}
