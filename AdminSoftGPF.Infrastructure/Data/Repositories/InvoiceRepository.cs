using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class InvoiceRepository : IInvoiceRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public InvoiceRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Invoice_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapInvoice(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<Invoice>> ListByUnitAsync(Guid unitId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Invoice_ListByUnit", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = unitId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Invoice>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapInvoice(reader));
        }

        return list;
    }

    public async Task<IReadOnlyList<Invoice>> ListUnpaidByTenantAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Invoice_ListUnpaidByTenant", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Invoice>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapInvoice(reader));
        }

        return list;
    }

    public async Task<Guid> CreateAsync(Invoice invoice, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Invoice_Create", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
        {
            Direction = ParameterDirection.Output
        };
        command.Parameters.Add(outputParam);
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = invoice.TenantId });
        command.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = invoice.UnitId });
        command.Parameters.Add(new SqlParameter("@Amount", SqlDbType.Decimal) { Value = invoice.Amount, Precision = 19, Scale = 4 });
        command.Parameters.Add(new SqlParameter("@BalanceDue", SqlDbType.Decimal) { Value = invoice.BalanceDue, Precision = 19, Scale = 4 });
        command.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = invoice.Status });
        command.Parameters.Add(new SqlParameter("@FiscalReceiptType", SqlDbType.VarChar, 10) { Value = invoice.FiscalReceiptType.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@FiscalReceiptNumber", SqlDbType.VarChar, 50) { Value = invoice.FiscalReceiptNumber.ToDbValue() });
        command.Parameters.Add(new SqlParameter("@IssueDate", SqlDbType.Date) { Value = invoice.IssueDate.ToDateTime(TimeOnly.MinValue) });
        command.Parameters.Add(new SqlParameter("@DueDate", SqlDbType.Date) { Value = invoice.DueDate.ToDateTime(TimeOnly.MinValue) });

        await command.ExecuteNonQueryAsync(cancellationToken);
        invoice.Id = (Guid)outputParam.Value;
        return invoice.Id;
    }

    public async Task CreateBulkAsync(IEnumerable<Invoice> invoices, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            foreach (var invoice in invoices)
            {
                await using var command = new SqlCommand("app.usp_Invoice_Create", connection, transaction)
                {
                    CommandType = CommandType.StoredProcedure
                };

                var outputParam = new SqlParameter("@Id", SqlDbType.UniqueIdentifier)
                {
                    Direction = ParameterDirection.Output
                };
                command.Parameters.Add(outputParam);
                command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = invoice.TenantId });
                command.Parameters.Add(new SqlParameter("@UnitId", SqlDbType.UniqueIdentifier) { Value = invoice.UnitId });
                command.Parameters.Add(new SqlParameter("@Amount", SqlDbType.Decimal) { Value = invoice.Amount, Precision = 19, Scale = 4 });
                command.Parameters.Add(new SqlParameter("@BalanceDue", SqlDbType.Decimal) { Value = invoice.BalanceDue, Precision = 19, Scale = 4 });
                command.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = invoice.Status });
                command.Parameters.Add(new SqlParameter("@FiscalReceiptType", SqlDbType.VarChar, 10) { Value = invoice.FiscalReceiptType.ToDbValue() });
                command.Parameters.Add(new SqlParameter("@FiscalReceiptNumber", SqlDbType.VarChar, 50) { Value = invoice.FiscalReceiptNumber.ToDbValue() });
                command.Parameters.Add(new SqlParameter("@IssueDate", SqlDbType.Date) { Value = invoice.IssueDate.ToDateTime(TimeOnly.MinValue) });
                command.Parameters.Add(new SqlParameter("@DueDate", SqlDbType.Date) { Value = invoice.DueDate.ToDateTime(TimeOnly.MinValue) });

                await command.ExecuteNonQueryAsync(cancellationToken);
                invoice.Id = (Guid)outputParam.Value;
            }

            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task UpdateBalanceAndStatusAsync(Guid id, decimal newBalanceDue, string newStatus, byte[] rowVersion, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Invoice_UpdateBalanceAndStatus", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });
        command.Parameters.Add(new SqlParameter("@BalanceDue", SqlDbType.Decimal) { Value = newBalanceDue, Precision = 19, Scale = 4 });
        command.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = newStatus });
        command.Parameters.Add(new SqlParameter("@RowVersion", SqlDbType.Timestamp) { Value = rowVersion });

        try
        {
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        catch (SqlException ex) when (ex.Number == 51000)
        {
            throw new ConcurrencyConflictException(nameof(Invoice), id);
        }
    }

    private static Invoice MapInvoice(SqlDataReader reader)
    {
        return new Invoice
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            UnitId = reader.GetGuidSafe("UnitId"),
            Amount = reader.GetDecimalSafe("Amount"),
            BalanceDue = reader.GetDecimalSafe("BalanceDue"),
            Status = reader.GetStringSafe("Status"),
            FiscalReceiptType = reader.GetNullableStringSafe("FiscalReceiptType"),
            FiscalReceiptNumber = reader.GetNullableStringSafe("FiscalReceiptNumber"),
            IssueDate = reader.GetDateOnlySafe("IssueDate"),
            DueDate = reader.GetDateOnlySafe("DueDate"),
            RowVersion = reader.GetBytesSafe("RowVersion")
        };
    }
}
