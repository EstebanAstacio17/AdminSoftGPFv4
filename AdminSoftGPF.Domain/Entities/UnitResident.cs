namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Tabla intermedia que asocia una persona a una unidad (Quién vive/es dueño de qué).
/// Esquema SQL: app.UnitResident
/// </summary>
public sealed class UnitResident
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER. Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a app.Unit — UNIQUEIDENTIFIER</summary>
    public Guid UnitId { get; set; }

    /// <summary>FK a app.Person — UNIQUEIDENTIFIER</summary>
    public Guid PersonId { get; set; }

    /// <summary>Tipo de relación: 'Owner' (Propietario), 'Tenant' (Inquilino) — VARCHAR</summary>
    public string RelationshipType { get; set; } = ResidentRelationshipType.Owner;

    /// <summary>Indica si la relación se encuentra activa — BIT</summary>
    public bool IsActive { get; set; } = true;

    // ── Constantes de tipos de relación válidos ────────────────────

    public static class ResidentRelationshipType
    {
        public const string Owner  = "Owner";
        public const string Tenant = "Tenant";
    }
}
