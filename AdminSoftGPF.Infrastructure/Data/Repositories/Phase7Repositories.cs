using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

// ── Suppliers & Expenses ────────────────────────────────────────────
public sealed class SupplierRepository : ISupplierRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public SupplierRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Supplier?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive FROM app.Supplier WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new Supplier
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                Name = reader.GetStringSafe("Name"),
                TaxId = reader.GetNullableStringSafe("TaxId"),
                Email = reader.GetNullableStringSafe("Email"),
                Phone = reader.GetNullableStringSafe("Phone"),
                Address = reader.GetNullableStringSafe("Address"),
                IsActive = reader.GetBooleanSafe("IsActive")
            };
        }
        return null;
    }

    public async Task<IReadOnlyList<Supplier>> ListByTenantAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive FROM app.Supplier WHERE TenantId = @TenantId ORDER BY Name ASC;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Supplier>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new Supplier
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                Name = reader.GetStringSafe("Name"),
                TaxId = reader.GetNullableStringSafe("TaxId"),
                Email = reader.GetNullableStringSafe("Email"),
                Phone = reader.GetNullableStringSafe("Phone"),
                Address = reader.GetNullableStringSafe("Address"),
                IsActive = reader.GetBooleanSafe("IsActive")
            });
        }
        return list;
    }

    public async Task<Guid> CreateAsync(Supplier supplier, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        supplier.Id = Guid.NewGuid();
        var sql = @"
            INSERT INTO app.Supplier (Id, TenantId, Name, TaxId, Email, Phone, Address, IsActive)
            VALUES (@Id, @TenantId, @Name, @TaxId, @Email, @Phone, @Address, @IsActive);";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = supplier.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = supplier.TenantId });
        cmd.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 150) { Value = supplier.Name });
        cmd.Parameters.Add(new SqlParameter("@TaxId", SqlDbType.NVarChar, 30) { Value = supplier.TaxId.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 200) { Value = supplier.Email.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Phone", SqlDbType.NVarChar, 50) { Value = supplier.Phone.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Address", SqlDbType.NVarChar, 300) { Value = supplier.Address.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@IsActive", SqlDbType.Bit) { Value = supplier.IsActive });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        return supplier.Id;
    }

    public async Task UpdateAsync(Supplier supplier, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            UPDATE app.Supplier
            SET Name = @Name, TaxId = @TaxId, Email = @Email, Phone = @Phone, Address = @Address, IsActive = @IsActive
            WHERE Id = @Id AND TenantId = @TenantId;";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = supplier.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = supplier.TenantId });
        cmd.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 150) { Value = supplier.Name });
        cmd.Parameters.Add(new SqlParameter("@TaxId", SqlDbType.NVarChar, 30) { Value = supplier.TaxId.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Email", SqlDbType.NVarChar, 200) { Value = supplier.Email.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Phone", SqlDbType.NVarChar, 50) { Value = supplier.Phone.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Address", SqlDbType.NVarChar, 300) { Value = supplier.Address.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@IsActive", SqlDbType.Bit) { Value = supplier.IsActive });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}

