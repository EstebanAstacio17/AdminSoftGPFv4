using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Properties;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/properties")]
[Authorize]
public sealed class PropertiesController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public PropertiesController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Lista todas las propiedades (condominios, plazas) pertenecientes al Tenant autenticado.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PropertyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListPropertiesQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de una propiedad por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PropertyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetPropertyByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Registra una nueva propiedad en el Tenant actual.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePropertyDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreatePropertyCommand(dto.Name, dto.Address), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>
    /// Actualiza los datos de una propiedad existente.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdatePropertyDto dto, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new UpdatePropertyCommand(id, dto.Name, dto.Address), cancellationToken);
        return NoContent();
    }
}
