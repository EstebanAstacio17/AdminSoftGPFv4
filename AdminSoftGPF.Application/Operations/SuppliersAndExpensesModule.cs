using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Operations;

// ── Suppliers DTOs & Commands ───────────────────────────────────────
public sealed record SupplierDto(Guid Id, Guid TenantId, string Name, string? TaxId, string? Email, string? Phone, string? Address, bool IsActive);
public sealed record CreateSupplierDto(string Name, string? TaxId, string? Email, string? Phone, string? Address);

public sealed record CreateSupplierCommand(string Name, string? TaxId, string? Email, string? Phone, string? Address) : ICommand<Guid>;

public sealed class CreateSupplierCommandHandler : ICommandHandler<CreateSupplierCommand, Guid>
{
    private readonly ISupplierRepository _supplierRepository;
    private readonly ITenantContext _tenantContext;

    public CreateSupplierCommandHandler(ISupplierRepository supplierRepository, ITenantContext tenantContext)
    {
        _supplierRepository = supplierRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateSupplierCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Name)) throw new DomainException("El nombre del proveedor es obligatorio.");
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        return await _supplierRepository.CreateAsync(new Supplier
        {
            TenantId = tenantId,
            Name = command.Name.Trim(),
            TaxId = command.TaxId?.Trim(),
            Email = command.Email?.Trim().ToLowerInvariant(),
            Phone = command.Phone?.Trim(),
            Address = command.Address?.Trim(),
            IsActive = true
        }, cancellationToken);
    }
}

public sealed record ListSuppliersQuery() : IQuery<IReadOnlyList<SupplierDto>>;

public sealed class ListSuppliersQueryHandler : IQueryHandler<ListSuppliersQuery, IReadOnlyList<SupplierDto>>
{
    private readonly ISupplierRepository _supplierRepository;

    public ListSuppliersQueryHandler(ISupplierRepository supplierRepository)
    {
        _supplierRepository = supplierRepository;
    }

    public async Task<IReadOnlyList<SupplierDto>> HandleAsync(ListSuppliersQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _supplierRepository.ListByTenantAsync(cancellationToken);
        return list.Select(s => new SupplierDto(s.Id, s.TenantId, s.Name, s.TaxId, s.Email, s.Phone, s.Address, s.IsActive)).ToList();
    }
}

// ── Expenses DTOs & Commands ────────────────────────────────────────
public sealed record ExpenseDto(Guid Id, Guid TenantId, Guid PropertyId, Guid? SupplierId, string Concept, decimal Amount, DateOnly ExpenseDate, string? FiscalReceiptNumber, string Status);
public sealed record CreateExpenseDto(Guid PropertyId, Guid? SupplierId, string Concept, decimal Amount, DateOnly ExpenseDate, string? FiscalReceiptNumber);

public sealed record CreateExpenseCommand(Guid PropertyId, Guid? SupplierId, string Concept, decimal Amount, DateOnly ExpenseDate, string? FiscalReceiptNumber) : ICommand<Guid>;

public sealed class CreateExpenseCommandHandler : ICommandHandler<CreateExpenseCommand, Guid>
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly ITenantContext _tenantContext;

    public CreateExpenseCommandHandler(IExpenseRepository expenseRepository, ITenantContext tenantContext)
    {
        _expenseRepository = expenseRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateExpenseCommand command, CancellationToken cancellationToken = default)
    {
        if (command.Amount <= 0) throw new DomainException("El monto del gasto debe ser mayor que cero.");
        if (string.IsNullOrWhiteSpace(command.Concept)) throw new DomainException("El concepto del gasto es obligatorio.");
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        return await _expenseRepository.CreateAsync(new Expense
        {
            TenantId = tenantId,
            PropertyId = command.PropertyId,
            SupplierId = command.SupplierId,
            Concept = command.Concept.Trim(),
            Amount = command.Amount,
            ExpenseDate = command.ExpenseDate,
            FiscalReceiptNumber = command.FiscalReceiptNumber?.Trim(),
            Status = Expense.ExpenseStatus.Paid
        }, cancellationToken);
    }
}

public sealed record ListExpensesByPropertyQuery(Guid PropertyId) : IQuery<IReadOnlyList<ExpenseDto>>;

public sealed class ListExpensesByPropertyQueryHandler : IQueryHandler<ListExpensesByPropertyQuery, IReadOnlyList<ExpenseDto>>
{
    private readonly IExpenseRepository _expenseRepository;

    public ListExpensesByPropertyQueryHandler(IExpenseRepository expenseRepository)
    {
        _expenseRepository = expenseRepository;
    }

    public async Task<IReadOnlyList<ExpenseDto>> HandleAsync(ListExpensesByPropertyQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _expenseRepository.ListByPropertyAsync(query.PropertyId, cancellationToken);
        return list.Select(e => new ExpenseDto(e.Id, e.TenantId, e.PropertyId, e.SupplierId, e.Concept, e.Amount, e.ExpenseDate, e.FiscalReceiptNumber, e.Status)).ToList();
    }
}