public sealed class ExpenseRepository : IExpenseRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public ExpenseRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Expense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, PropertyId, SupplierId, Concept, Amount, ExpenseDate, FiscalReceiptNumber, Status FROM app.Expense WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new Expense
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                SupplierId = reader.GetNullableGuidSafe("SupplierId"),
                Concept = reader.GetStringSafe("Concept"),
                Amount = reader.GetDecimalSafe("Amount"),
                ExpenseDate = reader.GetDateOnlySafe("ExpenseDate"),
                FiscalReceiptNumber = reader.GetNullableStringSafe("FiscalReceiptNumber"),
                Status = reader.GetStringSafe("Status")
            };
        }
        return null;
    }

    public async Task<IReadOnlyList<Expense>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, PropertyId, SupplierId, Concept, Amount, ExpenseDate, FiscalReceiptNumber, Status FROM app.Expense WHERE PropertyId = @PropertyId AND TenantId = @TenantId ORDER BY ExpenseDate DESC;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = propertyId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Expense>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new Expense
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                SupplierId = reader.GetNullableGuidSafe("SupplierId"),
                Concept = reader.GetStringSafe("Concept"),
                Amount = reader.GetDecimalSafe("Amount"),
                ExpenseDate = reader.GetDateOnlySafe("ExpenseDate"),
                FiscalReceiptNumber = reader.GetNullableStringSafe("FiscalReceiptNumber"),
                Status = reader.GetStringSafe("Status")
            });
        }
        return list;
    }

    public async Task<Guid> CreateAsync(Expense expense, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        expense.Id = Guid.NewGuid();
        var sql = @"
            INSERT INTO app.Expense (Id, TenantId, PropertyId, SupplierId, Concept, Amount, ExpenseDate, FiscalReceiptNumber, Status)
            VALUES (@Id, @TenantId, @PropertyId, @SupplierId, @Concept, @Amount, @ExpenseDate, @FiscalReceiptNumber, @Status);";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = expense.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = expense.TenantId });
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = expense.PropertyId });
        cmd.Parameters.Add(new SqlParameter("@SupplierId", SqlDbType.UniqueIdentifier) { Value = expense.SupplierId.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Concept", SqlDbType.NVarChar, 250) { Value = expense.Concept });
        cmd.Parameters.Add(new SqlParameter("@Amount", SqlDbType.Decimal) { Value = expense.Amount, Precision = 19, Scale = 4 });
        cmd.Parameters.Add(new SqlParameter("@ExpenseDate", SqlDbType.Date) { Value = expense.ExpenseDate.ToDateTime(TimeOnly.MinValue) });
        cmd.Parameters.Add(new SqlParameter("@FiscalReceiptNumber", SqlDbType.VarChar, 50) { Value = expense.FiscalReceiptNumber.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = expense.Status });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        return expense.Id;
    }
}

// ── Maintenance Tickets ─────────────────────────────────────────────
public sealed class MaintenanceTicketRepository : IMaintenanceTicketRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public MaintenanceTicketRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<MaintenanceTicket?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, PropertyId, UnitId, ReportedByPersonId, Title, Description, Priority, Status, CreatedAt, ResolvedAt FROM app.MaintenanceTicket WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new MaintenanceTicket
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                UnitId = reader.GetNullableGuidSafe("UnitId"),
                ReportedByPersonId = reader.GetGuidSafe("ReportedByPersonId"),
                Title = reader.GetStringSafe("Title"),
                Description = reader.GetStringSafe("Description"),
                Priority = reader.GetStringSafe("Priority"),
                Status = reader.GetStringSafe("Status"),
                CreatedAt = reader.GetDateTimeSafe("CreatedAt"),
                ResolvedAt = reader.IsDBNull(reader.GetOrdinal("ResolvedAt")) ? null : reader.GetDateTimeSafe("ResolvedAt")
            };
        }
        return null;
    }

    public async Task<IReadOnlyList<MaintenanceTicket>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, PropertyId, UnitId, ReportedByPersonId, Title, Description, Priority, Status, CreatedAt, ResolvedAt FROM app.MaintenanceTicket WHERE PropertyId = @PropertyId AND TenantId = @TenantId ORDER BY CreatedAt DESC;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = propertyId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<MaintenanceTicket>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new MaintenanceTicket
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                UnitId = reader.GetNullableGuidSafe("UnitId"),
                ReportedByPersonId = reader.GetGuidSafe("ReportedByPersonId"),
                Title = reader.GetStringSafe("Title"),
                Description = reader.GetStringSafe("Description"),
                Priority = reader.GetStringSafe("Priority"),
                Status = reader.GetStringSafe("Status"),
                CreatedAt = reader.GetDateTimeSafe("CreatedAt"),
                ResolvedAt = reader.IsDBNull(reader.GetOrdinal("ResolvedAt")) ? null : reader.GetDateTimeSafe("ResolvedAt")
            });
        }
        return list;
    }

    public async Task<IReadOnlyList<MaintenanceTicket>> ListByUnitAsync(Guid unitId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, PropertyId, UnitId, ReportedByPersonId, Title, Description, Priority, Status, CreatedAt, ResolvedAt FROM app.MaintenanceTicket WHERE UnitId = @UnitId AND TenantId = @TenantId ORDER BY CreatedAt DESC;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = unitId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<MaintenanceTicket>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new MaintenanceTicket
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                UnitId = reader.GetNullableGuidSafe("UnitId"),
                ReportedByPersonId = reader.GetGuidSafe("ReportedByPersonId"),
                Title = reader.GetStringSafe("Title"),
                Description = reader.GetStringSafe("Description"),
                Priority = reader.GetStringSafe("Priority"),
                Status = reader.GetStringSafe("Status"),
                CreatedAt = reader.GetDateTimeSafe("CreatedAt"),
                ResolvedAt = reader.IsDBNull(reader.GetOrdinal("ResolvedAt")) ? null : reader.GetDateTimeSafe("ResolvedAt")
            });
        }
        return list;
    }

    public async Task<Guid> CreateAsync(MaintenanceTicket ticket, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        ticket.Id = Guid.NewGuid();
        var sql = @"
            INSERT INTO app.MaintenanceTicket (Id, TenantId, PropertyId, UnitId, ReportedByPersonId, Title, Description, Priority, Status, CreatedAt, ResolvedAt)
            VALUES (@Id, @TenantId, @PropertyId, @UnitId, @ReportedByPersonId, @Title, @Description, @Priority, @Status, SYSUTCDATETIME(), NULL);";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = ticket.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = ticket.TenantId });
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = ticket.PropertyId });
        cmd.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = ticket.UnitId.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@ReportedByPersonId", SqlDbType.UniqueIdentifier) { Value = ticket.ReportedByPersonId });
        cmd.Parameters.Add(new SqlParameter("@Title", SqlDbType.NVarChar, 150) { Value = ticket.Title });
        cmd.Parameters.Add(new SqlParameter("@Description", SqlDbType.NVarChar, -1) { Value = ticket.Description });
        cmd.Parameters.Add(new SqlParameter("@Priority", SqlDbType.VarChar, 30) { Value = ticket.Priority });
        cmd.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = ticket.Status });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        return ticket.Id;
    }

    public async Task UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            UPDATE app.MaintenanceTicket
            SET Status = @Status,
                ResolvedAt = CASE WHEN @Status IN ('Resolved', 'Closed') THEN SYSUTCDATETIME() ELSE NULL END
            WHERE Id = @Id AND TenantId = @TenantId;";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });
        cmd.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = status });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}

