namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa una incidencia o ticket de soporte y mantenimiento reportado en una unidad o área común.
/// Esquema SQL: app.MaintenanceTicket
/// </summary>
public sealed class MaintenanceTicket
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PropertyId { get; set; }
    public Guid? UnitId { get; set; }
    public Guid ReportedByPersonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = TicketPriority.Medium; // 'Low', 'Medium', 'High', 'Urgent'
    public string Status { get; set; } = TicketStatus.Open;       // 'Open', 'InProgress', 'Resolved', 'Closed'
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ResolvedAt { get; set; }

    public static class TicketPriority
    {
        public const string Low    = "Low";
        public const string Medium = "Medium";
        public const string High   = "High";
        public const string Urgent = "Urgent";
    }

    public static class TicketStatus
    {
        public const string Open       = "Open";
        public const string InProgress = "InProgress";
        public const string Resolved   = "Resolved";
        public const string Closed     = "Closed";
    }
}
