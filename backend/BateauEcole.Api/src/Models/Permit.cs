namespace BateauEcole.Api.Models;

public class Permit
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IncludesTheory { get; set; }
    public bool IncludesPractical { get; set; }
    public bool IsBundle { get; set; }
}
