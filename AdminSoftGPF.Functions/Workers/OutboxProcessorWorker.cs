using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AdminSoftGPF.Functions.Workers;

/// <summary>
/// Worker asíncrono que procesa el Transactional Outbox (app.OutboxMessage).
/// Lee los mensajes pendientes y los despacha hacia Azure Service Bus / Proveedor de Notificaciones.
/// </summary>
public sealed class OutboxProcessorWorker : BackgroundService
{
    private readonly IOutboxRepository _outboxRepository;
    private readonly ILogger<OutboxProcessorWorker> _logger;

    public OutboxProcessorWorker(IOutboxRepository outboxRepository, ILogger<OutboxProcessorWorker> logger)
    {
        _outboxRepository = outboxRepository;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 [AdminSoftGPF.Functions] OutboxProcessorWorker iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var pendingMessages = await _outboxRepository.GetUnprocessedMessagesAsync(20, stoppingToken);

                if (pendingMessages.Count > 0)
                {
                    _logger.LogInformation("📦 Procesando {Count} mensajes pendientes de Transactional Outbox...", pendingMessages.Count);

                    foreach (var msg in pendingMessages)
                    {
                        // Simulación de envío a Azure Service Bus / WhatsApp / Email
                        _logger.LogInformation("✉️ Despachando evento '{EventType}' para Tenant {TenantId} (Mensaje {Id})",
                            msg.EventType, msg.TenantId, msg.Id);

                        await _outboxRepository.MarkAsProcessedAsync(msg.Id, stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error al procesar mensajes del Transactional Outbox.");
            }

            // Intervalo de sondeo cada 10 segundos
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }
}
