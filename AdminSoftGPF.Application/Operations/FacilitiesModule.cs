using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Operations;

// ── Amenities & Bookings DTOs & Handlers ────────────────────────────
public sealed record AmenityDto(Guid Id, Guid TenantId, Guid PropertyId, string Name, int Capacity, decimal HourlyRate, bool IsActive);
public sealed record CreateAmenityDto(Guid PropertyId, string Name, int Capacity, decimal HourlyRate);

public sealed record AmenityBookingDto(Guid Id, Guid TenantId, Guid AmenityId, Guid PersonId, Guid UnitId, DateTime StartTime, DateTime EndTime, decimal TotalAmount, string Status, DateTime CreatedAt);
public sealed record CreateBookingDto(Guid AmenityId, Guid PersonId, Guid UnitId, DateTime StartTime, DateTime EndTime, decimal TotalAmount);

public sealed record CreateAmenityCommand(Guid PropertyId, string Name, int Capacity, decimal HourlyRate) : ICommand<Guid>;

public sealed class CreateAmenityCommandHandler : ICommandHandler<CreateAmenityCommand, Guid>
{
    private readonly IFacilitiesRepository _facilitiesRepository;
    private readonly ITenantContext _tenantContext;

    public CreateAmenityCommandHandler(IFacilitiesRepository facilitiesRepository, ITenantContext tenantContext)
    {
        _facilitiesRepository = facilitiesRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateAmenityCommand command, CancellationToken cancellationToken = default)
    {
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");
        return await _facilitiesRepository.CreateAmenityAsync(new Amenity
        {
            TenantId = tenantId,
            PropertyId = command.PropertyId,
            Name = command.Name.Trim(),
            Capacity = command.Capacity,
            HourlyRate = command.HourlyRate,
            IsActive = true
        }, cancellationToken);
    }
}

public sealed record ListAmenitiesByPropertyQuery(Guid PropertyId) : IQuery<IReadOnlyList<AmenityDto>>;

public sealed class ListAmenitiesByPropertyQueryHandler : IQueryHandler<ListAmenitiesByPropertyQuery, IReadOnlyList<AmenityDto>>
{
    private readonly IFacilitiesRepository _facilitiesRepository;

    public ListAmenitiesByPropertyQueryHandler(IFacilitiesRepository facilitiesRepository)
    {
        _facilitiesRepository = facilitiesRepository;
    }

    public async Task<IReadOnlyList<AmenityDto>> HandleAsync(ListAmenitiesByPropertyQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _facilitiesRepository.ListAmenitiesByPropertyAsync(query.PropertyId, cancellationToken);
        return list.Select(a => new AmenityDto(a.Id, a.TenantId, a.PropertyId, a.Name, a.Capacity, a.HourlyRate, a.IsActive)).ToList();
    }
}

public sealed record CreateBookingCommand(Guid AmenityId, Guid PersonId, Guid UnitId, DateTime StartTime, DateTime EndTime, decimal TotalAmount) : ICommand<Guid>;

public sealed class CreateBookingCommandHandler : ICommandHandler<CreateBookingCommand, Guid>
{
    private readonly IFacilitiesRepository _facilitiesRepository;
    private readonly ITenantContext _tenantContext;

    public CreateBookingCommandHandler(IFacilitiesRepository facilitiesRepository, ITenantContext tenantContext)
    {
        _facilitiesRepository = facilitiesRepository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> HandleAsync(CreateBookingCommand command, CancellationToken cancellationToken = default)
    {
        if (command.EndTime <= command.StartTime) throw new DomainException("La fecha de fin debe ser posterior a la de inicio.");
        var tenantId = _tenantContext.TenantId ?? throw new DomainException("Contexto de Tenant requerido.");

        return await _facilitiesRepository.CreateBookingAsync(new AmenityBooking
        {
            TenantId = tenantId,
            AmenityId = command.AmenityId,
            PersonId = command.PersonId,
            UnitId = command.UnitId,
            StartTime = command.StartTime,
            EndTime = command.EndTime,
            TotalAmount = command.TotalAmount,
            Status = AmenityBooking.BookingStatus.Confirmed
        }, cancellationToken);
    }
}

public sealed record ListBookingsByAmenityQuery(Guid AmenityId, DateOnly Date) : IQuery<IReadOnlyList<AmenityBookingDto>>;

public sealed class ListBookingsByAmenityQueryHandler : IQueryHandler<ListBookingsByAmenityQuery, IReadOnlyList<AmenityBookingDto>>
{
    private readonly IFacilitiesRepository _facilitiesRepository;

    public ListBookingsByAmenityQueryHandler(IFacilitiesRepository facilitiesRepository)
    {
        _facilitiesRepository = facilitiesRepository;
    }

    public async Task<IReadOnlyList<AmenityBookingDto>> HandleAsync(ListBookingsByAmenityQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _facilitiesRepository.ListBookingsByAmenityAsync(query.AmenityId, query.Date, cancellationToken);
        return list.Select(b => new AmenityBookingDto(b.Id, b.TenantId, b.AmenityId, b.PersonId, b.UnitId, b.StartTime, b.EndTime, b.TotalAmount, b.Status, b.CreatedAt)).ToList();
    }
}
