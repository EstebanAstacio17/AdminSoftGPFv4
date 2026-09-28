using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class UnitRepository : IUnitRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public UnitRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Unit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Unit_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapUnit(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<Unit>> ListByBlockAsync(Guid blockId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Unit_ListByBlock", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@BlockId", SqlDbType.UniqueIdentifier) { Value = blockId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Unit>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapUnit(reader));
        }

        return list;
    }

    public async Task<IReadOnlyList<Unit>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Unit_ListByProperty", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = propertyId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Unit>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapUnit(reader));
        }

        return list;
    }

    public async Task<Guid> CreateAsync(Unit unit, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Unit_Create", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = unit.TenantId });
        command.Parameters.Add(new SqlParameter("@BlockId", SqlDbType.UniqueIdentifier) { Value = unit.BlockId });
        command.Parameters.Add(new SqlParameter("@UnitNumber", SqlDbType.NVarChar, 50) { Value = unit.UnitNumber });
        command.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = unit.Status });

        await command.ExecuteNonQueryAsync(cancellationToken);
        unit.Id = (Guid)outputParam.Value;
        return unit.Id;
    }

    public async Task UpdateAsync(Unit unit, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Unit_Update", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = unit.Id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = unit.TenantId });
        command.Parameters.Add(new SqlParameter("@UnitNumber", SqlDbType.NVarChar, 50) { Value = unit.UnitNumber });
        command.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = unit.Status });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Unit MapUnit(SqlDataReader reader)
    {
        return new Unit
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            BlockId = reader.GetGuidSafe("BlockId"),
            UnitNumber = reader.GetStringSafe("UnitNumber"),
            Status = reader.GetStringSafe("Status")
        };
    }
}
