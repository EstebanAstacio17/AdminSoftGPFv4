namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa la aplicación de un pago contra una factura específica (Cruzamiento contable).
/// Esquema SQL: app.PaymentApplication
/// </summary>
public sealed class PaymentApplication
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER. Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a app.Payment — UNIQUEIDENTIFIER</summary>
    public Guid PaymentId { get; set; }

    /// <summary>FK a app.Invoice — UNIQUEIDENTIFIER</summary>
    public Guid InvoiceId { get; set; }

    /// <summary>Monto aplicado a esta factura — DECIMAL(19,4)</summary>
    public decimal AppliedAmount { get; set; }
}
