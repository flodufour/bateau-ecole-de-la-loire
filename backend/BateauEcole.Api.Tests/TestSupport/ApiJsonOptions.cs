using System.Text.Json;
using System.Text.Json.Serialization;

namespace BateauEcole.Api.Tests.TestSupport;

// The API serializes enums as strings (see Program.cs's JsonStringEnumConverter
// registration) — the test client needs the same converter, or deserializing a
// DTO with an enum property (UserDto.Role, SessionDto.Type...) throws.
public static class ApiJsonOptions
{
    public static readonly JsonSerializerOptions Default = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };
}