// ── Facilities & Amenities ──────────────────────────────────────────
public sealed class FacilitiesRepository : IFacilitiesRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public FacilitiesRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Amenity?> GetAmenityByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, PropertyId, Name, Capacity, HourlyRate, IsActive FROM app.Amenity WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new Amenity
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                Name = reader.GetStringSafe("Name"),
                Capacity = reader.GetInt32(reader.GetOrdinal("Capacity")),
                HourlyRate = reader.GetDecimalSafe("HourlyRate"),
                IsActive = reader.GetBooleanSafe("IsActive")
            };
        }
        return null;
    }

    public async Task<IReadOnlyList<Amenity>> ListAmenitiesByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, PropertyId, Name, Capacity, HourlyRate, IsActive FROM app.Amenity WHERE PropertyId = @PropertyId AND TenantId = @TenantId ORDER BY Name ASC;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = propertyId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Amenity>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new Amenity
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                Name = reader.GetStringSafe("Name"),
                Capacity = reader.GetInt32(reader.GetOrdinal("Capacity")),
                HourlyRate = reader.GetDecimalSafe("HourlyRate"),
                IsActive = reader.GetBooleanSafe("IsActive")
            });
        }
        return list;
    }

    public async Task<Guid> CreateAmenityAsync(Amenity amenity, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        amenity.Id = Guid.NewGuid();
        var sql = @"
            INSERT INTO app.Amenity (Id, TenantId, PropertyId, Name, Capacity, HourlyRate, IsActive)
            VALUES (@Id, @TenantId, @PropertyId, @Name, @Capacity, @HourlyRate, @IsActive);";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = amenity.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = amenity.TenantId });
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = amenity.PropertyId });
        cmd.Parameters.Add(new SqlParameter("@Name", SqlDbType.NVarChar, 100) { Value = amenity.Name });
        cmd.Parameters.Add(new SqlParameter("@Capacity", SqlDbType.Int) { Value = amenity.Capacity });
        cmd.Parameters.Add(new SqlParameter("@HourlyRate", SqlDbType.Decimal) { Value = amenity.HourlyRate, Precision = 19, Scale = 4 });
        cmd.Parameters.Add(new SqlParameter("@IsActive", SqlDbType.Bit) { Value = amenity.IsActive });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        return amenity.Id;
    }

    public async Task<AmenityBooking?> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, AmenityId, PersonId, UnitId, StartTime, EndTime, TotalAmount, Status, CreatedAt FROM app.AmenityBooking WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new AmenityBooking
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                AmenityId = reader.GetGuidSafe("AmenityId"),
                PersonId = reader.GetGuidSafe("PersonId"),
                UnitId = reader.GetGuidSafe("UnitId"),
                StartTime = reader.GetDateTimeSafe("StartTime"),
                EndTime = reader.GetDateTimeSafe("EndTime"),
                TotalAmount = reader.GetDecimalSafe("TotalAmount"),
                Status = reader.GetStringSafe("Status"),
                CreatedAt = reader.GetDateTimeSafe("CreatedAt")
            };
        }
        return null;
    }

    public async Task<IReadOnlyList<AmenityBooking>> ListBookingsByAmenityAsync(Guid amenityId, DateOnly date, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            SELECT Id, TenantId, AmenityId, PersonId, UnitId, StartTime, EndTime, TotalAmount, Status, CreatedAt
            FROM app.AmenityBooking
            WHERE AmenityId = @AmenityId AND TenantId = @TenantId 
              AND CAST(StartTime AS DATE) = @Date
              AND Status != 'Cancelled'
            ORDER BY StartTime ASC;";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@AmenityId", SqlDbType.UniqueIdentifier) { Value = amenityId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });
        cmd.Parameters.Add(new SqlParameter("@Date", SqlDbType.Date) { Value = date.ToDateTime(TimeOnly.MinValue) });

        var list = new List<AmenityBooking>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new AmenityBooking
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                AmenityId = reader.GetGuidSafe("AmenityId"),
                PersonId = reader.GetGuidSafe("PersonId"),
                UnitId = reader.GetGuidSafe("UnitId"),
                StartTime = reader.GetDateTimeSafe("StartTime"),
                EndTime = reader.GetDateTimeSafe("EndTime"),
                TotalAmount = reader.GetDecimalSafe("TotalAmount"),
                Status = reader.GetStringSafe("Status"),
                CreatedAt = reader.GetDateTimeSafe("CreatedAt")
            });
        }
        return list;
    }

    public async Task<Guid> CreateBookingAsync(AmenityBooking booking, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        booking.Id = Guid.NewGuid();
        var sql = @"
            INSERT INTO app.AmenityBooking (Id, TenantId, AmenityId, PersonId, UnitId, StartTime, EndTime, TotalAmount, Status, CreatedAt)
            VALUES (@Id, @TenantId, @AmenityId, @PersonId, @UnitId, @StartTime, @EndTime, @TotalAmount, @Status, SYSUTCDATETIME());";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = booking.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = booking.TenantId });
        cmd.Parameters.Add(new SqlParameter("@AmenityId", SqlDbType.UniqueIdentifier) { Value = booking.AmenityId });
        cmd.Parameters.Add(new SqlParameter("@PersonId", SqlDbType.UniqueIdentifier) { Value = booking.PersonId });
        cmd.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = booking.UnitId });
        cmd.Parameters.Add(new SqlParameter("@StartTime", SqlDbType.DateTime2) { Value = booking.StartTime });
        cmd.Parameters.Add(new SqlParameter("@EndTime", SqlDbType.DateTime2) { Value = booking.EndTime });
        cmd.Parameters.Add(new SqlParameter("@TotalAmount", SqlDbType.Decimal) { Value = booking.TotalAmount, Precision = 19, Scale = 4 });
        cmd.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = booking.Status });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        return booking.Id;
    }

    public async Task CancelBookingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "UPDATE app.AmenityBooking SET Status = 'Cancelled' WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}

