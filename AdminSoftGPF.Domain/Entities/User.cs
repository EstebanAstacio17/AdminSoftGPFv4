namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa una identidad autenticable en el sistema.
/// Esquema SQL: saas.User
/// </summary>
public sealed class User
{
    /// <summary>PK — UNIQUEIDENTIFIER</summary>
    public Guid Id { get; set; }

    /// <summary>
    /// FK a saas.Tenant. NULLABLE: es NULL para los SuperAdmins de PortaForza
    /// que operan a nivel global sin pertenecer a ningún Tenant.
    /// — UNIQUEIDENTIFIER (NULLABLE)
    /// </summary>
    public Guid? TenantId { get; set; }

    /// <summary>Correo electrónico único del usuario — VARCHAR (UNIQUE)</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Hash de contraseña (nunca texto plano) — VARCHAR</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Rol del usuario: 'PortaForzaAdmin', 'TenantAdmin', 'Accountant', 'Resident', 'Guard'.
    /// — VARCHAR
    /// </summary>
    public string Role { get; set; } = string.Empty;

    /// <summary>Indica si la cuenta está habilitada — BIT</summary>
    public bool IsActive { get; set; }

    // ── Constantes de roles válidos ────────────────────────────────

    /// <summary>
    /// Valores válidos para <see cref="Role"/>.
    /// Modelados como constantes string para mapeo directo al VARCHAR de SQL.
    /// </summary>
    public static class UserRole
    {
        public const string PortaForzaAdmin = "PortaForzaAdmin";
        public const string TenantAdmin     = "TenantAdmin";
        public const string Accountant      = "Accountant";
        public const string Resident        = "Resident";
        public const string Guard           = "Guard";
    }
}
