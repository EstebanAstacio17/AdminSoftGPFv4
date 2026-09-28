using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class AuditLogRepository : IAuditLogRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public AuditLogRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<long> InsertAsync(AuditLog log, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("audit.usp_AuditLog_Insert", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.BigInt)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = log.TenantId });
        command.Parameters.Add(new SqlParameter("@UserId", SqlDbType.UniqueIdentifier) { Value = log.UserId });
        command.Parameters.Add(new SqlParameter("@ImpersonatorId", SqlDbType.UniqueIdentifier) { Value = log.ImpersonatorId.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@Action", SqlDbType.VarChar, 30) { Value = log.Action });
        command.Parameters.Add(new SqlParameter("@TableName", SqlDbType.VarChar, 100) { Value = log.TableName });
        command.Parameters.Add(new SqlParameter("@RecordId", SqlDbType.VarChar, 100) { Value = log.RecordId });
        command.Parameters.Add(new SqlParameter("@OldValues", SqlDbType.NVarChar, -1) { Value = log.OldValues.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@NewValues", SqlDbType.NVarChar, -1) { Value = log.NewValues.ToDbValue() });

        await command.ExecuteNonQueryAsync(cancellationToken);
        log.Id = (long)outputParam.Value;
        return log.Id;
    }

    public async Task<IReadOnlyList<AuditLog>> ListByRecordAsync(string tableName, string recordId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("audit.usp_AuditLog_ListByRecord", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@TableName", SqlDbType.VarChar, 100) { Value = tableName });
        command.Parameters.Add(new SqlParameter("@RecordId", SqlDbType.VarChar, 100) { Value = recordId });

        var list = new List<AuditLog>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapAuditLog(reader));
        }

        return list;
    }

    public async Task<IReadOnlyList<AuditLog>> ListByTenantAsync(Guid tenantId, int maxRecords = 100, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("audit.usp_AuditLog_ListByTenant", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = tenantId });
        command.Parameters.Add(new SqlParameter("@MaxRecords", SqlDbType.Int) { Value = maxRecords });

        var list = new List<AuditLog>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapAuditLog(reader));
        }

        return list;
    }

    private static AuditLog MapAuditLog(SqlDataReader reader)
    {
        return new AuditLog
        {
            Id = reader.GetInt64Safe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            UserId = reader.GetGuidSafe("UserId"),
            ImpersonatorId = reader.GetNullableGuidSafe("ImpersonatorId"),
            Action = reader.GetStringSafe("Action"),
            TableName = reader.GetStringSafe("TableName"),
            RecordId = reader.GetStringSafe("RecordId"),
            OldValues = reader.GetNullableStringSafe("OldValues"),
            NewValues = reader.GetNullableStringSafe("NewValues"),
            CreatedAt = reader.GetDateTimeSafe("CreatedAt")
        };
    }
}
