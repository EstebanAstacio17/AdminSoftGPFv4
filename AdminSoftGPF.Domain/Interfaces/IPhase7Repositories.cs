using AdminSoftGPF.Domain.Entities;

namespace AdminSoftGPF.Domain.Interfaces;

public interface ISupplierRepository
{
    Task<Supplier?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Supplier>> ListByTenantAsync(CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Supplier supplier, CancellationToken cancellationToken = default);
    Task UpdateAsync(Supplier supplier, CancellationToken cancellationToken = default);
}

public interface IExpenseRepository
{
    Task<Expense?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Expense>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(Expense expense, CancellationToken cancellationToken = default);
}

public interface IMaintenanceTicketRepository
{
    Task<MaintenanceTicket?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceTicket>> ListByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MaintenanceTicket>> ListByUnitAsync(Guid unitId, CancellationToken cancellationToken = default);
    Task<Guid> CreateAsync(MaintenanceTicket ticket, CancellationToken cancellationToken = default);
    Task UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default);
}

public interface IFacilitiesRepository
{
    Task<Amenity?> GetAmenityByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Amenity>> ListAmenitiesByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default);
    Task<Guid> CreateAmenityAsync(Amenity amenity, CancellationToken cancellationToken = default);

    Task<AmenityBooking?> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AmenityBooking>> ListBookingsByAmenityAsync(Guid amenityId, DateOnly date, CancellationToken cancellationToken = default);
    Task<Guid> CreateBookingAsync(AmenityBooking booking, CancellationToken cancellationToken = default);
    Task CancelBookingAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface ISecurityAccessRepository
{
    Task<VisitorPass?> GetPassByQrTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VisitorPass>> ListActivePassesByUnitAsync(Guid unitId, CancellationToken cancellationToken = default);
    Task<Guid> CreateVisitorPassAsync(VisitorPass pass, CancellationToken cancellationToken = default);
    Task RevokePassAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Guid> RegisterGateEntryAsync(GateLog entry, CancellationToken cancellationToken = default);
    Task RegisterGateExitAsync(Guid gateLogId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GateLog>> ListGateLogsByPropertyAsync(Guid propertyId, int maxRecords = 100, CancellationToken cancellationToken = default);
}

public interface IBankReconciliationRepository
{
    Task ImportBankTransactionsAsync(IEnumerable<BankTransaction> transactions, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<BankTransaction>> ListUnreconciledByPropertyAsync(Guid propertyId, CancellationToken cancellationToken = default);
    Task MatchTransactionWithPaymentAsync(Guid bankTransactionId, Guid paymentId, CancellationToken cancellationToken = default);
}
