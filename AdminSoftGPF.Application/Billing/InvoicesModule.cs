using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Billing;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record InvoiceDto(
    Guid Id,
    Guid TenantId,
    Guid UnitId,
    decimal Amount,
    decimal BalanceDue,
    string Status,
    string? FiscalReceiptType,
    string? FiscalReceiptNumber,
    DateOnly IssueDate,
    DateOnly DueDate,
    byte[]? RowVersion
);

public sealed record CreateInvoiceDto(
    Guid UnitId,
    decimal Amount,
    DateOnly IssueDate,
    DateOnly DueDate,
    string? FiscalReceiptType = null,
    string? FiscalReceiptNumber = null
);

public sealed record BulkInvoiceDto(
    Guid PropertyId,
    decimal Amount,
    DateOnly IssueDate,
    DateOnly DueDate,
    string? FiscalReceiptType = null,
    string? FiscalPrefix = null
);

// ── Commands ────────────────────────────────────────────────────────
public sealed record CreateInvoiceCommand(
    Guid UnitId,
    decimal Amount,
    DateOnly IssueDate,
    DateOnly DueDate,
    string? FiscalReceiptType,
    string? FiscalReceiptNumber
) : ICommand<Guid>;

public sealed class CreateInvoiceCommandHandler : ICommandHandler<CreateInvoiceCommand, Guid>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IUnitRepository _unitRepository;
    private readonly ITenantContext _tenantContext;

    public CreateInvoiceCommandHandler(
        IInvoiceRepository invoiceRepository,
        IUnitRepository unitRepository,
        ITenantContext tenantContext)
    {
        _invoiceRepository = invoiceRepository;
        _unitRepository = unitRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateInvoiceCommand command, CancellationToken cancellationToken = default)
    {
        if (command.Amount <= 0)
        {
            throw new DomainException("El monto de la factura debe ser mayor que cero.");
        }

        var unit = await _unitRepository.GetByIdAsync(command.UnitId, cancellationToken);
        if (unit == null)
        {
            throw new EntityNotFoundException(nameof(Unit), command.UnitId);
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        var invoice = new Invoice
        {
            TenantId = tenantId,
            UnitId = command.UnitId,
            Amount = command.Amount,
            BalanceDue = command.Amount,
            Status = Invoice.InvoiceStatus.Unpaid,
            FiscalReceiptType = command.FiscalReceiptType?.Trim(),
            FiscalReceiptNumber = command.FiscalReceiptNumber?.Trim(),
            IssueDate = command.IssueDate,
            DueDate = command.DueDate
        };

        return await _invoiceRepository.CreateAsync(invoice, cancellationToken);
    }
}

/// <summary>
/// Generación masiva de facturación recurrente para todas las unidades de una propiedad.
/// </summary>
public sealed record GenerateBulkInvoicesCommand(
    Guid PropertyId,
    decimal Amount,
    DateOnly IssueDate,
    DateOnly DueDate,
    string? FiscalReceiptType,
    string? FiscalPrefix
) : ICommand<int>;

public sealed class GenerateBulkInvoicesCommandHandler : ICommandHandler<GenerateBulkInvoicesCommand, int>
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IUnitRepository _unitRepository;
    private readonly ITenantContext _tenantContext;

    public GenerateBulkInvoicesCommandHandler(
        IInvoiceRepository invoiceRepository,
        IUnitRepository unitRepository,
        ITenantContext tenantContext)
    {
        _invoiceRepository = invoiceRepository;
        _unitRepository = unitRepository;
        _tenantContext = tenantContext;
    }

    public async Task<int> HandleAsync(GenerateBulkInvoicesCommand command, CancellationToken cancellationToken = default)
    {
        if (command.Amount <= 0)
        {
            throw new DomainException("El monto base por unidad debe ser mayor que cero.");
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var units = await _unitRepository.ListByPropertyAsync(command.PropertyId, cancellationToken);

        if (units.Count == 0)
        {
            throw new DomainException("No se encontraron unidades activas en la propiedad especificada.");
        }

        var invoices = new List<Invoice>();
        int sequence = 1;

        foreach (var unit in units)
        {
            string? ncf = null;
            if (!string.IsNullOrEmpty(command.FiscalPrefix))
            {
                ncf = $"{command.FiscalPrefix}{sequence:D8}";
                sequence++;
            }

            invoices.Add(new Invoice
            {
                TenantId = tenantId,
                UnitId = unit.Id,
                Amount = command.Amount,
                BalanceDue = command.Amount,
                Status = Invoice.InvoiceStatus.Unpaid,
                FiscalReceiptType = command.FiscalReceiptType,
                FiscalReceiptNumber = ncf,
                IssueDate = command.IssueDate,
                DueDate = command.DueDate
            });
        }

        await _invoiceRepository.CreateBulkAsync(invoices, cancellationToken);
        return invoices.Count;
    }
}

