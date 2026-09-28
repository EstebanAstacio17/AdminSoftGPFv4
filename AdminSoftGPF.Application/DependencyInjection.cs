using AdminSoftGPF.Application.Billing;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Operations;
using AdminSoftGPF.Application.Persons;
using AdminSoftGPF.Application.Properties;
using AdminSoftGPF.Application.Tenants;
using AdminSoftGPF.Application.Treasury;
using AdminSoftGPF.Application.UnitResidents;
using AdminSoftGPF.Application.Units;
using AdminSoftGPF.Application.Users;
using Microsoft.Extensions.DependencyInjection;

namespace AdminSoftGPF.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // 1. Despachador CQRS Ligero
        services.AddScoped<IAppDispatcher, AppDispatcher>();

        // 2. Handlers de Tenants
        services.AddScoped<ICommandHandler<CreateTenantCommand, Guid>, CreateTenantCommandHandler>();
        services.AddScoped<ICommandHandler<UpdateTenantStatusCommand>, UpdateTenantStatusCommandHandler>();
        services.AddScoped<IQueryHandler<GetTenantByIdQuery, TenantDto>, GetTenantByIdQueryHandler>();
        services.AddScoped<IQueryHandler<ListTenantsQuery, IReadOnlyList<TenantDto>>, ListTenantsQueryHandler>();

        // 3. Handlers de Users
        services.AddScoped<ICommandHandler<CreateUserCommand, Guid>, CreateUserCommandHandler>();
        services.AddScoped<ICommandHandler<SetUserActiveStatusCommand>, SetUserActiveStatusCommandHandler>();
        services.AddScoped<IQueryHandler<GetUserByIdQuery, UserDto>, GetUserByIdQueryHandler>();
        services.AddScoped<IQueryHandler<ListUsersByTenantQuery, IReadOnlyList<UserDto>>, ListUsersByTenantQueryHandler>();

        // 4. Handlers de Properties y Blocks
        services.AddScoped<ICommandHandler<CreatePropertyCommand, Guid>, CreatePropertyCommandHandler>();
        services.AddScoped<ICommandHandler<UpdatePropertyCommand>, UpdatePropertyCommandHandler>();
        services.AddScoped<IQueryHandler<GetPropertyByIdQuery, PropertyDto>, GetPropertyByIdQueryHandler>();
        services.AddScoped<IQueryHandler<ListPropertiesQuery, IReadOnlyList<PropertyDto>>, ListPropertiesQueryHandler>();
        services.AddScoped<ICommandHandler<CreateBlockCommand, Guid>, CreateBlockCommandHandler>();
        services.AddScoped<IQueryHandler<ListBlocksByPropertyQuery, IReadOnlyList<BlockDto>>, ListBlocksByPropertyQueryHandler>();

        // 5. Handlers de Units
        services.AddScoped<ICommandHandler<CreateUnitCommand, Guid>, CreateUnitCommandHandler>();
        services.AddScoped<ICommandHandler<UpdateUnitCommand>, UpdateUnitCommandHandler>();
        services.AddScoped<IQueryHandler<GetUnitByIdQuery, UnitDto>, GetUnitByIdQueryHandler>();
        services.AddScoped<IQueryHandler<ListUnitsByBlockQuery, IReadOnlyList<UnitDto>>, ListUnitsByBlockQueryHandler>();
        services.AddScoped<IQueryHandler<ListUnitsByPropertyQuery, IReadOnlyList<UnitDto>>, ListUnitsByPropertyQueryHandler>();

        // 6. Handlers de Persons
        services.AddScoped<ICommandHandler<CreatePersonCommand, Guid>, CreatePersonCommandHandler>();
        services.AddScoped<ICommandHandler<UpdatePersonCommand>, UpdatePersonCommandHandler>();
        services.AddScoped<ICommandHandler<AnonymizePersonCommand>, AnonymizePersonCommandHandler>();
        services.AddScoped<IQueryHandler<GetPersonByIdQuery, PersonDto>, GetPersonByIdQueryHandler>();
        services.AddScoped<IQueryHandler<ListPersonsByTenantQuery, IReadOnlyList<PersonDto>>, ListPersonsByTenantQueryHandler>();

        // 7. Handlers de UnitResidents
        services.AddScoped<ICommandHandler<AssignUnitResidentCommand, Guid>, AssignUnitResidentCommandHandler>();
        services.AddScoped<ICommandHandler<DeactivateUnitResidentCommand>, DeactivateUnitResidentCommandHandler>();
        services.AddScoped<IQueryHandler<ListResidentsByUnitQuery, IReadOnlyList<UnitResidentDto>>, ListResidentsByUnitQueryHandler>();
        services.AddScoped<IQueryHandler<ListUnitsByResidentQuery, IReadOnlyList<UnitResidentDto>>, ListUnitsByResidentQueryHandler>();

        // 8. Handlers Financieros: Facturación (Billing)
        services.AddScoped<ICommandHandler<CreateInvoiceCommand, Guid>, CreateInvoiceCommandHandler>();
        services.AddScoped<ICommandHandler<GenerateBulkInvoicesCommand, int>, GenerateBulkInvoicesCommandHandler>();
        services.AddScoped<IQueryHandler<GetInvoiceByIdQuery, InvoiceDto>, GetInvoiceByIdQueryHandler>();
        services.AddScoped<IQueryHandler<ListInvoicesByUnitQuery, IReadOnlyList<InvoiceDto>>, ListInvoicesByUnitQueryHandler>();
        services.AddScoped<IQueryHandler<ListUnpaidInvoicesQuery, IReadOnlyList<InvoiceDto>>, ListUnpaidInvoicesQueryHandler>();

        // 9. Handlers Financieros: Pagos y Tesorería (Treasury)
        services.AddScoped<ICommandHandler<ProcessPaymentCommand, ProcessPaymentResponseDto>, ProcessPaymentCommandHandler>();
        services.AddScoped<IQueryHandler<GetPaymentByIdQuery, PaymentDto>, GetPaymentByIdQueryHandler>();
        services.AddScoped<IQueryHandler<GetPaymentByReferenceQuery, PaymentDto?>, GetPaymentByReferenceQueryHandler>();
        services.AddScoped<IQueryHandler<ListPaymentsByPersonQuery, IReadOnlyList<PaymentDto>>, ListPaymentsByPersonQueryHandler>();

        // 10. Handlers Fase 7: Proveedores y Egresos
        services.AddScoped<ICommandHandler<CreateSupplierCommand, Guid>, CreateSupplierCommandHandler>();
        services.AddScoped<IQueryHandler<ListSuppliersQuery, IReadOnlyList<SupplierDto>>, ListSuppliersQueryHandler>();
        services.AddScoped<ICommandHandler<CreateExpenseCommand, Guid>, CreateExpenseCommandHandler>();
        services.AddScoped<IQueryHandler<ListExpensesByPropertyQuery, IReadOnlyList<ExpenseDto>>, ListExpensesByPropertyQueryHandler>();

        // 11. Handlers Fase 7: Helpdesk y Mantenimiento
        services.AddScoped<ICommandHandler<CreateTicketCommand, Guid>, CreateTicketCommandHandler>();
        services.AddScoped<ICommandHandler<UpdateTicketStatusCommand>, UpdateTicketStatusCommandHandler>();
        services.AddScoped<IQueryHandler<ListTicketsByPropertyQuery, IReadOnlyList<MaintenanceTicketDto>>, ListTicketsByPropertyQueryHandler>();

        // 12. Handlers Fase 7: Amenidades y Reservas
        services.AddScoped<ICommandHandler<CreateAmenityCommand, Guid>, CreateAmenityCommandHandler>();
        services.AddScoped<IQueryHandler<ListAmenitiesByPropertyQuery, IReadOnlyList<AmenityDto>>, ListAmenitiesByPropertyQueryHandler>();
        services.AddScoped<ICommandHandler<CreateBookingCommand, Guid>, CreateBookingCommandHandler>();
        services.AddScoped<IQueryHandler<ListBookingsByAmenityQuery, IReadOnlyList<AmenityBookingDto>>, ListBookingsByAmenityQueryHandler>();

        // 13. Handlers Fase 7: Seguridad y Garita
        services.AddScoped<ICommandHandler<CreateVisitorPassCommand, VisitorPassDto>, CreateVisitorPassCommandHandler>();
        services.AddScoped<ICommandHandler<RegisterGateEntryCommand, Guid>, RegisterGateEntryCommandHandler>();
        services.AddScoped<IQueryHandler<ListGateLogsByPropertyQuery, IReadOnlyList<GateLogDto>>, ListGateLogsByPropertyQueryHandler>();

        // 14. Handlers Fase 7: Conciliación Bancaria
        services.AddScoped<ICommandHandler<ImportBankStatementCommand, int>, ImportBankStatementCommandHandler>();
        services.AddScoped<ICommandHandler<MatchBankTransactionCommand>, MatchBankTransactionCommandHandler>();
        services.AddScoped<IQueryHandler<ListUnreconciledTransactionsQuery, IReadOnlyList<BankTransactionDto>>, ListUnreconciledTransactionsQueryHandler>();

        return services;
    }
}
