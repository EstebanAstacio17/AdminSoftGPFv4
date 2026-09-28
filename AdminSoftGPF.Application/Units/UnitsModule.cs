using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Units;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record UnitDto(Guid Id, Guid TenantId, Guid BlockId, string UnitNumber, string Status);
public sealed record CreateUnitDto(Guid BlockId, string UnitNumber, string Status);
public sealed record UpdateUnitDto(string UnitNumber, string Status);

// ── Commands ────────────────────────────────────────────────────────
public sealed record CreateUnitCommand(Guid BlockId, string UnitNumber, string Status) : ICommand<Guid>;

public sealed class CreateUnitCommandHandler : ICommandHandler<CreateUnitCommand, Guid>
{
    private readonly IUnitRepository _unitRepository;
    private readonly IBlockRepository _blockRepository;
    private readonly ITenantContext _tenantContext;

    public CreateUnitCommandHandler(
        IUnitRepository unitRepository,
        IBlockRepository blockRepository,
        ITenantContext tenantContext)
    {
        _unitRepository = unitRepository;
        _blockRepository = blockRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateUnitCommand command, CancellationToken cancellationToken = default)
    {
        var block = await _blockRepository.GetByIdAsync(command.BlockId, cancellationToken);
        if (block == null)
        {
            throw new EntityNotFoundException(nameof(Block), command.BlockId);
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        var unit = new Unit
        {
            TenantId = tenantId,
            BlockId = command.BlockId,
            UnitNumber = command.UnitNumber.Trim(),
            Status = string.IsNullOrWhiteSpace(command.Status) ? "Available" : command.Status.Trim()
        };

        return await _unitRepository.CreateAsync(unit, cancellationToken);
    }
}

public sealed record UpdateUnitCommand(Guid Id, string UnitNumber, string Status) : ICommand;

public sealed class UpdateUnitCommandHandler : ICommandHandler<UpdateUnitCommand>
{
    private readonly IUnitRepository _unitRepository;
    private readonly ITenantContext _tenantContext;

    public UpdateUnitCommandHandler(IUnitRepository unitRepository, ITenantContext tenantContext)
    {
        _unitRepository = unitRepository;
        _tenantContext = tenantContext;
    }

    public async Task HandleAsync(UpdateUnitCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var unit = await _unitRepository.GetByIdAsync(command.Id, cancellationToken);
        if (unit == null)
        {
            throw new EntityNotFoundException(nameof(Unit), command.Id);
        }

        unit.UnitNumber = command.UnitNumber.Trim();
        unit.Status = command.Status.Trim();

        await _unitRepository.UpdateAsync(unit, cancellationToken);
    }
}

// ── Queries ─────────────────────────────────────────────────────────
public sealed record GetUnitByIdQuery(Guid Id) : IQuery<UnitDto>;

public sealed class GetUnitByIdQueryHandler : IQueryHandler<GetUnitByIdQuery, UnitDto>
{
    private readonly IUnitRepository _unitRepository;

    public GetUnitByIdQueryHandler(IUnitRepository unitRepository)
    {
        _unitRepository = unitRepository;
    }

    public async Task<UnitDto> HandleAsync(GetUnitByIdQuery query, CancellationToken cancellationToken = default)
    {
        var unit = await _unitRepository.GetByIdAsync(query.Id, cancellationToken);
        if (unit == null)
        {
            throw new EntityNotFoundException(nameof(Unit), query.Id);
        }

        return new UnitDto(unit.Id, unit.TenantId, unit.BlockId, unit.UnitNumber, unit.Status);
    }
}

public sealed record ListUnitsByBlockQuery(Guid BlockId) : IQuery<IReadOnlyList<UnitDto>>;

public sealed class ListUnitsByBlockQueryHandler : IQueryHandler<ListUnitsByBlockQuery, IReadOnlyList<UnitDto>>
{
    private readonly IUnitRepository _unitRepository;

    public ListUnitsByBlockQueryHandler(IUnitRepository unitRepository)
    {
        _unitRepository = unitRepository;
    }

    public async Task<IReadOnlyList<UnitDto>> HandleAsync(ListUnitsByBlockQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _unitRepository.ListByBlockAsync(query.BlockId, cancellationToken);
        return list.Select(u => new UnitDto(u.Id, u.TenantId, u.BlockId, u.UnitNumber, u.Status)).ToList();
    }
}

public sealed record ListUnitsByPropertyQuery(Guid PropertyId) : IQuery<IReadOnlyList<UnitDto>>;

public sealed class ListUnitsByPropertyQueryHandler : IQueryHandler<ListUnitsByPropertyQuery, IReadOnlyList<UnitDto>>
{
    private readonly IUnitRepository _unitRepository;

    public ListUnitsByPropertyQueryHandler(IUnitRepository unitRepository)
    {
        _unitRepository = unitRepository;
    }

    public async Task<IReadOnlyList<UnitDto>> HandleAsync(ListUnitsByPropertyQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _unitRepository.ListByPropertyAsync(query.PropertyId, cancellationToken);
        return list.Select(u => new UnitDto(u.Id, u.TenantId, u.BlockId, u.UnitNumber, u.Status)).ToList();
    }
}
