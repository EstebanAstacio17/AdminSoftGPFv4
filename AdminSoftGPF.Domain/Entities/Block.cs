namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa un Bloque, Torre, Manzana o Zona dentro de una Propiedad.
/// Esquema SQL: app.Block
/// </summary>
public sealed class Block
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER. Aislamiento multi-tenant.</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a app.Property — UNIQUEIDENTIFIER</summary>
    public Guid PropertyId { get; set; }

    /// <summary>Nombre del bloque (ej. "Torre 1", "Bloque A") — VARCHAR</summary>
    public string Name { get; set; } = string.Empty;
}
