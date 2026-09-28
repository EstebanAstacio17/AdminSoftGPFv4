using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

/// <summary>
/// Puerto de salida para facturas y cuentas por cobrar (Esquema app.Invoice).
/// </summary>
public interface IInvoiceRepository
{
    Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListByUnitAsync(Guid unitId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Invoice>> ListUnpaidByTenantAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Invoice invoice, CancellationToken cancellationToken = default);
    Task CreateBulkAsync(IEnumerable<Invoice> invoices, CancellationToken cancellationToken = default);
    Task UpdateBalanceAndStatusAsync(Guid id, decimal newBalanceDue, string newStatus, byte[] rowVersion, CancellationToken cancellationToken = default);
}
