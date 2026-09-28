namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Representa una amenidad o área común (Piscina, Salón de eventos, Gimnasio, Gazebo).
/// Esquema SQL: app.Amenity
/// </summary>
public sealed class Amenity
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid PropertyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public decimal HourlyRate { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Representa una reserva de amenidad efectuada por un residente.
/// Esquema SQL: app.AmenityBooking
/// </summary>
public sealed class AmenityBooking
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid AmenityId { get; set; }
    public Guid PersonId { get; set; }
    public Guid UnitId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = BookingStatus.Confirmed; // 'Pending', 'Confirmed', 'Cancelled'
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public static class BookingStatus
    {
        public const string Pending   = "Pending";
        public const string Confirmed = "Confirmed";
        public const string Cancelled = "Cancelled";
    }
}