// ── Security & Gate Access ──────────────────────────────────────────
public sealed class SecurityAccessRepository : ISecurityAccessRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public SecurityAccessRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<VisitorPass?> GetPassByQrTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, UnitId, VisitorName, VisitorIdNumber, ValidFrom, ValidTo, QrCodeToken, Status FROM app.VisitorPass WHERE QrCodeToken = @Token AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Token", SqlDbType.VarChar, 100) { Value = token });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new VisitorPass
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                UnitId = reader.GetGuidSafe("UnitId"),
                VisitorName = reader.GetStringSafe("VisitorName"),
                VisitorIdNumber = reader.GetNullableStringSafe("VisitorIdNumber"),
                ValidFrom = reader.GetDateTimeSafe("ValidFrom"),
                ValidTo = reader.GetDateTimeSafe("ValidTo"),
                QrCodeToken = reader.GetStringSafe("QrCodeToken"),
                Status = reader.GetStringSafe("Status")
            };
        }
        return null;
    }

    public async Task<IReadOnlyList<VisitorPass>> ListActivePassesByUnitAsync(Guid unitId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "SELECT Id, TenantId, UnitId, VisitorName, VisitorIdNumber, ValidFrom, ValidTo, QrCodeToken, Status FROM app.VisitorPass WHERE UnitId = @UnitId AND TenantId = @TenantId AND Status = 'Active' ORDER BY ValidFrom DESC;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = unitId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<VisitorPass>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new VisitorPass
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                UnitId = reader.GetGuidSafe("UnitId"),
                VisitorName = reader.GetStringSafe("VisitorName"),
                VisitorIdNumber = reader.GetNullableStringSafe("VisitorIdNumber"),
                ValidFrom = reader.GetDateTimeSafe("ValidFrom"),
                ValidTo = reader.GetDateTimeSafe("ValidTo"),
                QrCodeToken = reader.GetStringSafe("QrCodeToken"),
                Status = reader.GetStringSafe("Status")
            });
        }
        return list;
    }

    public async Task<Guid> CreateVisitorPassAsync(VisitorPass pass, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        pass.Id = Guid.NewGuid();
        var sql = @"
            INSERT INTO app.VisitorPass (Id, TenantId, UnitId, VisitorName, VisitorIdNumber, ValidFrom, ValidTo, QrCodeToken, Status)
            VALUES (@Id, @TenantId, @UnitId, @VisitorName, @VisitorIdNumber, @ValidFrom, @ValidTo, @QrCodeToken, @Status);";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = pass.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = pass.TenantId });
        cmd.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = pass.UnitId });
        cmd.Parameters.Add(new SqlParameter("@VisitorName", SqlDbType.NVarChar, 150) { Value = pass.VisitorName });
        cmd.Parameters.Add(new SqlParameter("@VisitorIdNumber", SqlDbType.VarChar, 50) { Value = pass.VisitorIdNumber.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@ValidFrom", SqlDbType.DateTime2) { Value = pass.ValidFrom });
        cmd.Parameters.Add(new SqlParameter("@ValidTo", SqlDbType.DateTime2) { Value = pass.ValidTo });
        cmd.Parameters.Add(new SqlParameter("@QrCodeToken", SqlDbType.VarChar, 100) { Value = pass.QrCodeToken });
        cmd.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = pass.Status });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        return pass.Id;
    }

    public async Task RevokePassAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "UPDATE app.VisitorPass SET Status = 'Revoked' WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<Guid> RegisterGateEntryAsync(GateLog entry, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        entry.Id = Guid.NewGuid();
        var sql = @"
            INSERT INTO app.GateLog (Id, TenantId, PropertyId, VisitorPassId, GuardUserId, VisitorName, VehiclePlate, EntryTime, ExitTime)
            VALUES (@Id, @TenantId, @PropertyId, @VisitorPassId, @GuardUserId, @VisitorName, @VehiclePlate, SYSUTCDATETIME(), NULL);";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = entry.Id });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = entry.TenantId });
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = entry.PropertyId });
        cmd.Parameters.Add(new SqlParameter("@VisitorPassId", SqlDbType.UniqueIdentifier) { Value = entry.VisitorPassId.ToDbValue() });
        cmd.Parameters.Add(new SqlParameter("@GuardUserId", SqlDbType.UniqueIdentifier) { Value = entry.GuardUserId });
        cmd.Parameters.Add(new SqlParameter("@VisitorName", SqlDbType.NVarChar, 150) { Value = entry.VisitorName });
        cmd.Parameters.Add(new SqlParameter("@VehiclePlate", SqlDbType.VarChar, 30) { Value = entry.VehiclePlate.ToDbValue() });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
        return entry.Id;
    }

    public async Task RegisterGateExitAsync(Guid gateLogId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = "UPDATE app.GateLog SET ExitTime = SYSUTCDATETIME() WHERE Id = @Id AND TenantId = @TenantId;";
        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = gateLogId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<GateLog>> ListGateLogsByPropertyAsync(Guid propertyId, int maxRecords = 100, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            SELECT TOP (@MaxRecords) Id, TenantId, PropertyId, VisitorPassId, GuardUserId, VisitorName, VehiclePlate, EntryTime, ExitTime
            FROM app.GateLog
            WHERE PropertyId = @PropertyId AND TenantId = @TenantId
            ORDER BY EntryTime DESC;";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = propertyId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });
        cmd.Parameters.Add(new SqlParameter("@MaxRecords", SqlDbType.Int) { Value = maxRecords });

        var list = new List<GateLog>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new GateLog
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                VisitorPassId = reader.GetNullableGuidSafe("VisitorPassId"),
                GuardUserId = reader.GetGuidSafe("GuardUserId"),
                VisitorName = reader.GetStringSafe("VisitorName"),
                VehiclePlate = reader.GetNullableStringSafe("VehiclePlate"),
                EntryTime = reader.GetDateTimeSafe("EntryTime"),
                ExitTime = reader.IsDBNull(reader.GetOrdinal("ExitTime")) ? null : reader.GetDateTimeSafe("ExitTime")
            });
        }
        return list;
    }
}

