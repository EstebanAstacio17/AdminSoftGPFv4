using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class PersonRepository : IPersonRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public PersonRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Person?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Person_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapPerson(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<Person>> ListByTenantAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Person_ListByTenant", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Person>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapPerson(reader));
        }

        return list;
    }

    public async Task<Guid> CreateAsync(Person person, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Person_Create", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = person.TenantId });
        command.Parameters.Add(new SqlParameter("@FirstName", SqlDbType.NVarChar, 100) { Value = person.FirstName });
        command.Parameters.Add(new SqlParameter("@LastName", SqlDbType.NVarChar, 100) { Value = person.LastName });
        command.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 200) { Value = person.Email.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@TaxId", SqlDbType.NVarChar, 30) { Value = person.TaxId.ToDbValue() });

        await command.ExecuteNonQueryAsync(cancellationToken);
        person.Id = (Guid)outputParam.Value;
        return person.Id;
    }

    public async Task UpdateAsync(Person person, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Person_Update", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = person.Id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = person.TenantId });
        command.Parameters.Add(new SqlParameter("@FirstName", SqlDbType.NVarChar, 100) { Value = person.FirstName });
        command.Parameters.Add(new SqlParameter("@LastName", SqlDbType.NVarChar, 100) { Value = person.LastName });
        command.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 200) { Value = person.Email.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@TaxId", SqlDbType.NVarChar, 30) { Value = person.TaxId.ToDbValue() });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    /// <summary>
    /// Soft-Anonymization: Sobrescribe datos PII sin borrar el registro ni romper integridad histórica.
    /// </summary>
    public async Task AnonymizeAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Person_Anonymize", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static Person MapPerson(SqlDataReader reader)
    {
        return new Person
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            FirstName = reader.GetStringSafe("FirstName"),
            LastName = reader.GetStringSafe("LastName"),
            Email = reader.GetNullableStringSafe("Email"),
            TaxId = reader.GetNullableStringSafe("TaxId")
        };
    }
}
