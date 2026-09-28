using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class OutboxRepository : IOutboxRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public OutboxRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task InsertAsync(OutboxMessage message, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            INSERT INTO app.OutboxMessage (Id, TenantId, EventType, Payload, CreatedAt, ProcessedAt, Error)
            VALUES (@Id, @TenantId, @EventType, @Payload, @CreatedAt, NULL, NULL);";

        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = message.Id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = message.TenantId });
        command.Parameters.Add(new SqlParameter("@EventType", SqlDbType.VarChar, 100) { Value = message.EventType });
        command.Parameters.Add(new SqlParameter("@Payload", SqlDbType.NVarChar, -1) { Value = message.Payload });
        command.Parameters.Add(new SqlParameter("@CreatedAt", SqlDbType.DateTime2) { Value = message.CreatedAt });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<OutboxMessage>> GetUnprocessedMessagesAsync(int batchSize = 50, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            SELECT TOP (@BatchSize) Id, TenantId, EventType, Payload, CreatedAt, ProcessedAt, Error
            FROM app.OutboxMessage WITH (ROWLOCK, READPAST)
            WHERE ProcessedAt IS NULL
            ORDER BY CreatedAt ASC;";

        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add(new SqlParameter("@BatchSize", SqlDbType.Int) { Value = batchSize });

        var list = new List<OutboxMessage>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new OutboxMessage
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                EventType = reader.GetStringSafe("EventType"),
                Payload = reader.GetStringSafe("Payload"),
                CreatedAt = reader.GetDateTimeSafe("CreatedAt"),
                ProcessedAt = reader.IsDBNull(reader.GetOrdinal("ProcessedAt")) ? null : reader.GetDateTimeSafe("ProcessedAt"),
                Error = reader.GetNullableStringSafe("Error")
            });
        }

        return list;
    }

    public async Task MarkAsProcessedAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            UPDATE app.OutboxMessage
            SET ProcessedAt = SYSUTCDATETIME(), Error = NULL
            WHERE Id = @Id;";

        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task MarkAsFailedAsync(Guid id, string error, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            UPDATE app.OutboxMessage
            SET Error = @Error
            WHERE Id = @Id;";

        await using var command = new SqlCommand(sql, connection);
        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@Error", SqlDbType.NVarChar, -1) { Value = error });
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}
