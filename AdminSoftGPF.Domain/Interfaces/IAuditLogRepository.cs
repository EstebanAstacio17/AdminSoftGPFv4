using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para registro inmutable de auditoría (Esquema audit.AuditLog).
/// Append-only: solo permite inserción y lectura histórica.
/// </summary>
public interface IAuditLogRepository
{
    Task<long> InsertAsync(AuditLog log, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AuditLog>> ListByRecordAsync(string tableName, string recordId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AuditLog>> ListByTenantAsync(Guid tenantId, int maxRecords = 100, CancellationToken cancellationToken = default);
}
