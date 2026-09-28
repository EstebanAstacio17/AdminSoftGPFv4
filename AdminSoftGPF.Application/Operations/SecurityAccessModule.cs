using System.Security.Cryptography;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Operations;

// ── Security & Gate DTOs & Handlers ─────────────────────────────────
public sealed record VisitorPassDto(Guid Id, Guid TenantId, Guid UnitId, string VisitorName, string? VisitorIdNumber, DateTime ValidFrom, DateTime ValidTo, string QrCodeToken, string Status);
public sealed record CreateVisitorPassDto(Guid UnitId, string VisitorName, string? VisitorIdNumber, DateTime ValidFrom, DateTime ValidTo);

public sealed record GateLogDto(Guid Id, Guid TenantId, Guid PropertyId, Guid? VisitorPassId, Guid GuardUserId, string VisitorName, string? VehiclePlate, DateTime EntryTime, DateTime? ExitTime);
public sealed record RegisterGateEntryDto(Guid PropertyId, Guid? VisitorPassId, string VisitorName, string? VehiclePlate);

public sealed record CreateVisitorPassCommand(Guid UnitId, string VisitorName, string? VisitorIdNumber, DateTime ValidFrom, DateTime ValidTo) : ICommand<VisitorPassDto>;

public sealed class CreateVisitorPassCommandHandler : ICommandHandler<CreateVisitorPassCommand, VisitorPassDto>
{
    private readonly ISecurityAccessRepository _securityRepository;
    private readonly ITenantContext _tenantContext;

    public CreateVisitorPassCommandHandler(ISecurityAccessRepository securityRepository, ITenantContext tenantContext)
    {
        _securityRepository = securityRepository;
        _tenantContext = tenantContext;
    }

    public async Task<VisitorPassDto> HandleAsync(CreateVisitorPassCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var qrToken = "QR-" + Convert.ToHexString(RandomNumberGenerator.GetBytes(16));

        var pass = new VisitorPass
        {
            TenantId = tenantId,
            UnitId = command.UnitId,
            VisitorName = command.VisitorName.Trim(),
            VisitorIdNumber = command.VisitorIdNumber?.Trim(),
            ValidFrom = command.ValidFrom,
            ValidTo = command.ValidTo,
            QrCodeToken = qrToken,
            Status = VisitorPass.PassStatus.Active
        };

        pass.Id = await _securityRepository.CreateVisitorPassAsync(pass, cancellationToken);
        return new VisitorPassDto(pass.Id, pass.TenantId, pass.UnitId, pass.VisitorName, pass.VisitorIdNumber, pass.ValidFrom, pass.ValidTo, pass.QrCodeToken, pass.Status);
    }
}

public sealed record RegisterGateEntryCommand(Guid PropertyId, Guid? VisitorPassId, string VisitorName, string? VehiclePlate) : ICommand<Guid>;

public sealed class RegisterGateEntryCommandHandler : ICommandHandler<RegisterGateEntryCommand, Guid>
{
    private readonly ISecurityAccessRepository _securityRepository;
    private readonly ITenantContext _tenantContext;

    public RegisterGateEntryCommandHandler(ISecurityAccessRepository securityRepository, ITenantContext tenantContext)
    {
        _securityRepository = securityRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(RegisterGateEntryCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        var guardId = _tenantContext.UserId ?? Guid.Empty;

        return await _securityRepository.RegisterGateEntryAsync(new GateLog
        {
            TenantId = tenantId,
            PropertyId = command.PropertyId,
            VisitorPassId = command.VisitorPassId,
            GuardUserId = guardId,
            VisitorName = command.VisitorName.Trim(),
            VehiclePlate = command.VehiclePlate?.Trim(),
            EntryTime = DateTime.UtcNow
        }, cancellationToken);
    }
}

public sealed record ListGateLogsByPropertyQuery(Guid PropertyId, int MaxRecords = 100) : IQuery<IReadOnlyList<GateLogDto>>;

public sealed class ListGateLogsByPropertyQueryHandler : IQueryHandler<ListGateLogsByPropertyQuery, IReadOnlyList<GateLogDto>>
{
    private readonly ISecurityAccessRepository _securityRepository;

    public ListGateLogsByPropertyQueryHandler(ISecurityAccessRepository securityRepository)
    {
        _securityRepository = securityRepository;
    }

    public async Task<IReadOnlyList<GateLogDto>> HandleAsync(ListGateLogsByPropertyQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _securityRepository.ListGateLogsByPropertyAsync(query.PropertyId, query.MaxRecords, cancellationToken);
        return list.Select(g => new GateLogDto(g.Id, g.TenantId, g.PropertyId, g.VisitorPassId, g.GuardUserId, g.VisitorName, g.VehiclePlate, g.EntryTime, g.ExitTime)).ToList();
    }
}
