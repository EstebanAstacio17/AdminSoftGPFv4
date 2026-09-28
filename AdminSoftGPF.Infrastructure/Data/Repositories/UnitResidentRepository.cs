using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class UnitResidentRepository : IUnitResidentRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public UnitResidentRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<IReadOnlyList<UnitResident>> ListByUnitAsync(Guid unitId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_UnitResident_ListByUnit", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = unitId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<UnitResident>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapUnitResident(reader));
        }

        return list;
    }

    public async Task<IReadOnlyList<UnitResident>> ListByPersonAsync(Guid personId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_UnitResident_ListByPerson", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@PersonId", SqlDbType.UniqueIdentifier) { Value = personId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<UnitResident>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapUnitResident(reader));
        }

        return list;
    }

    public async Task<Guid> AssignAsync(UnitResident unitResident, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_UnitResident_Assign", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = unitResident.TenantId });
        command.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = unitResident.UnitId });
        command.Parameters.Add(new SqlParameter("@PersonId", SqlDbType.UniqueIdentifier) { Value = unitResident.PersonId });
        command.Parameters.Add(new SqlParameter("@RelationshipType", SqlDbType.VarChar, 30) { Value = unitResident.RelationshipType });
        command.Parameters.Add(new SqlParameter("@IsActive", SqlDbType.Bit) { Value = unitResident.IsActive });

        await command.ExecuteNonQueryAsync(cancellationToken);
        unitResident.Id = (Guid)outputParam.Value;
        return unitResident.Id;
    }

    public async Task DeactivateAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_UnitResident_Deactivate", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static UnitResident MapUnitResident(SqlDataReader reader)
    {
        return new UnitResident
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            UnitId = reader.GetGuidSafe("UnitId"),
            PersonId = reader.GetGuidSafe("PersonId"),
            RelationshipType = reader.GetStringSafe("RelationshipType"),
            IsActive = reader.GetBooleanSafe("IsActive")
        };
    }
}
