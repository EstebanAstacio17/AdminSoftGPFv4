namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa un pase de visita / invitación con código QR para control de garita.
/// Esquema SQL: app.VisitorPass
/// </summary>
public sealed class VisitorPass
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid UnitId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string? VisitorIdNumber { get; set; } // Cédula/Pasaporte
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public string QrCodeToken { get; set; } = string.Empty;
    public string Status { get; set; } = PassStatus.Active; // 'Active', 'Used', 'Expired', 'Revoked'

    public static class PassStatus
    {
        public const string Active  = "Active";
        public const string Used    = "Used";
        public const string Expired = "Expired";
        public const string Revoked = "Revoked";
    }
}

/// <summary>
/// Bitácora de ingresos y salidas físicas registradas por el personal de seguridad en garita.
/// Esquema SQL: app.GateLog
/// </summary>
public sealed class GateLog
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PropertyId { get; set; }
    public Guid? VisitorPassId { get; set; }
    public Guid GuardUserId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string? VehiclePlate { get; set; }
    public DateTime EntryTime { get; set; } = DateTime.UtcNow;
    public DateTime? ExitTime { get; set; }
}
