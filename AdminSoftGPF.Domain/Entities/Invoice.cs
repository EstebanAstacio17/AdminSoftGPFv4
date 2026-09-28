namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa una Factura o Cuenta por Cobrar emitida a una unidad.
/// Esquema SQL: app.Invoice
/// </summary>
public sealed class Invoice
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER (INDEX). Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a app.Unit — UNIQUEIDENTIFIER</summary>
    public Guid UnitId { get; set; }

    /// <summary>Monto total de la factura — DECIMAL(19,4)</summary>
    public decimal Amount { get; set; }

    /// <summary>Balance pendiente de pago — DECIMAL(19,4)</summary>
    public decimal BalanceDue { get; set; }

    /// <summary>
    /// Estado: 'Draft', 'Unpaid', 'Partial', 'Paid', 'Cancelled' — VARCHAR
    /// </summary>
    public string Status { get; set; } = InvoiceStatus.Unpaid;

    /// <summary>Tipo de comprobante fiscal (ej. 'B01', 'B02') — VARCHAR</summary>
    public string? FiscalReceiptType { get; set; }

    /// <summary>Número de Comprobante Fiscal (NCF) asignado secuencialmente — VARCHAR</summary>
    public string? FiscalReceiptNumber { get; set; }

    /// <summary>Fecha de emisión — DATE</summary>
    public DateOnly IssueDate { get; set; }

    /// <summary>Fecha límite de pago sin recargo — DATE</summary>
    public DateOnly DueDate { get; set; }

    /// <summary>Control de concurrencia optimista — ROWVERSION</summary>
    public byte[]? RowVersion { get; set; }

    // ── Constantes de estados válidos ──────────────────────────────

    public static class InvoiceStatus
    {
        public const string Draft     = "Draft";
        public const string Unpaid    = "Unpaid";
        public const string Partial   = "Partial";
        public const string Paid      = "Paid";
        public const string Cancelled = "Cancelled";
    }
}
