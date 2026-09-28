using System.Data;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public UserRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_User_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapUser(reader);
        }

        return null;
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_User_GetByEmail", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 200) { Value = email });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapUser(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<User>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_User_ListByTenant", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = tenantId });

        var list = new List<User>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapUser(reader));
        }

        return list;
    }

    public async Task<Guid> CreateAsync(User user, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_User_Create", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = user.TenantId.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 200) { Value = user.Email });
        command.Parameters.Add(new SqlParameter("@PasswordHash", SqlDbType.NVarChar, 500) { Value = user.PasswordHash });
        command.Parameters.Add(new SqlParameter("@Role", SqlDbType.VarChar, 50) { Value = user.Role });
        command.Parameters.Add(new SqlParameter("@IsActive", SqlDbType.Bit) { Value = user.IsActive });

        await command.ExecuteNonQueryAsync(cancellationToken);
        user.Id = (Guid)outputParam.Value;
        return user.Id;
    }

    public async Task UpdatePasswordHashAsync(Guid id, string passwordHash, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_User_UpdatePassword", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@PasswordHash", SqlDbType.NVarChar, 500) { Value = passwordHash });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task SetActiveStatusAsync(Guid id, bool isActive, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("saas.usp_User_SetActive", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@IsActive", SqlDbType.Bit) { Value = isActive });

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static User MapUser(SqlDataReader reader)
    {
        return new User
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetNullableGuidSafe("TenantId"),
            Email = reader.GetStringSafe("Email"),
            PasswordHash = reader.GetStringSafe("PasswordHash"),
            Role = reader.GetStringSafe("Role"),
            IsActive = reader.GetBooleanSafe("IsActive")
        };
    }
}
