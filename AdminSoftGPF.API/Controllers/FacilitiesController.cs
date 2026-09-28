using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Operations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/facilities")]
[Authorize]
public sealed class FacilitiesController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public FacilitiesController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    // ── Amenities ───────────────────────────────────────────────────
    [HttpGet("amenities/property/{propertyId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<AmenityDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAmenities([FromRoute] Guid propertyId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListAmenitiesByPropertyQuery(propertyId), cancellationToken);
        return Ok(result);
    }

    [HttpPost("amenities")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateAmenity([FromBody] CreateAmenityDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateAmenityCommand(dto.PropertyId, dto.Name, dto.Capacity, dto.HourlyRate), cancellationToken);
        return Ok(new { id });
    }

    // ── Bookings ────────────────────────────────────────────────────
    [HttpGet("bookings/amenity/{amenityId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<AmenityBookingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListBookings([FromRoute] Guid amenityId, [FromQuery] DateOnly date, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListBookingsByAmenityQuery(amenityId, date), cancellationToken);
        return Ok(result);
    }

    [HttpPost("bookings")]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreateBookingCommand(dto.AmenityId, dto.PersonId, dto.UnitId, dto.StartTime, dto.EndTime, dto.TotalAmount), cancellationToken);
        return Ok(new { id });
    }
}
