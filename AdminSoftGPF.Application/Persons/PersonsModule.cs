using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Persons;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record PersonDto(Guid Id, Guid TenantId, string FirstName, string LastName, string? Email, string? TaxId);
public sealed record CreatePersonDto(string FirstName, string LastName, string? Email, string? TaxId);
public sealed record UpdatePersonDto(string FirstName, string LastName, string? Email, string? TaxId);

// ── Commands ────────────────────────────────────────────────────────
public sealed record CreatePersonCommand(string FirstName, string LastName, string? Email, string? TaxId) : ICommand<Guid>;

public sealed class CreatePersonCommandHandler : ICommandHandler<CreatePersonCommand, Guid>
{
    private readonly IPersonRepository _personRepository;
    private readonly ITenantContext _tenantContext;

    public CreatePersonCommandHandler(IPersonRepository personRepository, ITenantContext tenantContext)
    {
        _personRepository = personRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreatePersonCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.FirstName) || string.IsNullOrWhiteSpace(command.LastName))
        {
            throw new DomainException("El nombre y apellido son obligatorios.");
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        var person = new Person
        {
            TenantId = tenantId,
            FirstName = command.FirstName.Trim(),
            LastName = command.LastName.Trim(),
            Email = command.Email?.Trim().ToLowerInvariant(),
            TaxId = command.TaxId?.Trim()
        };

        return await _personRepository.CreateAsync(person, cancellationToken);
    }
}

public sealed record UpdatePersonCommand(Guid Id, string FirstName, string LastName, string? Email, string? TaxId) : ICommand;

public sealed class UpdatePersonCommandHandler : ICommandHandler<UpdatePersonCommand>
{
    private readonly IPersonRepository _personRepository;
    private readonly ITenantContext _tenantContext;

    public UpdatePersonCommandHandler(IPersonRepository personRepository, ITenantContext tenantContext)
    {
        _personRepository = personRepository;
        _tenantContext = tenantContext;
    }

    public async Task HandleAsync(UpdatePersonCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var person = await _personRepository.GetByIdAsync(command.Id, cancellationToken);
        if (person == null)
        {
            throw new EntityNotFoundException(nameof(Person), command.Id);
        }

        person.FirstName = command.FirstName.Trim();
        person.LastName = command.LastName.Trim();
        person.Email = command.Email?.Trim().ToLowerInvariant();
        person.TaxId = command.TaxId?.Trim();

        await _personRepository.UpdateAsync(person, cancellationToken);
    }
}

/// <summary>
/// Comando que ejecuta el patrón Soft-Anonymization (Derecho al Olvido / GDPR / Compliance).
/// Preserva el PersonId para mantener intacta la integridad histórica de facturas y pagos.
/// </summary>
public sealed record AnonymizePersonCommand(Guid Id) : ICommand;

public sealed class AnonymizePersonCommandHandler : ICommandHandler<AnonymizePersonCommand>
{
    private readonly IPersonRepository _personRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ITenantContext _tenantContext;

    public AnonymizePersonCommandHandler(
        IPersonRepository personRepository,
        IAuditLogRepository auditLogRepository,
        ITenantContext tenantContext)
    {
        _personRepository = personRepository;
        _auditLogRepository = auditLogRepository;
        _tenantContext = tenantContext;
    }

    public async Task HandleAsync(AnonymizePersonCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var person = await _personRepository.GetByIdAsync(command.Id, cancellationToken);
        if (person == null)
        {
            throw new EntityNotFoundException(nameof(Person), command.Id);
        }

        // Ejecución de la anonimización
        await _personRepository.AnonymizeAsync(command.Id, cancellationToken);

        // Registro de auditoría
        await _auditLogRepository.InsertAsync(new AuditLog
        {
            TenantId = tenantId,
            UserId = _tenantContext.UserId ?? Guid.Empty,
            ImpersonatorId = _tenantContext.ImpersonatorId,
            Action = AuditLog.AuditActions.Anonymize,
            TableName = "app.Person",
            RecordId = command.Id.ToString(),
            OldValues = System.Text.Json.JsonSerializer.Serialize(new { person.FirstName, person.LastName, person.Email }),
            NewValues = System.Text.Json.JsonSerializer.Serialize(new { FirstName = "Usuario", LastName = "Anonimizado", Email = (string?)null })
        }, cancellationToken);
    }
}

// ── Queries ─────────────────────────────────────────────────────────
public sealed record GetPersonByIdQuery(Guid Id) : IQuery<PersonDto>;

public sealed class GetPersonByIdQueryHandler : IQueryHandler<GetPersonByIdQuery, PersonDto>
{
    private readonly IPersonRepository _personRepository;

    public GetPersonByIdQueryHandler(IPersonRepository personRepository)
    {
        _personRepository = personRepository;
    }

    public async Task<PersonDto> HandleAsync(GetPersonByIdQuery query, CancellationToken cancellationToken = default)
    {
        var person = await _personRepository.GetByIdAsync(query.Id, cancellationToken);
        if (person == null)
        {
            throw new EntityNotFoundException(nameof(Person), query.Id);
        }

        return new PersonDto(person.Id, person.TenantId, person.FirstName, person.LastName, person.Email, person.TaxId);
    }
}

public sealed record ListPersonsByTenantQuery() : IQuery<IReadOnlyList<PersonDto>>;

public sealed class ListPersonsByTenantQueryHandler : IQueryHandler<ListPersonsByTenantQuery, IReadOnlyList<PersonDto>>
{
    private readonly IPersonRepository _personRepository;

    public ListPersonsByTenantQueryHandler(IPersonRepository personRepository)
    {
        _personRepository = personRepository;
    }

    public async Task<IReadOnlyList<PersonDto>> HandleAsync(ListPersonsByTenantQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _personRepository.ListByTenantAsync(cancellationToken);
        return list.Select(p => new PersonDto(p.Id, p.TenantId, p.FirstName, p.LastName, p.Email, p.TaxId)).ToList();
    }
}
