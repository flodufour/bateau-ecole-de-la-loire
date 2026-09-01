using System.Net;
using System.Net.Http.Json;
using BateauEcole.Api.Data;
using BateauEcole.Api.DTOs;
using BateauEcole.Api.Models;
using Microsoft.Extensions.DependencyInjection;

namespace BateauEcole.Api.Tests;

public class ExamDatesTests(ApiTestFixture fixture) : IClassFixture<ApiTestFixture>
{
    [Fact]
    public async Task GetUpcoming_ExcludesPastDates_ButIncludesFutureOnes()
    {
        var client = fixture.CreateClient();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var past = await SeedExamDateAsync(today.AddDays(-5));
        var future = await SeedExamDateAsync(today.AddDays(10));

        var response = await client.GetAsync("/api/exam-dates");
        var examDates = await response.Content.ReadFromJsonAsync<List<ExamDateDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(examDates!, e => e.Id == future.Id);
        Assert.DoesNotContain(examDates!, e => e.Id == past.Id);
    }

    private async Task<ExamDate> SeedExamDateAsync(DateOnly date)
    {
        using var scope = fixture.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var examDate = new ExamDate
        {
            Id = Guid.NewGuid(),
            PermitType = "cotier",
            Date = date,
            Location = "Nantes",
        };
        db.ExamDates.Add(examDate);
        await db.SaveChangesAsync();
        return examDate;
    }
}
