namespace BateauEcole.Api.Models;

public class ExamDate
{
    public Guid Id { get; set; }
    public string PermitType { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