// ── Queries ─────────────────────────────────────────────────────────
public sealed record GetInvoiceByIdQuery(Guid Id) : IQuery<InvoiceDto>;

public sealed class GetInvoiceByIdQueryHandler : IQueryHandler<GetInvoiceByIdQuery, InvoiceDto>
{
    private readonly IInvoiceRepository _invoiceRepository;

    public GetInvoiceByIdQueryHandler(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    public async Task<InvoiceDto> HandleAsync(GetInvoiceByIdQuery query, CancellationToken cancellationToken = default)
    {
        var inv = await _invoiceRepository.GetByIdAsync(query.Id, cancellationToken);
        if (inv == null)
        {
            throw new EntityNotFoundException(nameof(Invoice), query.Id);
        }

        return new InvoiceDto(
            inv.Id,
            inv.TenantId,
            inv.UnitId,
            inv.Amount,
            inv.BalanceDue,
            inv.Status,
            inv.FiscalReceiptType,
            inv.FiscalReceiptNumber,
            inv.IssueDate,
            inv.DueDate,
            inv.RowVersion
        );
    }
}

public sealed record ListInvoicesByUnitQuery(Guid UnitId) : IQuery<IReadOnlyList<InvoiceDto>>;

public sealed class ListInvoicesByUnitQueryHandler : IQueryHandler<ListInvoicesByUnitQuery, IReadOnlyList<InvoiceDto>>
{
    private readonly IInvoiceRepository _invoiceRepository;

    public ListInvoicesByUnitQueryHandler(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    public async Task<IReadOnlyList<InvoiceDto>> HandleAsync(ListInvoicesByUnitQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _invoiceRepository.ListByUnitAsync(query.UnitId, cancellationToken);
        return list.Select(inv => new InvoiceDto(
            inv.Id,
            inv.TenantId,
            inv.UnitId,
            inv.Amount,
            inv.BalanceDue,
            inv.Status,
            inv.FiscalReceiptType,
            inv.FiscalReceiptNumber,
            inv.IssueDate,
            inv.DueDate,
            inv.RowVersion
        )).ToList();
    }
}

public sealed record ListUnpaidInvoicesQuery() : IQuery<IReadOnlyList<InvoiceDto>>;

public sealed class ListUnpaidInvoicesQueryHandler : IQueryHandler<ListUnpaidInvoicesQuery, IReadOnlyList<InvoiceDto>>
{
    private readonly IInvoiceRepository _invoiceRepository;

    public ListUnpaidInvoicesQueryHandler(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }

    public async Task<IReadOnlyList<InvoiceDto>> HandleAsync(ListUnpaidInvoicesQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _invoiceRepository.ListUnpaidByTenantAsync(cancellationToken);
        return list.Select(inv => new InvoiceDto(
            inv.Id,
            inv.TenantId,
            inv.UnitId,
            inv.Amount,
            inv.BalanceDue,
            inv.Status,
            inv.FiscalReceiptType,
            inv.FiscalReceiptNumber,
            inv.IssueDate,
            inv.DueDate,
            inv.RowVersion
        )).ToList();
    }
}
