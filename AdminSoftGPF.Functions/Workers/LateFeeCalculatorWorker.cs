using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using AdminSoftGPF.Infrastructure.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AdminSoftGPF.Functions.Workers;

/// <summary>
/// Worker programado (Timer / Cron) para evaluar facturas vencidas y calcular recargos por mora.
/// </summary>
public sealed class LateFeeCalculatorWorker : BackgroundService
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ILogger<LateFeeCalculatorWorker> _logger;

    public LateFeeCalculatorWorker(
        IDbConnectionFactory connectionFactory,
        IAuditLogRepository auditLogRepository,
        ILogger<LateFeeCalculatorWorker> logger)
    {
        _connectionFactory = connectionFactory;
        _auditLogRepository = auditLogRepository;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("⏰ [AdminSoftGPF.Functions] LateFeeCalculatorWorker iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("🔎 Evaluando facturas vencidas para aplicación de recargos por mora...");
                
                await using var connection = await _connectionFactory.CreateConnectionAsync(stoppingToken);
                
                // Consultar facturas vencidas que no hayan sido pagadas
                var selectSql = @"
                    SELECT Id, TenantId, Amount, BalanceDue, Status, DueDate
                    FROM app.Invoice
                    WHERE Status IN ('Unpaid', 'Partial')
                      AND DueDate < CAST(SYSUTCDATETIME() AS DATE);";

                var overdueInvoices = new List<(Guid Id, Guid TenantId, decimal Amount, decimal BalanceDue, string Status)>();

                await using (var cmd = new SqlCommand(selectSql, connection))
                await using (var reader = await cmd.ExecuteReaderAsync(stoppingToken))
                {
                    while (await reader.ReadAsync(stoppingToken))
                    {
                        overdueInvoices.Add((
                            reader.GetGuid(0),
                            reader.GetGuid(1),
                            reader.GetDecimal(2),
                            reader.GetDecimal(3),
                            reader.GetString(4)
                        ));
                    }
                }

                if (overdueInvoices.Count > 0)
                {
                    _logger.LogInformation("📌 Se encontraron {Count} facturas vencidas para procesar mora.", overdueInvoices.Count);

                    foreach (var inv in overdueInvoices)
                    {
                        // Tasa estándar de mora: 5% sobre el monto base
                        decimal lateFeeRate = 0.05m;
                        decimal lateFeeAmount = Math.Round(inv.Amount * lateFeeRate, 2);
                        decimal newBalance = inv.BalanceDue + lateFeeAmount;

                        var updateSql = @"
                            UPDATE app.Invoice
                            SET BalanceDue = @NewBalance
                            WHERE Id = @Id AND TenantId = @TenantId;";

                        await using (var updateCmd = new SqlCommand(updateSql, connection))
                        {
                            updateCmd.Parameters.Add(new SqlParameter("@NewBalance", SqlDbType.Decimal) { Value = newBalance, Precision = 19, Scale = 4 });
                            updateCmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = inv.Id });
                            updateCmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = inv.TenantId });

                            await updateCmd.ExecuteNonQueryAsync(stoppingToken);
                        }

                        // Registrar en Auditoría
                        await _auditLogRepository.InsertAsync(new AuditLog
                        {
                            TenantId = inv.TenantId,
                            UserId = Guid.Parse("00000000-0000-0000-0000-000000000001"), // System Worker
                            Action = "LateFeeApplied",
                            TableName = "app.Invoice",
                            RecordId = inv.Id.ToString(),
                            OldValues = $"{{\"BalanceDue\": {inv.BalanceDue}}}",
                            NewValues = $"{{\"BalanceDue\": {newBalance}, \"LateFee\": {lateFeeAmount}}}"
                        }, stoppingToken);

                        _logger.LogInformation("✅ Recargo por mora de RD$ {LateFee} aplicado a Factura {InvoiceId}", lateFeeAmount, inv.Id);
                    }
                }
                else
                {
                    _logger.LogInformation("✨ No hay facturas vencidas pendientes de recargo.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error en el cálculo programado de recargos por mora.");
            }

            // Ejecución cada hora (o cada 1 hora en background)
            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }
    }
}
