using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class PropertyRepository : IPropertyRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public PropertyRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Property?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Property_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapProperty(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<Property>> ListByTenantAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Property_ListByTenant", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Property>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapProperty(reader));
        }

        return list;
    }

    public async Task<Guid> CreateAsync(Property property, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Property_Create", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = property.TenantId });
        command.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 150) { Value = property.Name });
        command.Parameters.Add(new SqlParameter("@Address", SqlDbType.NVarChar, 300) { Value = property.Address });

        await command.ExecuteNonQueryAsync(cancellationToken);
        property.Id = (Guid)outputParam.Value;
        return property.Id;
    }

    public async Task UpdateAsync(Property property, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Property_Update", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = property.Id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = property.TenantId });
        command.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 150) { Value = property.Name });
        command.Parameters.Add(new SqlParameter("@Address", SqlDbType.NVarChar, 300) { Value = property.Address });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Property MapProperty(SqlDataReader reader)
    {
        return new Property
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            Name = reader.GetStringSafe("Name"),
            Address = reader.GetStringSafe("Address")
        };
    }
}
