using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Properties;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record PropertyDto(Guid Id, Guid TenantId, string Name, string Address);
public sealed record CreatePropertyDto(string Name, string Address);
public sealed record UpdatePropertyDto(string Name, string Address);

public sealed record BlockDto(Guid Id, Guid TenantId, Guid PropertyId, string Name);
public sealed record CreateBlockDto(Guid PropertyId, string Name);
public sealed record UpdateBlockDto(string Name);

// ── Property Commands & Queries ─────────────────────────────────────
public sealed record CreatePropertyCommand(string Name, string Address) : ICommand<Guid>;

public sealed class CreatePropertyCommandHandler : ICommandHandler<CreatePropertyCommand, Guid>
{
    private readonly IPropertyRepository _propertyRepository;
    private readonly ITenantContext _tenantContext;

    public CreatePropertyCommandHandler(IPropertyRepository propertyRepository, ITenantContext tenantContext)
    {
        _propertyRepository = propertyRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreatePropertyCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            throw new DomainException("El nombre de la propiedad no puede estar vacío.");
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        var property = new Property
        {
            TenantId = tenantId,
            Name = command.Name.Trim(),
            Address = command.Address.Trim()
        };

        return await _propertyRepository.CreateAsync(property, cancellationToken);
    }
}

public sealed record UpdatePropertyCommand(Guid Id, string Name, string Address) : ICommand;

public sealed class UpdatePropertyCommandHandler : ICommandHandler<UpdatePropertyCommand>
{
    private readonly IPropertyRepository _propertyRepository;
    private readonly ITenantContext _tenantContext;

    public UpdatePropertyCommandHandler(IPropertyRepository propertyRepository, ITenantContext tenantContext)
    {
        _propertyRepository = propertyRepository;
        _tenantContext = tenantContext;
    }

    public async Task HandleAsync(UpdatePropertyCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var property = await _propertyRepository.GetByIdAsync(command.Id, cancellationToken);
        if (property == null)
        {
            throw new EntityNotFoundException(nameof(Property), command.Id);
        }

        property.Name = command.Name.Trim();
        property.Address = command.Address.Trim();

        await _propertyRepository.UpdateAsync(property, cancellationToken);
    }
}

public sealed record GetPropertyByIdQuery(Guid Id) : IQuery<PropertyDto>;

public sealed class GetPropertyByIdQueryHandler : IQueryHandler<GetPropertyByIdQuery, PropertyDto>
{
    private readonly IPropertyRepository _propertyRepository;

    public GetPropertyByIdQueryHandler(IPropertyRepository propertyRepository)
    {
        _propertyRepository = propertyRepository;
    }

    public async Task<PropertyDto> HandleAsync(GetPropertyByIdQuery query, CancellationToken cancellationToken = default)
    {
        var property = await _propertyRepository.GetByIdAsync(query.Id, cancellationToken);
        if (property == null)
        {
            throw new EntityNotFoundException(nameof(Property), query.Id);
        }

        return new PropertyDto(property.Id, property.TenantId, property.Name, property.Address);
    }
}

public sealed record ListPropertiesQuery() : IQuery<IReadOnlyList<PropertyDto>>;

public sealed class ListPropertiesQueryHandler : IQueryHandler<ListPropertiesQuery, IReadOnlyList<PropertyDto>>
{
    private readonly IPropertyRepository _propertyRepository;

    public ListPropertiesQueryHandler(IPropertyRepository propertyRepository)
    {
        _propertyRepository = propertyRepository;
    }

    public async Task<IReadOnlyList<PropertyDto>> HandleAsync(ListPropertiesQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _propertyRepository.ListByTenantAsync(cancellationToken);
        return list.Select(p => new PropertyDto(p.Id, p.TenantId, p.Name, p.Address)).ToList();
    }
}

// ── Block Commands & Queries ────────────────────────────────────────
public sealed record CreateBlockCommand(Guid PropertyId, string Name) : ICommand<Guid>;

public sealed class CreateBlockCommandHandler : ICommandHandler<CreateBlockCommand, Guid>
{
    private readonly IBlockRepository _blockRepository;
    private readonly IPropertyRepository _propertyRepository;
    private readonly ITenantContext _tenantContext;

    public CreateBlockCommandHandler(
        IBlockRepository blockRepository,
        IPropertyRepository propertyRepository,
        ITenantContext tenantContext)
    {
        _blockRepository = blockRepository;
        _propertyRepository = propertyRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateBlockCommand command, CancellationToken cancellationToken = default)
    {
        var property = await _propertyRepository.GetByIdAsync(command.PropertyId, cancellationToken);
        if (property == null)
        {
            throw new EntityNotFoundException(nameof(Property), command.PropertyId);
        }

        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        var block = new Block
        {
            TenantId = tenantId,
            PropertyId = command.PropertyId,
            Name = command.Name.Trim()
        };

        return await _blockRepository.CreateAsync(block, cancellationToken);
    }
}

public sealed record ListBlocksByPropertyQuery(Guid PropertyId) : IQuery<IReadOnlyList<BlockDto>>;

public sealed class ListBlocksByPropertyQueryHandler : IQueryHandler<ListBlocksByPropertyQuery, IReadOnlyList<BlockDto>>
{
    private readonly IBlockRepository _blockRepository;

    public ListBlocksByPropertyQueryHandler(IBlockRepository blockRepository)
    {
        _blockRepository = blockRepository;
    }

    public async Task<IReadOnlyList<BlockDto>> HandleAsync(ListBlocksByPropertyQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _blockRepository.ListByPropertyAsync(query.PropertyId, cancellationToken);
        return list.Select(b => new BlockDto(b.Id, b.TenantId, b.PropertyId, b.Name)).ToList();
    }
}
