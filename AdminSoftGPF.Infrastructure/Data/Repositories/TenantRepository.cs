using System.Data;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class TenantRepository : ITenantRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public TenantRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<Tenant?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_Tenant_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapTenant(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<Tenant>> ListAllAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_Tenant_ListAll", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var list = new List<Tenant>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapTenant(reader));
        }

        return list;
    }

    public async Task<Guid> CreateAsync(Tenant tenant, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_Tenant_Create", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 150) { Value = tenant.Name });
        command.Parameters.Add(new SqlParameter("@TaxId", SqlDbType.NVarChar, 30) { Value = tenant.TaxId.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 20) { Value = tenant.Status });

        await command.ExecuteNonQueryAsync(cancellationToken);
        tenant.Id = (Guid)outputParam.Value;
        return tenant.Id;
    }

    public async Task UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_Tenant_UpdateStatus", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 20) { Value = status });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Tenant MapTenant(SqlDataReader reader)
    {
        return new Tenant
        {
            Id = reader.GetGuidSafe("Id"),
            Name = reader.GetStringSafe("Name"),
            TaxId = reader.GetNullableStringSafe("TaxId"),
            Status = reader.GetStringSafe("Status"),
            CreatedAt = reader.GetDateTimeSafe("CreatedAt")
        };
    }
}
