using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

// Registering already authenticates as Student, so nothing here calls
// /auth/login — the shared "auth" rate-limit budget is never a concern.
public class PurchaseTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Purchase_AsStudent_CreatesAnAlreadyPaidPurchase()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase"));
        var permit = await SeedPermitAsync();

        var response = await client.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));
        var dto = await response.Content.ReadFromJsonAsync<PermitPurchaseDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(permit.Id, dto!.PermitId);
        Assert.Equal(permit.Name, dto.PermitName);
    }

    [Fact]
    public async Task Purchase_WithUnknownPermit_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-unknown"));

        var response = await client.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Purchase_AsAdmin_ReturnsForbidden()
    {
        var admin = await fixture.CreateAdminClientAsync("purchase-admin");
        var permit = await SeedPermitAsync();

        var response = await admin.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetMine_OnlyReturnsTheCallingStudentsPurchases()
    {
        var permit = await SeedPermitAsync();

        var owner = fixture.CreateAuthClient();
        await owner.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-mine-owner"));
        await owner.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));

        var other = fixture.CreateAuthClient();
        await other.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-mine-other"));
        await other.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));

        var response = await owner.GetAsync("/api/purchases/me");
        var purchases = await response.Content.ReadFromJsonAsync<List<PermitPurchaseDto>>(ApiJsonOptions.Default);

        Assert.Single(purchases!);
    }

    [Fact]
    public async Task Transfer_ToAnExistingAccount_MovesItToTheirList()
    {
        var permit = await SeedPermitAsync();

        var buyer = fixture.CreateAuthClient();
        await buyer.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-buyer"));
        var created = await buyer.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));
        var purchase = await created.Content.ReadFromJsonAsync<PermitPurchaseDto>(ApiJsonOptions.Default);

        var recipientEmail = ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-recipient");
        var recipient = fixture.CreateAuthClient();
        await recipient.RegisterAsync(recipientEmail);

        var response = await buyer.PostAsJsonAsync(
            $"/api/purchases/{purchase!.Id}/transfer", new TransferPurchaseDto(recipientEmail));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var buyerList = await buyer.GetFromJsonAsync<List<PermitPurchaseDto>>("/api/purchases/me", ApiJsonOptions.Default);
        Assert.Empty(buyerList!);

        var recipientList = await recipient.GetFromJsonAsync<List<PermitPurchaseDto>>("/api/purchases/me", ApiJsonOptions.Default);
        Assert.Single(recipientList!);
    }

    [Fact]
    public async Task Transfer_ToAnUnknownEmail_ReturnsBadRequest()
    {
        var permit = await SeedPermitAsync();
        var buyer = fixture.CreateAuthClient();
        await buyer.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-unknown"));
        var created = await buyer.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));
        var purchase = await created.Content.ReadFromJsonAsync<PermitPurchaseDto>(ApiJsonOptions.Default);

        var response = await buyer.PostAsJsonAsync(
            $"/api/purchases/{purchase!.Id}/transfer", new TransferPurchaseDto("nobody@example.com"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Transfer_ToYourself_ReturnsBadRequest()
    {
        var permit = await SeedPermitAsync();
        var email = ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-self");
        var buyer = fixture.CreateAuthClient();
        await buyer.RegisterAsync(email);
        var created = await buyer.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));
        var purchase = await created.Content.ReadFromJsonAsync<PermitPurchaseDto>(ApiJsonOptions.Default);

        var response = await buyer.PostAsJsonAsync($"/api/purchases/{purchase!.Id}/transfer", new TransferPurchaseDto(email));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Transfer_SomeoneElsesPurchase_ReturnsNotFound()
    {
        var permit = await SeedPermitAsync();
        var owner = fixture.CreateAuthClient();
        await owner.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-owner"));
        var created = await owner.PostAsJsonAsync("/api/purchases", new CreatePurchaseDto(permit.Id));
        var purchase = await created.Content.ReadFromJsonAsync<PermitPurchaseDto>(ApiJsonOptions.Default);

        var stranger = fixture.CreateAuthClient();
        await stranger.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-stranger"));

        var response = await stranger.PostAsJsonAsync(
            $"/api/purchases/{purchase!.Id}/transfer", new TransferPurchaseDto("nobody@example.com"));

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
            Description = "desc",
            Price = 450m,
            IncludesTheory = true,
            IncludesPractical = true,
        };

        db.Permits.Add(permit);
        await db.SaveChangesAsync();

        return permit;
    }
}
