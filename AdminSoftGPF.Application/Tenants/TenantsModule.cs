using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Tenants;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record TenantDto(Guid Id, string Name, string? TaxId, string Status, DateTime CreatedAt);
public sealed record CreateTenantDto(string Name, string? TaxId);
public sealed record UpdateTenantStatusDto(string Status);

// ── Commands ────────────────────────────────────────────────────────
public sealed record CreateTenantCommand(string Name, string? TaxId) : ICommand<Guid>;

public sealed class CreateTenantCommandHandler : ICommandHandler<CreateTenantCommand, Guid>
{
    private readonly ITenantRepository _tenantRepository;

    public CreateTenantCommandHandler(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<Guid> HandleAsync(CreateTenantCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            throw new DomainException("El nombre del Tenant no puede estar vacío.");
        }

        var tenant = new Tenant
        {
            Name = command.Name.Trim(),
            TaxId = command.TaxId?.Trim(),
            Status = Tenant.TenantStatus.Active
        };

        return await _tenantRepository.CreateAsync(tenant, cancellationToken);
    }
}

public sealed record UpdateTenantStatusCommand(Guid Id, string Status) : ICommand;

public sealed class UpdateTenantStatusCommandHandler : ICommandHandler<UpdateTenantStatusCommand>
{
    private readonly ITenantRepository _tenantRepository;

    public UpdateTenantStatusCommandHandler(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task HandleAsync(UpdateTenantStatusCommand command, CancellationToken cancellationToken = default)
    {
        var tenant = await _tenantRepository.GetByIdAsync(command.Id, cancellationToken);
        if (tenant == null)
        {
            throw new EntityNotFoundException(nameof(Tenant), command.Id);
        }

        var validStatuses = new[] { Tenant.TenantStatus.Active, Tenant.TenantStatus.ReadOnly, Tenant.TenantStatus.Suspended };
        if (!validStatuses.Contains(command.Status))
        {
            throw new DomainException($"El estado '{command.Status}' no es un estado de ciclo de vida válido.");
        }

        await _tenantRepository.UpdateStatusAsync(command.Id, command.Status, cancellationToken);
    }
}

// ── Queries ─────────────────────────────────────────────────────────
public sealed record GetTenantByIdQuery(Guid Id) : IQuery<TenantDto>;

public sealed class GetTenantByIdQueryHandler : IQueryHandler<GetTenantByIdQuery, TenantDto>
{
    private readonly ITenantRepository _tenantRepository;

    public GetTenantByIdQueryHandler(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<TenantDto> HandleAsync(GetTenantByIdQuery query, CancellationToken cancellationToken = default)
    {
        var tenant = await _tenantRepository.GetByIdAsync(query.Id, cancellationToken);
        if (tenant == null)
        {
            throw new EntityNotFoundException(nameof(Tenant), query.Id);
        }

        return new TenantDto(tenant.Id, tenant.Name, tenant.TaxId, tenant.Status, tenant.CreatedAt);
    }
}

public sealed record ListTenantsQuery() : IQuery<IReadOnlyList<TenantDto>>;

public sealed class ListTenantsQueryHandler : IQueryHandler<ListTenantsQuery, IReadOnlyList<TenantDto>>
{
    private readonly ITenantRepository _tenantRepository;

    public ListTenantsQueryHandler(ITenantRepository tenantRepository)
    {
        _tenantRepository = tenantRepository;
    }

    public async Task<IReadOnlyList<TenantDto>> HandleAsync(ListTenantsQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _tenantRepository.ListAllAsync(cancellationToken);
        return list.Select(t => new TenantDto(t.Id, t.Name, t.TaxId, t.Status, t.CreatedAt)).ToList();
    }
}
