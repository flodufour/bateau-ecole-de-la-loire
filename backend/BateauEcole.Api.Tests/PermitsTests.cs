using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class PermitsTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task GetAll_ReturnsSeededPermit_WithoutRequiringAuth()
    {
        var client = fixture.CreateClient();
        var permit = await SeedPermitAsync();

        var response = await client.GetAsync("/api/permits");
        var permits = await response.Content.ReadFromJsonAsync<List<PermitDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(permits!, p => p.Id == permit.Id && p.Slug == permit.Slug);
    }

    [Fact]
    public async Task GetById_WithKnownId_ReturnsPermit()
    {
        var client = fixture.CreateClient();
        var permit = await SeedPermitAsync();

        var response = await client.GetAsync($"/api/permits/{permit.Id}");
        var dto = await response.Content.ReadFromJsonAsync<PermitDto>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(permit.Name, dto!.Name);
    }

    [Fact]
    public async Task GetById_WithUnknownId_ReturnsNotFound()
    {
        var client = fixture.CreateClient();

        var response = await client.GetAsync($"/api/permits/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<Permit> SeedPermitAsync()
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var permit = new Permit
        {
            Id = Guid.NewGuid(),
            Name = "Permis Côtier",
            Slug = $"cotier-{Guid.NewGuid():N}",
            Description = "Navigation jusqu'à 6 milles d'un abri",
            Price = 450m,
            IncludesTheory = true,
            IncludesPractical = true,
            IsBundle = false,
        };
        db.Permits.Add(permit);
        await db.SaveChangesAsync();
        return permit;
    }
}
