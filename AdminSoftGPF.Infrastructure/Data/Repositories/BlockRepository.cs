using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class BlockRepository : IBlockRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public BlockRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Block?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Block_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapBlock(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<Block>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Block_ListByProperty", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = propertyId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Block>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapBlock(reader));
        }

        return list;
    }

    public async Task<Guid> CreateAsync(Block block, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Block_Create", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = block.TenantId });
        command.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = block.PropertyId });
        command.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 100) { Value = block.Name });

        await command.ExecuteNonQueryAsync(cancellationToken);
        block.Id = (Guid)outputParam.Value;
        return block.Id;
    }

    public async Task UpdateAsync(Block block, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Block_Update", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = block.Id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = block.TenantId });
        command.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 100) { Value = block.Name });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Block MapBlock(SqlDataReader reader)
    {
        return new Block
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            PropertyId = reader.GetGuidSafe("PropertyId"),
            Name = reader.GetStringSafe("Name")
        };
    }
}
