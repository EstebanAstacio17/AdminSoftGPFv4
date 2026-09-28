namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa a un proveedor de servicios o suministros para las propiedades del Tenant.
/// Esquema SQL: app.Supplier
/// </summary>
public sealed class Supplier
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? TaxId { get; set; } // RNC / Cédula
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Representa un egreso o gasto operacional de una propiedad.
/// Esquema SQL: app.Expense
/// </summary>
public sealed class Expense
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PropertyId { get; set; }
    public Guid? SupplierId { get; set; }
    public string Concept { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly ExpenseDate { get; set; }
    public string? FiscalReceiptNumber { get; set; } // NCF B01 (Crédito Fiscal)
    public string Status { get; set; } = ExpenseStatus.Paid;

    public static class ExpenseStatus
    {
        public const string Pending = "Pending";
        public const string Paid    = "Paid";
        public const string Cancelled = "Cancelled";
    }
}
