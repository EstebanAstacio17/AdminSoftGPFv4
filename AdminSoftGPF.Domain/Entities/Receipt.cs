namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa un Recibo o Comprobante emitido tras registrar un pago.
/// Esquema SQL: app.Receipt
/// </summary>
public sealed class Receipt
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER. Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a app.Payment — UNIQUEIDENTIFIER</summary>
    public Guid PaymentId { get; set; }

    /// <summary>Número correlativo de recibo — VARCHAR</summary>
    public string ReceiptNumber { get; set; } = string.Empty;

    /// <summary>URL del PDF privado almacenado en Azure Blob Storage — VARCHAR</summary>
    public string? BlobUrl { get; set; }
}
