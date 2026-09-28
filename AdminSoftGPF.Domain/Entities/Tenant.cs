namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa un Administrador de Propiedades (cliente de AdminSoftGPF).
/// Esquema SQL: saas.Tenant
/// </summary>
public sealed class Tenant
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>Nombre comercial del Administrador — VARCHAR</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>RNC / NIT para facturación fiscal — VARCHAR</summary>
    public string? TaxId { get; set; }

    /// <summary>
    /// Estado del ciclo de vida SaaS: 'Active', 'ReadOnly', 'Suspended'.
    /// Controla el Modo Degradado del Tenant.
    /// — VARCHAR
    /// </summary>
    public string Status { get; set; } = TenantStatus.Active;

    /// <summary>Fecha de alta en la plataforma — DATETIME2</summary>
    public DateTime CreatedAt { get; set; }

    // ── Constantes de estados válidos ──────────────────────────────

    /// <summary>
    /// Valores válidos para <see cref="Status"/>.
    /// Se usa una clase estática de constantes (en lugar de un enum)
    /// para mantener la correspondencia directa con el VARCHAR de SQL.
    /// </summary>
    public static class TenantStatus
    {
        public const string Active    = "Active";
        public const string ReadOnly  = "ReadOnly";
        public const string Suspended = "Suspended";
    }
}
