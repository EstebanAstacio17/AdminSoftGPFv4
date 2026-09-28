using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Treasury;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record PaymentDto(
    Guid Id,
    Guid TenantId,
    Guid PersonId,
    decimal TotalAmount,
    string PaymentMethod,
    string ReferenceId,
    string Status
);

public sealed record PaymentApplicationItemDto(Guid InvoiceId, decimal AppliedAmount);

public sealed record ProcessPaymentRequestDto(
    Guid PersonId,
    decimal TotalAmount,
    string PaymentMethod,
    string ReferenceId,
    IReadOnlyList<PaymentApplicationItemDto> Applications,
    string? CustomReceiptNumber = null
);

public sealed record ProcessPaymentResponseDto(
    Guid PaymentId,
    Guid ReceiptId,
    string ReceiptNumber,
    decimal TotalAmount,
    string ReferenceId
);

// ── Commands ────────────────────────────────────────────────────────
public sealed record ProcessPaymentCommand(
    Guid PersonId,
    decimal TotalAmount,
    string PaymentMethod,
    string ReferenceId,
    IReadOnlyList<PaymentApplicationItemDto> Applications,
    string? CustomReceiptNumber
) : ICommand<ProcessPaymentResponseDto>;

public sealed class ProcessPaymentCommandHandler : ICommandHandler<ProcessPaymentCommand, ProcessPaymentResponseDto>
{
    private readonly IPaymentRepository _paymentRepository;
    private readonly IPersonRepository _personRepository;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IOutboxRepository _outboxRepository;
    private readonly ITenantContext _tenantContext;

    public ProcessPaymentCommandHandler(
        IPaymentRepository paymentRepository,
        IPersonRepository personRepository,
        IInvoiceRepository invoiceRepository,
        IOutboxRepository outboxRepository,
        ITenantContext tenantContext)
    {
        _paymentRepository = paymentRepository;
        _personRepository = personRepository;
        _invoiceRepository = invoiceRepository;
        _outboxRepository = outboxRepository;
        _tenantContext = tenantContext;
    }

    public async Task<ProcessPaymentResponseDto> HandleAsync(ProcessPaymentCommand command, CancellationToken cancellationToken = default)
    {
        if (command.TotalAmount <= 0)
        {
            throw new DomainException("El monto total del pago debe ser mayor que cero.");
        }

        if (string.IsNullOrWhiteSpace(command.ReferenceId))
        {
            throw new DomainException("La referencia de pago / clave de idempotencia es obligatoria.");
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        // 1. Verificación de Idempotencia: ¿Ya existe un pago con este ReferenceId?
        var existingPayment = await _paymentRepository.GetByReferenceIdAsync(command.ReferenceId.Trim(), cancellationToken);
        if (existingPayment != null)
        {
            throw new DuplicateEntityException(nameof(Payment), nameof(Payment.ReferenceId), command.ReferenceId);
        }

        // 2. Validación de la Persona
        var person = await _personRepository.GetByIdAsync(command.PersonId, cancellationToken);
        if (person == null)
        {
            throw new EntityNotFoundException(nameof(Person), command.PersonId);
        }

        // 3. Validación de sumatoria de aplicaciones contra total pagado
        decimal totalApplied = command.Applications.Sum(a => a.AppliedAmount);
        if (totalApplied != command.TotalAmount)
        {
            throw new DomainException($"La sumatoria de aplicaciones (RD$ {totalApplied:N2}) no coincide con el total del pago (RD$ {command.TotalAmount:N2}).");
        }

        // 4. Preparación de entidades del ciclo contable
        var payment = new Payment
        {
            TenantId = tenantId,
            PersonId = command.PersonId,
            TotalAmount = command.TotalAmount,
            PaymentMethod = command.PaymentMethod,
            ReferenceId = command.ReferenceId.Trim(),
            Status = Payment.PaymentStatuses.Completed
        };

        var applications = command.Applications.Select(a => new PaymentApplication
        {
            TenantId = tenantId,
            InvoiceId = a.InvoiceId,
            AppliedAmount = a.AppliedAmount
        }).ToList();

        var receiptNumber = command.CustomReceiptNumber ?? $"REC-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        var receipt = new Receipt
        {
            TenantId = tenantId,
            ReceiptNumber = receiptNumber,
            BlobUrl = null
        };

        // 5. Ejecución atómica en Base de Datos (ADO.NET Transaction)
        var paymentId = await _paymentRepository.ProcessPaymentTransactionAsync(payment, applications, receipt, cancellationToken);

        // 6. Registro en Transactional Outbox para notificación desacoplada
        await _outboxRepository.InsertAsync(new OutboxMessage
        {
            TenantId = tenantId,
            EventType = "PaymentProcessedEvent",
            Payload = System.Text.Json.JsonSerializer.Serialize(new
            {
                PaymentId = paymentId,
                ReceiptId = receipt.Id,
                ReceiptNumber = receipt.ReceiptNumber,
                TotalAmount = payment.TotalAmount,
                PersonEmail = person.Email,
                PersonName = $"{person.FirstName} {person.LastName}",
                ReferenceId = payment.ReferenceId
            })
        }, cancellationToken);

        return new ProcessPaymentResponseDto(
            paymentId,
            receipt.Id,
            receipt.ReceiptNumber,
            payment.TotalAmount,
            payment.ReferenceId
        );
    }
}

// ── Queries ─────────────────────────────────────────────────────────
public sealed record GetPaymentByIdQuery(Guid Id) : IQuery<PaymentDto>;

public sealed class GetPaymentByIdQueryHandler : IQueryHandler<GetPaymentByIdQuery, PaymentDto>
{
    private readonly IPaymentRepository _paymentRepository;

