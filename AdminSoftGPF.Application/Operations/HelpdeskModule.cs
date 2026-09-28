using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Operations;

// ── Maintenance Tickets DTOs & Handlers ─────────────────────────────
public sealed record MaintenanceTicketDto(Guid Id, Guid TenantId, Guid PropertyId, Guid? UnitId, Guid ReportedByPersonId, string Title, string Description, string Priority, string Status, DateTime CreatedAt, DateTime? ResolvedAt);
public sealed record CreateTicketDto(Guid PropertyId, Guid? UnitId, Guid ReportedByPersonId, string Title, string Description, string Priority);

public sealed record CreateTicketCommand(Guid PropertyId, Guid? UnitId, Guid ReportedByPersonId, string Title, string Description, string Priority) : ICommand<Guid>;

public sealed class CreateTicketCommandHandler : ICommandHandler<CreateTicketCommand, Guid>
{
    private readonly IMaintenanceTicketRepository _ticketRepository;
    private readonly ITenantContext _tenantContext;

    public CreateTicketCommandHandler(IMaintenanceTicketRepository ticketRepository, ITenantContext tenantContext)
    {
        _ticketRepository = ticketRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateTicketCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        return await _ticketRepository.CreateAsync(new MaintenanceTicket
        {
            TenantId = tenantId,
            PropertyId = command.PropertyId,
            UnitId = command.UnitId,
            ReportedByPersonId = command.ReportedByPersonId,
            Title = command.Title.Trim(),
            Description = command.Description.Trim(),
            Priority = string.IsNullOrWhiteSpace(command.Priority) ? MaintenanceTicket.TicketPriority.Medium : command.Priority.Trim(),
            Status = MaintenanceTicket.TicketStatus.Open
        }, cancellationToken);
    }
}

public sealed record UpdateTicketStatusCommand(Guid Id, string Status) : ICommand;

public sealed class UpdateTicketStatusCommandHandler : ICommandHandler<UpdateTicketStatusCommand>
{
    private readonly IMaintenanceTicketRepository _ticketRepository;

    public UpdateTicketStatusCommandHandler(IMaintenanceTicketRepository ticketRepository)
    {
        _ticketRepository = ticketRepository;
    }

    public async Task HandleAsync(UpdateTicketStatusCommand command, CancellationToken cancellationToken = default)
    {
        await _ticketRepository.UpdateStatusAsync(command.Id, command.Status, cancellationToken);
    }
}

public sealed record ListTicketsByPropertyQuery(Guid PropertyId) : IQuery<IReadOnlyList<MaintenanceTicketDto>>;

public sealed class ListTicketsByPropertyQueryHandler : IQueryHandler<ListTicketsByPropertyQuery, IReadOnlyList<MaintenanceTicketDto>>
{
    private readonly IMaintenanceTicketRepository _ticketRepository;

    public ListTicketsByPropertyQueryHandler(IMaintenanceTicketRepository ticketRepository)
    {
        _ticketRepository = ticketRepository;
    }

    public async Task<IReadOnlyList<MaintenanceTicketDto>> HandleAsync(ListTicketsByPropertyQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _ticketRepository.ListByPropertyAsync(query.PropertyId, cancellationToken);
        return list.Select(t => new MaintenanceTicketDto(t.Id, t.TenantId, t.PropertyId, t.UnitId, t.ReportedByPersonId, t.Title, t.Description, t.Priority, t.Status, t.CreatedAt, t.ResolvedAt)).ToList();
    }
}
