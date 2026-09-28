using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.UnitResidents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/unit-residents")]
[Authorize]
public sealed class UnitResidentsController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public UnitResidentsController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Lista las personas activas asociadas a una unidad.
    /// </summary>
    [HttpGet("unit/{unitId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<UnitResidentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByUnit([FromRoute] Guid unitId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListResidentsByUnitQuery(unitId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Lista las unidades vinculadas a una persona (propiedades o alquileres).
    /// </summary>
    [HttpGet("person/{personId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<UnitResidentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListByPerson([FromRoute] Guid personId, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListUnitsByResidentQuery(personId), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Asigna una persona como propietario o inquilino de una unidad.
    /// </summary>
    [HttpPost("assign")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Assign([FromBody] AssignResidentDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new AssignUnitResidentCommand(dto.UnitId, dto.PersonId, dto.RelationshipType), cancellationToken);
        return Ok(new { id });
    }

    /// <summary>
    /// Desactiva el vínculo de una persona con una unidad (baja de inquilino/propietario).
    /// </summary>
    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Deactivate([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new DeactivateUnitResidentCommand(id), cancellationToken);
        return NoContent();
    }
}
