using System.Data;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data.Repositories;

public sealed class PaymentRepository : IPaymentRepository
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ITenantContext _tenantContext;

    public PaymentRepository(IDbConnectionFactory connectionFactory, ITenantContext tenantContext)
    {
        _connectionFactory = connectionFactory;
        _tenantContext = tenantContext;
    }

    public async Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Payment_GetById", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = id });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapPayment(reader);
        }

        return null;
    }

    public async Task<Payment?> GetByReferenceIdAsync(string referenceId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Payment_GetByReferenceId", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@ReferenceId", SqlDbType.NVarChar, 100) { Value = referenceId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return MapPayment(reader);
        }

        return null;
    }

    public async Task<IReadOnlyList<Payment>> ListByPersonAsync(Guid personId, CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var command = new SqlCommand("app.usp_Payment_ListByPerson", connection)
        {
            CommandType = CommandType.StoredProcedure
        };

        command.Parameters.Add(new SqlParameter("@PersonId", SqlDbType.UniqueIdentifier) { Value = personId });
        command.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = _tenantContext.TenantId ?? Guid.Empty });

        var list = new List<Payment>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(MapPayment(reader));
        }

        return list;
    }

    /// <summary>
    /// Procesa de forma atómica: Inserción de Payment, Inserción de PaymentApplications,
    /// Actualización de saldos de Invoices, y Creación de Receipt.
    /// </summary>
    public async Task<Guid> ProcessPaymentTransactionAsync(
        Payment payment,
        IEnumerable<PaymentApplication> applications,
        Receipt receipt,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            // 1. Insertar Payment
            payment.Id = Guid.NewGuid();
            var insertPaymentSql = @"
                INSERT INTO app.Payment (Id, TenantId, PersonId, TotalAmount, PaymentMethod, ReferenceId, Status, CreatedAt)
                VALUES (@Id, @TenantId, @PersonId, @TotalAmount, @PaymentMethod, @ReferenceId, @Status, SYSUTCDATETIME());";

            await using (var cmdPayment = new SqlCommand(insertPaymentSql, connection, transaction))
            {
                cmdPayment.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = payment.Id });
                cmdPayment.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = payment.TenantId });
                cmdPayment.Parameters.Add(new SqlParameter("@PersonId", SqlDbType.UniqueIdentifier) { Value = payment.PersonId });
                cmdPayment.Parameters.Add(new SqlParameter("@TotalAmount", SqlDbType.Decimal) { Value = payment.TotalAmount, Precision = 19, Scale = 4 });
                cmdPayment.Parameters.Add(new SqlParameter("@PaymentMethod", SqlDbType.VarChar, 30) { Value = payment.PaymentMethod });
                cmdPayment.Parameters.Add(new SqlParameter("@ReferenceId", SqlDbType.NVarChar, 100) { Value = payment.ReferenceId });
                cmdPayment.Parameters.Add(new SqlParameter("@Status", SqlDbType.VarChar, 30) { Value = payment.Status });

                await cmdPayment.ExecuteNonQueryAsync(cancellationToken);
            }

            // 2. Insertar PaymentApplications y actualizar facturas
            var insertAppSql = @"
                INSERT INTO app.PaymentApplication (Id, TenantId, PaymentId, InvoiceId, AppliedAmount)
                VALUES (@Id, @TenantId, @PaymentId, @InvoiceId, @AppliedAmount);";

            var updateInvoiceSql = @"
                UPDATE app.Invoice
                SET BalanceDue = BalanceDue - @AppliedAmount,
                    Status = CASE 
                        WHEN (BalanceDue - @AppliedAmount) <= 0 THEN 'Paid'
                        ELSE 'Partial'
                    END
                WHERE Id = @InvoiceId AND TenantId = @TenantId;";

            foreach (var app in applications)
            {
                app.Id = Guid.NewGuid();
                app.PaymentId = payment.Id;

                await using (var cmdApp = new SqlCommand(insertAppSql, connection, transaction))
                {
                    cmdApp.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = app.Id });
                    cmdApp.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = payment.TenantId });
                    cmdApp.Parameters.Add(new SqlParameter("@PaymentId", SqlDbType.UniqueIdentifier) { Value = payment.Id });
                    cmdApp.Parameters.Add(new SqlParameter("@InvoiceId", SqlDbType.UniqueIdentifier) { Value = app.InvoiceId });
                    cmdApp.Parameters.Add(new SqlParameter("@AppliedAmount", SqlDbType.Decimal) { Value = app.AppliedAmount, Precision = 19, Scale = 4 });

                    await cmdApp.ExecuteNonQueryAsync(cancellationToken);
                }

                await using (var cmdUpdInv = new SqlCommand(updateInvoiceSql, connection, transaction))
                {
                    cmdUpdInv.Parameters.Add(new SqlParameter("@InvoiceId", SqlDbType.UniqueIdentifier) { Value = app.InvoiceId });
                    cmdUpdInv.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = payment.TenantId });
                    cmdUpdInv.Parameters.Add(new SqlParameter("@AppliedAmount", SqlDbType.Decimal) { Value = app.AppliedAmount, Precision = 19, Scale = 4 });

                    await cmdUpdInv.ExecuteNonQueryAsync(cancellationToken);
                }
            }

            // 3. Insertar Receipt
            receipt.Id = Guid.NewGuid();
            receipt.PaymentId = payment.Id;
            receipt.TenantId = payment.TenantId;

            var insertReceiptSql = @"
                INSERT INTO app.Receipt (Id, TenantId, PaymentId, ReceiptNumber, BlobUrl, CreatedAt)
                VALUES (@Id, @TenantId, @PaymentId, @ReceiptNumber, @BlobUrl, SYSUTCDATETIME());";

            await using (var cmdReceipt = new SqlCommand(insertReceiptSql, connection, transaction))
            {
                cmdReceipt.Parameters.Add(new SqlParameter("@Id", SqlDbType.UniqueIdentifier) { Value = receipt.Id });
                cmdReceipt.Parameters.Add(new SqlParameter("@TenantId", SqlDbType.UniqueIdentifier) { Value = receipt.TenantId });
                cmdReceipt.Parameters.Add(new SqlParameter("@PaymentId", SqlDbType.UniqueIdentifier) { Value = receipt.PaymentId });
                cmdReceipt.Parameters.Add(new SqlParameter("@ReceiptNumber", SqlDbType.NVarChar, 50) { Value = receipt.ReceiptNumber });
                cmdReceipt.Parameters.Add(new SqlParameter("@BlobUrl", SqlDbType.NVarChar, 1000) { Value = receipt.BlobUrl.ToDbValue() });

                await cmdReceipt.ExecuteNonQueryAsync(cancellationToken);
            }

            await transaction.CommitAsync(cancellationToken);
            return payment.Id;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static Payment MapPayment(SqlDataReader reader)
    {
        return new Payment
        {
            Id = reader.GetGuidSafe("Id"),
            TenantId = reader.GetGuidSafe("TenantId"),
            PersonId = reader.GetGuidSafe("PersonId"),
            TotalAmount = reader.GetDecimalSafe("TotalAmount"),
            PaymentMethod = reader.GetStringSafe("PaymentMethod"),
            ReferenceId = reader.GetStringSafe("ReferenceId"),
            Status = reader.GetStringSafe("Status")
        };
    }
}
