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
    public async Task Checkout_WithAQuantityGreaterThanOne_CreatesOneRowPerUnit()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("checkout-qty"));
        var permit = await SeedPermitAsync();

        var response = await client.PostAsJsonAsync(
            "/api/purchases/checkout", new CheckoutDto([new CheckoutItemDto(permit.Id, 3)]));
        var purchases = await response.Content.ReadFromJsonAsync<List<PermitPurchaseDto>>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, purchases!.Count);
        Assert.All(purchases, p => Assert.Equal(permit.Id, p.PermitId));
        Assert.Equal(3, purchases.Select(p => p.Id).Distinct().Count());
    }

    [Fact]
    public async Task Checkout_WithSeveralDifferentPermits_CreatesAllOfThem()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("checkout-multi"));
        var cotier = await SeedPermitAsync("Permis Côtier");
        var hauturier = await SeedPermitAsync("Permis Hauturier");

        var response = await client.PostAsJsonAsync(
            "/api/purchases/checkout",
            new CheckoutDto([new CheckoutItemDto(cotier.Id, 1), new CheckoutItemDto(hauturier.Id, 2)]));
        var purchases = await response.Content.ReadFromJsonAsync<List<PermitPurchaseDto>>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, purchases!.Count);
        Assert.Single(purchases, p => p.PermitId == cotier.Id);
        Assert.Equal(2, purchases.Count(p => p.PermitId == hauturier.Id));
    }

    [Fact]
    public async Task Checkout_WithAnEmptyCart_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("checkout-empty"));

        var response = await client.PostAsJsonAsync("/api/purchases/checkout", new CheckoutDto([]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Checkout_WithUnknownPermit_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("checkout-unknown"));

        var response = await client.PostAsJsonAsync(
            "/api/purchases/checkout", new CheckoutDto([new CheckoutItemDto(Guid.NewGuid(), 1)]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Checkout_AsAdmin_ReturnsForbidden()
    {
        var admin = await fixture.CreateAdminClientAsync("checkout-admin");
        var permit = await SeedPermitAsync();

        var response = await admin.PostAsJsonAsync(
            "/api/purchases/checkout", new CheckoutDto([new CheckoutItemDto(permit.Id, 1)]));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetMine_OnlyReturnsTheCallingStudentsPurchases()
    {
        var permit = await SeedPermitAsync();

        var owner = fixture.CreateAuthClient();
        await owner.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-mine-owner"));
        await CheckoutOneAsync(owner, permit.Id);

        var other = fixture.CreateAuthClient();
        await other.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-mine-other"));
        await CheckoutOneAsync(other, permit.Id);

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
        var purchase = await CheckoutOneAsync(buyer, permit.Id);

        var recipientEmail = ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-recipient");
        var recipient = fixture.CreateAuthClient();
        await recipient.RegisterAsync(recipientEmail);

        var response = await buyer.PostAsJsonAsync(
            $"/api/purchases/{purchase.Id}/transfer", new TransferPurchaseDto(recipientEmail));

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
        var purchase = await CheckoutOneAsync(buyer, permit.Id);

        var response = await buyer.PostAsJsonAsync(
            $"/api/purchases/{purchase.Id}/transfer", new TransferPurchaseDto("nobody@example.com"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Transfer_ToYourself_ReturnsBadRequest()
    {
        var permit = await SeedPermitAsync();
        var email = ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-self");
        var buyer = fixture.CreateAuthClient();
        await buyer.RegisterAsync(email);
        var purchase = await CheckoutOneAsync(buyer, permit.Id);

        var response = await buyer.PostAsJsonAsync($"/api/purchases/{purchase.Id}/transfer", new TransferPurchaseDto(email));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Transfer_SomeoneElsesPurchase_ReturnsNotFound()
    {
        var permit = await SeedPermitAsync();
        var owner = fixture.CreateAuthClient();
        await owner.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-owner"));
        var purchase = await CheckoutOneAsync(owner, permit.Id);

        var stranger = fixture.CreateAuthClient();
        await stranger.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("purchase-transfer-stranger"));

        var response = await stranger.PostAsJsonAsync(
            $"/api/purchases/{purchase.Id}/transfer", new TransferPurchaseDto("nobody@example.com"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<PermitPurchaseDto> CheckoutOneAsync(HttpClient client, Guid permitId)
    {
        var response = await client.PostAsJsonAsync(
            "/api/purchases/checkout", new CheckoutDto([new CheckoutItemDto(permitId, 1)]));
        var purchases = await response.Content.ReadFromJsonAsync<List<PermitPurchaseDto>>(ApiJsonOptions.Default);
        return purchases!.Single();
    }

    private async Task<Permit> SeedPermitAsync(string name = "Permis Côtier")
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var permit = new Permit
        {
            Id = Guid.NewGuid(),
            Name = name,
            Slug = $"{name}-{Guid.NewGuid():N}",
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