// ── Bank Reconciliation ─────────────────────────────────────────────
public sealed class BankReconciliationRepository : IBankReconciliationRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public BankReconciliationRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task ImportBankTransactionsAsync(IEnumerable<BankTransaction> transactions, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var sql = @"
                INSERT INTO app.BankTransaction (Id, TenantId, PropertyId, TransactionDate, Description, Amount, ReferenceNumber, IsReconciled, MatchedPaymentId, ImportedAt)
                VALUES (@Id, @TenantId, @PropertyId, @TransactionDate, @Description, @Amount, @ReferenceNumber, @IsReconciled, @MatchedPaymentId, SYSUTCDATETIME());";

            foreach (var t in transactions)
            {
                t.Id = Guid.NewGuid();
                await using var cmd = new SqlCommand(sql, connection, transaction);
                cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = t.Id });
                cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = t.TenantId });
                cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = t.PropertyId });
                cmd.Parameters.Add(new SqlParameter("@TransactionDate", SqlDbType.Date) { Value = t.TransactionDate.ToDateTime(TimeOnly.MinValue) });
                cmd.Parameters.Add(new SqlParameter("@Description", SqlDbType.NVarChar, 250) { Value = t.Description });
                cmd.Parameters.Add(new SqlParameter("@Amount", SqlDbType.Decimal) { Value = t.Amount, Precision = 19, Scale = 4 });
                cmd.Parameters.Add(new SqlParameter("@ReferenceNumber", SqlDbType.NVarChar, 100) { Value = t.ReferenceNumber.ToDbValue() });
                cmd.Parameters.Add(new SqlParameter("@IsReconciled", SqlDbType.Bit) { Value = t.IsReconciled });
                cmd.Parameters.Add(new SqlParameter("@MatchedPaymentId", SqlDbType.UniqueIdentifier) { Value = t.MatchedPaymentId.ToDbValue() });

                await cmd.ExecuteNonQueryAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<IReadOnlyList<BankTransaction>> ListUnreconciledByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            SELECT Id, TenantId, PropertyId, TransactionDate, Description, Amount, ReferenceNumber, IsReconciled, MatchedPaymentId, ImportedAt
            FROM app.BankTransaction
            WHERE PropertyId = @PropertyId AND TenantId = @TenantId AND IsReconciled = 0
            ORDER BY TransactionDate ASC;";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@PropertyId", SqlDbType.UniqueIdentifier) { Value = propertyId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<BankTransaction>();
        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new BankTransaction
            {
                Id = reader.GetGuidSafe("Id"),
                TenantId = reader.GetGuidSafe("TenantId"),
                PropertyId = reader.GetGuidSafe("PropertyId"),
                TransactionDate = reader.GetDateOnlySafe("TransactionDate"),
                Description = reader.GetStringSafe("Description"),
                Amount = reader.GetDecimalSafe("Amount"),
                ReferenceNumber = reader.GetNullableStringSafe("ReferenceNumber"),
                IsReconciled = reader.GetBooleanSafe("IsReconciled"),
                MatchedPaymentId = reader.GetNullableGuidSafe("MatchedPaymentId"),
                ImportedAt = reader.GetDateTimeSafe("ImportedAt")
            });
        }
        return list;
    }

    public async Task MatchTransactionWithPaymentAsync(Guid bankTransactionId, Guid paymentId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        var sql = @"
            UPDATE app.BankTransaction
            SET IsReconciled = 1, MatchedPaymentId = @PaymentId
            WHERE Id = @Id AND TenantId = @TenantId;";

        await using var cmd = new SqlCommand(sql, connection);
        cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = bankTransactionId });
        cmd.Parameters.Add(new SqlParameter("@PaymentId", SqlDbType.UniqueIdentifier) { Value = paymentId });
        cmd.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }
}
