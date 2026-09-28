namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa una línea de transacción importada de extracto bancario (CSV, OFX, Excel)
/// para el motor de conciliación bancaria automática.
/// Esquema SQL: app.BankTransaction
/// </summary>
public sealed class BankTransaction
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PropertyId { get; set; }
    public DateOnly TransactionDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? ReferenceNumber { get; set; }
    public bool IsReconciled { get; set; } = false;
    public Guid? MatchedPaymentId { get; set; }
    public DateTime ImportedAt { get; set; } = DateTime.UtcNow;
}
