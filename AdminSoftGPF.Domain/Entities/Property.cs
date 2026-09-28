namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa una Propiedad administrada (Condominio, Residencial, Plaza Comercial).
/// Esquema SQL: app.Property
/// </summary>
public sealed class Property
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER (INDEX). Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>Nombre de la propiedad (ej. "Torre del Parque") — VARCHAR</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Dirección física de la propiedad — VARCHAR</summary>
    public string Address { get; set; } = string.Empty;
}
