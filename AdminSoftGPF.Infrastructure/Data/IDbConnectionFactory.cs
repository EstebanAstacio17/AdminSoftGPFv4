using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data;

/// <summary>
/// Fábrica para crear conexiones abiertas y seguras a Azure SQL Database.
/// Inyecta de forma transparente el SESSION_CONTEXT(TenantId) para activar el Row-Level Security (RLS).
/// </summary>
public interface IDbConnectionFactory
{
    /// <summary>
    /// Crea y abre una nueva conexión SqlConnection, configurando el SESSION_CONTEXT con el TenantId actual si aplica.
    /// </summary>
    Task<SqlConnection> CreateConnectionAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Crea una conexión abierta asociada explícitamente a un TenantId específico (utilizado en migraciones o tareas de background).
    /// </summary>
    Task<SqlConnection> CreateConnectionForTenantAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