    public GetPaymentByIdQueryHandler(IPaymentRepository paymentRepository)
    {
        _paymentRepository = paymentRepository;
    }

    public async Task<PaymentDto> HandleAsync(GetPaymentByIdQuery query, CancellationToken cancellationToken = default)
    {
        var p = await _paymentRepository.GetByIdAsync(query.Id, cancellationToken);
        if (p == null)
        {
            throw new EntityNotFoundException(nameof(Payment), query.Id);
        }

        return new PaymentDto(p.Id, p.TenantId, p.PersonId, p.TotalAmount, p.PaymentMethod, p.ReferenceId, p.Status);
    }
}

public sealed record GetPaymentByReferenceQuery(string ReferenceId) : IQuery<PaymentDto?>;

public sealed class GetPaymentByReferenceQueryHandler : IQueryHandler<GetPaymentByReferenceQuery, PaymentDto?>
{
    private readonly IPaymentRepository _paymentRepository;

    public GetPaymentByReferenceQueryHandler(IPaymentRepository paymentRepository)
    {
        _paymentRepository = paymentRepository;
    }

    public async Task<PaymentDto?> HandleAsync(GetPaymentByReferenceQuery query, CancellationToken cancellationToken = default)
    {
        var p = await _paymentRepository.GetByReferenceIdAsync(query.ReferenceId, cancellationToken);
        if (p == null) return null;

        return new PaymentDto(p.Id, p.TenantId, p.PersonId, p.TotalAmount, p.PaymentMethod, p.ReferenceId, p.Status);
    }
}

public sealed record ListPaymentsByPersonQuery(Guid PersonId) : IQuery<IReadOnlyList<PaymentDto>>;

public sealed class ListPaymentsByPersonQueryHandler : IQueryHandler<ListPaymentsByPersonQuery, IReadOnlyList<PaymentDto>>
{
    private readonly IPaymentRepository _paymentRepository;

    public ListPaymentsByPersonQueryHandler(IPaymentRepository paymentRepository)
    {
        _paymentRepository = paymentRepository;
    }

    public async Task<IReadOnlyList<PaymentDto>> HandleAsync(ListPaymentsByPersonQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _paymentRepository.ListByPersonAsync(query.PersonId, cancellationToken);
        return list.Select(p => new PaymentDto(p.Id, p.TenantId, p.PersonId, p.TotalAmount, p.PaymentMethod, p.ReferenceId, p.Status)).ToList();
    }
}
