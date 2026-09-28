using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para ingresos, registro de pagos y cruzamiento transaccional (Esquemas app.Payment, app.PaymentApplication, app.Receipt).
/// </summary>
public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Payment?> GetByReferenceIdAsync(string referenceId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Payment>> ListByPersonAsync(Guid personId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Ejecuta en una única transacción SQL atómica:
    /// 1. Inserción de Payment
    /// 2. Inserción de PaymentApplications (cruzamiento)
    /// 3. Actualización de BalanceDue y Status de las Invoices afectadas con verificación de RowVersion
    /// 4. Generación de Receipt
    /// </summary>
    Task<Guid> ProcessPaymentTransactionAsync(
        Payment payment,
        IEnumerable<PaymentApplication> applications,
        Receipt receipt,
        CancellationToken cancellationToken = default);
}
