using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Tests.TestSupport;

namespace BateauEcole.Api.Tests;

public class ContactTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Submit_WithValidData_ReturnsTheCreatedMessage()
    {
        var client = fixture.CreateClient();
        var dto = new CreateContactMessageDto("Jean Dupont", "jean.dupont@example.com", "0762463741", "Je souhaite des informations sur le permis côtier.");

        var response = await client.PostAsJsonAsync("/api/contact", dto);
        var message = await response.Content.ReadFromJsonAsync<ContactMessageDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(dto.Email, message!.Email);
    }

    [Fact]
    public async Task Submit_WithMissingRequiredFields_ReturnsBadRequest()
    {
        var client = fixture.CreateClient();
        var dto = new CreateContactMessageDto("", "not-an-email", null, "");

        var response = await client.PostAsJsonAsync("/api/contact", dto);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_AsStudent_ReturnsForbidden()
    {
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("contact-student"));

        var response = await student.GetAsync("/api/contact");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_AsAdmin_ReturnsSubmittedMessages()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var client = fixture.CreateClient();
        var dto = new CreateContactMessageDto("Marie Martin", "marie.martin@example.com", null, "Question sur les tarifs.");
        var created = await client.PostAsJsonAsync("/api/contact", dto);
        var message = await created.Content.ReadFromJsonAsync<ContactMessageDto>(ApiJsonOptions.Default);

        var response = await admin.GetAsync("/api/contact");
        var messages = await response.Content.ReadFromJsonAsync<List<ContactMessageDto>>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(messages!, m => m.Id == message!.Id);
    }

    [Fact]
    public async Task Delete_AsAdmin_RemovesTheMessage()
    {
        var admin = await fixture.CreateAdminClientAsync();
        var client = fixture.CreateClient();
        var dto = new CreateContactMessageDto("Marie Martin", "marie.martin2@example.com", null, "Question sur les tarifs.");
        var created = await client.PostAsJsonAsync("/api/contact", dto);
        var message = await created.Content.ReadFromJsonAsync<ContactMessageDto>(ApiJsonOptions.Default);

        var response = await admin.DeleteAsync($"/api/contact/{message!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Delete_UnknownId_ReturnsNotFound()
    {
        var admin = await fixture.CreateAdminClientAsync();

        var response = await admin.DeleteAsync($"/api/contact/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
