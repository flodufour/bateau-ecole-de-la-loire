using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Tests.TestSupport;

namespace BateauEcole.Api.Tests;

public class InstructorAvailabilityTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task GetMe_AsInstructor_ReturnsOwnProfile()
    {
        var (client, instructor) = await fixture.CreateInstructorClientAsync();

        var response = await client.GetAsync("/api/instructors/me");
        var dto = await response.Content.ReadFromJsonAsync<InstructorDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(instructor.Id, dto!.Id);
    }

    [Fact]
    public async Task GetMe_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("availability-student"));

        var response = await student.GetAsync("/api/instructors/me");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetAvailability_WithNoSlots_ReturnsEmptyList()
    {
        var (_, instructor) = await fixture.CreateInstructorClientAsync();
        var client = fixture.CreateClient();

        var response = await client.GetAsync($"/api/instructors/{instructor.Id}/availability");
        var slots = await response.Content.ReadFromJsonAsync<List<AvailabilitySlotDto>>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(slots!);
    }

    [Fact]
    public async Task AddAvailability_AsOwningInstructor_CreatesTheSlot()
    {
        var (client, instructor) = await fixture.CreateInstructorClientAsync();
        var dto = new CreateAvailabilitySlotDto(DateTimeOffset.UtcNow.AddDays(2), DateTimeOffset.UtcNow.AddDays(2).AddHours(3));

        var response = await client.PostAsJsonAsync($"/api/instructors/{instructor.Id}/availability", dto);
        var slot = await response.Content.ReadFromJsonAsync<AvailabilitySlotDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(instructor.Id, slot!.InstructorId);

        var list = await client.GetFromJsonAsync<List<AvailabilitySlotDto>>(
            $"/api/instructors/{instructor.Id}/availability", ApiJsonOptions.Default);
        Assert.Single(list!);
    }

    [Fact]
    public async Task AddAvailability_ForAnotherInstructor_ReturnsForbidden()
    {
        var (client, _) = await fixture.CreateInstructorClientAsync("owner");
        var (_, otherInstructor) = await fixture.CreateInstructorClientAsync("other");
        var dto = new CreateAvailabilitySlotDto(DateTimeOffset.UtcNow.AddDays(2), DateTimeOffset.UtcNow.AddDays(2).AddHours(3));

        var response = await client.PostAsJsonAsync($"/api/instructors/{otherInstructor.Id}/availability", dto);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AddAvailability_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("availability-blocked"));
        var (_, instructor) = await fixture.CreateInstructorClientAsync();
        var dto = new CreateAvailabilitySlotDto(DateTimeOffset.UtcNow.AddDays(2), DateTimeOffset.UtcNow.AddDays(2).AddHours(3));

        var response = await student.PostAsJsonAsync($"/api/instructors/{instructor.Id}/availability", dto);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AddAvailability_WithEndBeforeStart_ReturnsBadRequest()
    {
        var (client, instructor) = await fixture.CreateInstructorClientAsync();
        var start = DateTimeOffset.UtcNow.AddDays(2);
        var dto = new CreateAvailabilitySlotDto(start, start.AddHours(-1));

        var response = await client.PostAsJsonAsync($"/api/instructors/{instructor.Id}/availability", dto);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddAvailability_InThePast_ReturnsBadRequest()
    {
        var (client, instructor) = await fixture.CreateInstructorClientAsync();
        var dto = new CreateAvailabilitySlotDto(DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow.AddDays(-1).AddHours(2));

        var response = await client.PostAsJsonAsync($"/api/instructors/{instructor.Id}/availability", dto);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddAvailability_OverlappingAnExistingSlot_ReturnsBadRequest()
    {
        var (client, instructor) = await fixture.CreateInstructorClientAsync();
        var start = DateTimeOffset.UtcNow.AddDays(5);
        await client.PostAsJsonAsync(
            $"/api/instructors/{instructor.Id}/availability", new CreateAvailabilitySlotDto(start, start.AddHours(3)));

        var response = await client.PostAsJsonAsync(
            $"/api/instructors/{instructor.Id}/availability",
            new CreateAvailabilitySlotDto(start.AddHours(1), start.AddHours(4)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task DeleteAvailability_AsOwningInstructor_RemovesTheSlot()
    {
        var (client, instructor) = await fixture.CreateInstructorClientAsync();
        var start = DateTimeOffset.UtcNow.AddDays(2);
        var created = await client.PostAsJsonAsync(
            $"/api/instructors/{instructor.Id}/availability", new CreateAvailabilitySlotDto(start, start.AddHours(2)));
        var slot = await created.Content.ReadFromJsonAsync<AvailabilitySlotDto>(ApiJsonOptions.Default);

        var response = await client.DeleteAsync($"/api/instructors/{instructor.Id}/availability/{slot!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var list = await client.GetFromJsonAsync<List<AvailabilitySlotDto>>(
            $"/api/instructors/{instructor.Id}/availability", ApiJsonOptions.Default);
        Assert.Empty(list!);
    }

    [Fact]
    public async Task DeleteAvailability_ForAnotherInstructor_ReturnsForbidden()
    {
        var (client, _) = await fixture.CreateInstructorClientAsync("owner-delete");
        var (otherClient, otherInstructor) = await fixture.CreateInstructorClientAsync("other-delete");
        var start = DateTimeOffset.UtcNow.AddDays(2);
        var created = await otherClient.PostAsJsonAsync(
            $"/api/instructors/{otherInstructor.Id}/availability", new CreateAvailabilitySlotDto(start, start.AddHours(2)));
        var slot = await created.Content.ReadFromJsonAsync<AvailabilitySlotDto>(ApiJsonOptions.Default);

        var response = await client.DeleteAsync($"/api/instructors/{otherInstructor.Id}/availability/{slot!.Id}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeleteAvailability_UnknownSlot_ReturnsNotFound()
    {
        var (client, instructor) = await fixture.CreateInstructorClientAsync();

        var response = await client.DeleteAsync($"/api/instructors/{instructor.Id}/availability/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
