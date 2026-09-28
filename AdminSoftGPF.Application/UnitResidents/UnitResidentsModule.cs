using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.UnitResidents;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record UnitResidentDto(Guid Id, Guid TenantId, Guid UnitId, Guid PersonId, string RelationshipType, bool IsActive);
public sealed record AssignResidentDto(Guid UnitId, Guid PersonId, string RelationshipType);

// ── Commands ────────────────────────────────────────────────────────
public sealed record AssignUnitResidentCommand(Guid UnitId, Guid PersonId, string RelationshipType) : ICommand<Guid>;

public sealed class AssignUnitResidentCommandHandler : ICommandHandler<AssignUnitResidentCommand, Guid>
{
    private readonly IUnitResidentRepository _unitResidentRepository;
    private readonly IUnitRepository _unitRepository;
    private readonly IPersonRepository _personRepository;
    private readonly ITenantContext _tenantContext;

    public AssignUnitResidentCommandHandler(
        IUnitResidentRepository unitResidentRepository,
        IUnitRepository unitRepository,
        IPersonRepository personRepository,
        ITenantContext tenantContext)
    {
        _unitResidentRepository = unitResidentRepository;
        _unitRepository = unitRepository;
        _personRepository = personRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(AssignUnitResidentCommand command, CancellationToken cancellationToken = default)
    {
        var unit = await _unitRepository.GetByIdAsync(command.UnitId, cancellationToken);
        if (unit == null)
        {
            throw new EntityNotFoundException(nameof(Unit), command.UnitId);
        }

        var person = await _personRepository.GetByIdAsync(command.PersonId, cancellationToken);
        if (person == null)
        {
            throw new EntityNotFoundException(nameof(Person), command.PersonId);
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        var relType = string.IsNullOrWhiteSpace(command.RelationshipType)
            ? UnitResident.ResidentRelationshipType.Owner
            : command.RelationshipType.Trim();

        var unitResident = new UnitResident
        {
            TenantId = tenantId,
            UnitId = command.UnitId,
            PersonId = command.PersonId,
            RelationshipType = relType,
            IsActive = true
        };

        return await _unitResidentRepository.AssignAsync(unitResident, cancellationToken);
    }
}

public sealed record DeactivateUnitResidentCommand(Guid Id) : ICommand;

public sealed class DeactivateUnitResidentCommandHandler : ICommandHandler<DeactivateUnitResidentCommand>
{
    private readonly IUnitResidentRepository _unitResidentRepository;

    public DeactivateUnitResidentCommandHandler(IUnitResidentRepository unitResidentRepository)
    {
        _unitResidentRepository = unitResidentRepository;
    }

    public async Task HandleAsync(DeactivateUnitResidentCommand command, CancellationToken cancellationToken = default)
    {
        await _unitResidentRepository.DeactivateAsync(command.Id, cancellationToken);
    }
}

// ── Queries ─────────────────────────────────────────────────────────
public sealed record ListResidentsByUnitQuery(Guid UnitId) : IQuery<IReadOnlyList<UnitResidentDto>>;

public sealed class ListResidentsByUnitQueryHandler : IQueryHandler<ListResidentsByUnitQuery, IReadOnlyList<UnitResidentDto>>
{
    private readonly IUnitResidentRepository _unitResidentRepository;

    public ListResidentsByUnitQueryHandler(IUnitResidentRepository unitResidentRepository)
    {
        _unitResidentRepository = unitResidentRepository;
    }

    public async Task<IReadOnlyList<UnitResidentDto>> HandleAsync(ListResidentsByUnitQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _unitResidentRepository.ListByUnitAsync(query.UnitId, cancellationToken);
        return list.Select(r => new UnitResidentDto(r.Id, r.TenantId, r.UnitId, r.PersonId, r.RelationshipType, r.IsActive)).ToList();
    }
}

public sealed record ListUnitsByResidentQuery(Guid PersonId) : IQuery<IReadOnlyList<UnitResidentDto>>;

public sealed class ListUnitsByResidentQueryHandler : IQueryHandler<ListUnitsByResidentQuery, IReadOnlyList<UnitResidentDto>>
{
    private readonly IUnitResidentRepository _unitResidentRepository;

    public ListUnitsByResidentQueryHandler(IUnitResidentRepository unitResidentRepository)
    {
        _unitResidentRepository = unitResidentRepository;
    }

    public async Task<IReadOnlyList<UnitResidentDto>> HandleAsync(ListUnitsByResidentQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _unitResidentRepository.ListByPersonAsync(query.PersonId, cancellationToken);
        return list.Select(r => new UnitResidentDto(r.Id, r.TenantId, r.UnitId, r.PersonId, r.RelationshipType, r.IsActive)).ToList();
    }
}
