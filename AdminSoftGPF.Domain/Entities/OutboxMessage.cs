namespace AdminSoftGPF.Domain.Entities;

/// <summary>
/// Mensaje en la bandeja de salida transaccional (Transactional Outbox Pattern).
/// Se persiste en la misma transacción SQL que el pago para garantizar entrega
/// garantizada y desacoplada de notificaciones por email/WhatsApp.
/// </summary>
public sealed class OutboxMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public string? Error { get; set; }
}
