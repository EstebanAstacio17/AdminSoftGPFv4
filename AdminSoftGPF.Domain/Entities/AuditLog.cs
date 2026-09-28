namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Registro inmutable de auditoría para trazabilidad de operaciones y suplantación segura (Impersonation).
/// Esquema SQL: audit.AuditLog
/// </summary>
public sealed class AuditLog
{
    /// <summary>PK — BIGINT IDENTITY</summary>
    public long Id { get; set; }

    /// <summary>FK a saas.Tenant — UNIQUEIDENTIFIER</summary>
    public Guid TenantId { get; set; }

    /// <summary>FK a saas.User: El usuario que ejecutó la acción real — UNIQUEIDENTIFIER</summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// FK a saas.User (NULLABLE): ID del SuperAdmin de PortaForza si la acción
    /// se ejecutó mediante sesión de suplantación (Impersonation).
    /// — UNIQUEIDENTIFIER (NULLABLE)
    /// </summary>
    public Guid? ImpersonatorId { get; set; }

    /// <summary>
    /// Acción auditada: 'Insert', 'Update', 'Delete', 'Anonymize' — VARCHAR
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>Nombre de la tabla afectada — VARCHAR</summary>
    public string TableName { get; set; } = string.Empty;

    /// <summary>Identificador del registro afectado — VARCHAR</summary>
    public string RecordId { get; set; } = string.Empty;

    /// <summary>Estado previo serializado en JSON — JSON (VARCHAR)</summary>
    public string? OldValues { get; set; }

    /// <summary>Estado posterior serializado en JSON — JSON (VARCHAR)</summary>
    public string? NewValues { get; set; }

    /// <summary>Marca de tiempo UTC de la operación — DATETIME2</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ── Constantes de acciones válidas ─────────────────────────────

    public static class AuditActions
    {
        public const string Insert    = "Insert";
        public const string Update    = "Update";
        public const string Delete    = "Delete";
        public const string Anonymize = "Anonymize";
    }
}
