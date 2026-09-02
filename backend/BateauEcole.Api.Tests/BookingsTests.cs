using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using BateauEcole.Api.Tests.TestSupport;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

// Registering already authenticates as Student, so most tests here never call
// /auth/login at all — only the Admin-scoped tests do (promoting a role
// requires a fresh login to get it into the JWT), which keeps this class
// comfortably under the shared rate-limit budget without needing its own split.
public class BookingsTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task Create_ForAnUpcomingSession_ReturnsPendingBooking()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book"));
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);

        var response = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        var dto = await response.Content.ReadFromJsonAsync<BookingDto>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(BookingStatus.Pending, dto!.Status);
        Assert.Equal(session.Id, dto.SessionId);
    }

    [Fact]
    public async Task Create_ForAPastSession_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-past"));
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(-1), maxCapacity: 8);

        var response = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_ForUnknownSession_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-unknown"));

        var response = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(Guid.NewGuid()));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_WhenAlreadyBookedByTheSameStudent_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-twice"));
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);

        var first = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        var second = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
    }

    [Fact]
    public async Task Create_WhenSessionIsAtCapacity_ReturnsBadRequest()
    {
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 1);

        var firstStudent = fixture.CreateAuthClient();
        await firstStudent.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-cap-1"));
        var firstBooking = await firstStudent.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        Assert.Equal(HttpStatusCode.OK, firstBooking.StatusCode);

        var secondStudent = fixture.CreateAuthClient();
        await secondStudent.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-cap-2"));
        var secondBooking = await secondStudent.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));

        Assert.Equal(HttpStatusCode.BadRequest, secondBooking.StatusCode);
    }

    [Fact]
    public async Task GetMine_OnlyReturnsTheCallingStudentsBookings()
    {
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);

        var owner = fixture.CreateAuthClient();
        await owner.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-mine-owner"));
        await owner.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));

        var otherStudent = fixture.CreateAuthClient();
        await otherStudent.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-mine-other"));
        await otherStudent.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));

        var response = await owner.GetAsync("/api/bookings/me");
        var bookings = await response.Content.ReadFromJsonAsync<List<BookingDto>>(ApiJsonOptions.Default);

        Assert.Single(bookings!);
    }

    [Fact]
    public async Task Cancel_AsOwner_SetsStatusCancelled()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-cancel"));
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);
        var created = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        var booking = await created.Content.ReadFromJsonAsync<BookingDto>(ApiJsonOptions.Default);

        var response = await client.DeleteAsync($"/api/bookings/{booking!.Id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task Cancel_SomeoneElsesBooking_ReturnsNotFound()
    {
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);

        var owner = fixture.CreateAuthClient();
        await owner.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-owner"));
        var created = await owner.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        var booking = await created.Content.ReadFromJsonAsync<BookingDto>(ApiJsonOptions.Default);

        var stranger = fixture.CreateAuthClient();
        await stranger.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-stranger"));

        var response = await stranger.DeleteAsync($"/api/bookings/{booking!.Id}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Cancel_AlreadyCancelledBooking_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-double-cancel"));
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);
        var created = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        var booking = await created.Content.ReadFromJsonAsync<BookingDto>(ApiJsonOptions.Default);
        await client.DeleteAsync($"/api/bookings/{booking!.Id}");

        var response = await client.DeleteAsync($"/api/bookings/{booking.Id}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_AsAdmin_ReturnsBookingsAcrossStudents()
    {
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);
        var student = fixture.CreateAuthClient();
        await student.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-admin-view"));
        await student.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));

        var admin = await CreateAdminClientAsync();
        var response = await admin.GetAsync("/api/bookings");
        var bookings = await response.Content.ReadFromJsonAsync<List<BookingDto>>(ApiJsonOptions.Default);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(bookings!, b => b.SessionId == session.Id);
    }

    [Fact]
    public async Task GetAll_AsStudent_ReturnsForbidden()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-forbidden-list"));

        var response = await client.GetAsync("/api/bookings");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Confirm_AsAdmin_SetsStatusConfirmed()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-confirm"));
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);
        var created = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        var booking = await created.Content.ReadFromJsonAsync<BookingDto>(ApiJsonOptions.Default);

        var admin = await CreateAdminClientAsync();
        var response = await admin.PatchAsync($"/api/bookings/{booking!.Id}/confirm", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var reloaded = await db.Bookings.SingleAsync(b => b.Id == booking.Id);
        Assert.Equal(BookingStatus.Confirmed, reloaded.Status);
    }

    [Fact]
    public async Task Confirm_ABookingThatIsNotPending_ReturnsBadRequest()
    {
        var client = fixture.CreateAuthClient();
        await client.RegisterAsync(ApiTestFixtureExtensions.UniqueEmail("book-confirm-twice"));
        var session = await SeedSessionAsync(startsAt: DateTimeOffset.UtcNow.AddDays(1), maxCapacity: 8);
        var created = await client.PostAsJsonAsync("/api/bookings", new CreateBookingDto(session.Id));
        var booking = await created.Content.ReadFromJsonAsync<BookingDto>(ApiJsonOptions.Default);

        var admin = await CreateAdminClientAsync();
        await admin.PatchAsync($"/api/bookings/{booking!.Id}/confirm", null);
        var response = await admin.PatchAsync($"/api/bookings/{booking.Id}/confirm", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<HttpClient> CreateAdminClientAsync()
    {
        var client = fixture.CreateAuthClient();
        var email = ApiTestFixtureExtensions.UniqueEmail("book-admin");
        await client.RegisterAsync(email);
        await fixture.PromoteToAdminAsync(email);
        await client.LoginAsync(email, "Password123!"); // fresh JWT carrying the Admin role
        return client;
    }

    private async Task<Session> SeedSessionAsync(DateTimeOffset startsAt, int maxCapacity)
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

        var instructorUser = new User
        {
            Id = Guid.NewGuid(),
            UserName = $"{Guid.NewGuid():N}@example.com",
            Email = $"{Guid.NewGuid():N}@example.com",
            FirstName = "Jean",
            LastName = "Dupont",
            Role = UserRole.Instructor,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var instructor = new Instructor { Id = Guid.NewGuid(), UserId = instructorUser.Id, Bio = "Moniteur", User = instructorUser };

        var session = new Session
        {
            Id = Guid.NewGuid(),
            PermitId = permit.Id,
            Permit = permit,
            InstructorId = instructor.Id,
            Instructor = instructor,
            Type = SessionType.Theory,
            StartsAt = startsAt,
            DurationMinutes = 90,
            MaxCapacity = maxCapacity,
            Location = "Nantes centre",
        };

        db.Permits.Add(permit);
        db.Users.Add(instructorUser);
        db.Instructors.Add(instructor);
        db.Sessions.Add(session);
        await db.SaveChangesAsync();

        return session;
    }
}
