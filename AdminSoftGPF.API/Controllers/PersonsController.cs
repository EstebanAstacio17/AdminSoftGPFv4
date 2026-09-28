using AdminSoftGPF.API.Common;
using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Persons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdminSoftGPF.API.Controllers;

[ApiController]
[Route("api/v1/persons")]
[Authorize]
public sealed class PersonsController : ControllerBase
{
    private readonly IAppDispatcher _dispatcher;

    public PersonsController(IAppDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    /// <summary>
    /// Lista todas las personas registradas en el Tenant.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(IReadOnlyList<PersonDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new ListPersonsByTenantQuery(), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Obtiene el detalle de una persona por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(PersonDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _dispatcher.QueryAsync(new GetPersonByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Registra una nueva persona (residente / propietario).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreatePersonDto dto, CancellationToken cancellationToken)
    {
        var id = await _dispatcher.SendAsync(new CreatePersonCommand(dto.FirstName, dto.LastName, dto.Email, dto.TaxId), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>
    /// Actualiza los datos de una persona.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = AppRoles.Financial)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdatePersonDto dto, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new UpdatePersonCommand(id, dto.FirstName, dto.LastName, dto.Email, dto.TaxId), cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Aplica Soft-Anonymization para cumplimiento de privacidad y Derecho al Olvido (GDPR/Compliance).
    /// REGLA INQUEBRANTABLE: Prohibido DELETE físico para preservar la integridad contable histórica.
    /// </summary>
    [HttpPost("{id:guid}/anonymize")]
    [Authorize(Roles = AppRoles.Management)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Anonymize([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        await _dispatcher.SendAsync(new AnonymizePersonCommand(id), cancellationToken);
        return NoContent();
    }
}
