using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Operations;

// ── Bank Reconciliation DTOs & Handlers ─────────────────────────────
public sealed record BankTransactionDto(Guid Id, Guid TenantId, Guid PropertyId, DateOnly TransactionDate, string Description, decimal Amount, string? ReferenceNumber, bool IsReconciled, Guid? MatchedPaymentId, DateTime ImportedAt);

public sealed record ImportBankLineDto(DateOnly TransactionDate, string Description, decimal Amount, string? ReferenceNumber);
public sealed record ImportStatementDto(Guid PropertyId, IReadOnlyList<ImportBankLineDto> Transactions);

public sealed record MatchBankTransactionDto(Guid BankTransactionId, Guid PaymentId);

public sealed record ImportBankStatementCommand(Guid PropertyId, IReadOnlyList<ImportBankLineDto> Lines) : ICommand<int>;

public sealed class ImportBankStatementCommandHandler : ICommandHandler<ImportBankStatementCommand, int>
{
    private readonly IBankReconciliationRepository _bankRepository;
    private readonly ITenantContext _tenantContext;

    public ImportBankStatementCommandHandler(IBankReconciliationRepository bankRepository, ITenantContext tenantContext)
    {
        _bankRepository = bankRepository;
        _tenantContext = tenantContext;
    }

    public async Task<int> HandleAsync(ImportBankStatementCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var txList = command.Lines.Select(line => new BankTransaction
        {
            TenantId = tenantId,
            PropertyId = command.PropertyId,
            TransactionDate = line.TransactionDate,
            Description = line.Description.Trim(),
            Amount = line.Amount,
            ReferenceNumber = line.ReferenceNumber?.Trim(),
            IsReconciled = false
        }).ToList();

        await _bankRepository.ImportBankTransactionsAsync(txList, cancellationToken);
        return txList.Count;
    }
}

public sealed record MatchBankTransactionCommand(Guid BankTransactionId, Guid PaymentId) : ICommand;

public sealed class MatchBankTransactionCommandHandler : ICommandHandler<MatchBankTransactionCommand>
{
    private readonly IBankReconciliationRepository _bankRepository;

    public MatchBankTransactionCommandHandler(IBankReconciliationRepository bankRepository)
    {
        _bankRepository = bankRepository;
    }

    public async Task HandleAsync(MatchBankTransactionCommand command, CancellationToken cancellationToken = default)
    {
        await _bankRepository.MatchTransactionWithPaymentAsync(command.BankTransactionId, command.PaymentId, cancellationToken);
    }
}

public sealed record ListUnreconciledTransactionsQuery(Guid PropertyId) : IQuery<IReadOnlyList<BankTransactionDto>>;

public sealed class ListUnreconciledTransactionsQueryHandler : IQueryHandler<ListUnreconciledTransactionsQuery, IReadOnlyList<BankTransactionDto>>
{
    private readonly IBankReconciliationRepository _bankRepository;

    public ListUnreconciledTransactionsQueryHandler(IBankReconciliationRepository bankRepository)
    {
        _bankRepository = bankRepository;
    }

    public async Task<IReadOnlyList<BankTransactionDto>> HandleAsync(ListUnreconciledTransactionsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _bankRepository.ListUnreconciledByPropertyAsync(query.PropertyId, cancellationToken);
        return list.Select(t => new BankTransactionDto(t.Id, t.TenantId, t.PropertyId, t.TransactionDate, t.Description, t.Amount, t.ReferenceNumber, t.IsReconciled, t.MatchedPaymentId, t.ImportedAt)).ToList();
    }
}
