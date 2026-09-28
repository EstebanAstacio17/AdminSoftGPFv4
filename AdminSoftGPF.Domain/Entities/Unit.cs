namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa una Unidad habitable o comercial (Apartamento, Local, Oficina).
/// Esquema SQL: app.Unit
/// </summary>
public sealed class Unit
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER. Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a app.Block (Torre / Zona / Manzana) — UNIQUEIDENTIFIER</summary>
    public Guid BlockId { get; set; }

    /// <summary>Identificador visible de la unidad (ej. "A-301", "PB-02") — VARCHAR</summary>
    public string UnitNumber { get; set; } = string.Empty;

    /// <summary>Estado operativo de la unidad — VARCHAR</summary>
    public string Status { get; set; } = string.Empty;
}
