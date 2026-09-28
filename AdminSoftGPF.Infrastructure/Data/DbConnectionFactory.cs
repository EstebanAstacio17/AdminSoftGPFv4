using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace AdminSoftGPF.Infrastructure.Data;

/// <summary>
/// Implementación de IDbConnectionFactory.
/// Configura el SESSION_CONTEXT de SQL Server antes de entregar la conexión,
/// garantizando que las consultas respeten las políticas de Row-Level Security (RLS).
/// </summary>
public sealed class DbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;
    private readonly ITenantContext _tenantContext;

    public DbConnectionFactory(IConfiguration configuration, ITenantContext tenantContext)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("La cadena de conexión 'DefaultConnection' no está configurada.");
        _tenantContext = tenantContext;
    }

    public async Task<SqlConnection> CreateConnectionAsync(CancellationToken cancellationToken = default)
    {
        var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        if (_tenantContext.HasTenant && _tenantContext.TenantId.HasValue)
        {
            await SetSessionContextAsync(connection, _tenantContext.TenantId.Value, cancellationToken);
        }

        return connection;
    }

    public async Task<SqlConnection> CreateConnectionForTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        if (tenantId != Guid.Empty)
        {
            await SetSessionContextAsync(connection, tenantId, cancellationToken);
        }

        return connection;
    }

    private static async Task SetSessionContextAsync(SqlConnection connection, Guid tenantId, CancellationToken cancellationToken)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "EXEC sp_set_session_context @key = N'TenantId', @value = @TenantId;";
        command.CommandType = CommandType.Text;

        var param = command.Parameters.Add("@TenantId", SqlDbType.UniqueIdentifier);
        param.Value = tenantId;

        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
