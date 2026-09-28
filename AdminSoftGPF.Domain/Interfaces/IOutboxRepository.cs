using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para mensajes en la bandeja Transactional Outbox.
/// </summary>
public interface IOutboxRepository
{
    Task InsertAsync(OutboxMessage message, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OutboxMessage>> GetUnprocessedMessagesAsync(int batchSize = 50, CancellationToken cancellationToken = default);
    Task MarkAsProcessedAsync(Guid id, CancellationToken cancellationToken = default);
    Task MarkAsFailedAsync(Guid id, string error, CancellationToken cancellationToken = default);
}
