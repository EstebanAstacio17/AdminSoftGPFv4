using AdminSoftGPF.Application.Common.CQRS;
using AdminSoftGPF.Application.Common.Interfaces;
using AdminSoftGPF.Domain.Entities;
using AdminSoftGPF.Domain.Exceptions;
using AdminSoftGPF.Domain.Interfaces;

namespace AdminSoftGPF.Application.Users;

// ── DTOs ────────────────────────────────────────────────────────────
public sealed record UserDto(Guid Id, Guid? TenantId, string Email, string Role, bool IsActive);
public sealed record CreateUserDto(Guid? TenantId, string Email, string Password, string Role);

// ── Commands ────────────────────────────────────────────────────────
public sealed record CreateUserCommand(Guid? TenantId, string Email, string Password, string Role) : ICommand<Guid>;

public sealed class CreateUserCommandHandler : ICommandHandler<CreateUserCommand, Guid>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserCommandHandler(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<Guid> HandleAsync(CreateUserCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.Email))
        {
            throw new DomainException("El correo electrónico es requerido.");
        }

        if (string.IsNullOrWhiteSpace(command.Password) || command.Password.Length < 6)
        {
            throw new DomainException("La contraseña debe tener al menos 6 caracteres.");
        }

        var existing = await _userRepository.GetByEmailAsync(command.Email.Trim(), cancellationToken);
        if (existing != null)
        {
            throw new DuplicateEntityException(nameof(User), nameof(User.Email), command.Email);
        }

        var user = new User
        {
            TenantId = command.TenantId,
            Email = command.Email.Trim().ToLowerInvariant(),
            PasswordHash = _passwordHasher.HashPassword(command.Password),
            Role = command.Role,
            IsActive = true
        };

        return await _userRepository.CreateAsync(user, cancellationToken);
    }
}

public sealed record SetUserActiveStatusCommand(Guid Id, bool IsActive) : ICommand;

public sealed class SetUserActiveStatusCommandHandler : ICommandHandler<SetUserActiveStatusCommand>
{
    private readonly IUserRepository _userRepository;

    public SetUserActiveStatusCommandHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task HandleAsync(SetUserActiveStatusCommand command, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(command.Id, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), command.Id);
        }

        await _userRepository.SetActiveStatusAsync(command.Id, command.IsActive, cancellationToken);
    }
}

// ── Queries ─────────────────────────────────────────────────────────
public sealed record GetUserByIdQuery(Guid Id) : IQuery<UserDto>;

public sealed class GetUserByIdQueryHandler : IQueryHandler<GetUserByIdQuery, UserDto>
{
    private readonly IUserRepository _userRepository;

    public GetUserByIdQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserDto> HandleAsync(GetUserByIdQuery query, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(query.Id, cancellationToken);
        if (user == null)
        {
            throw new EntityNotFoundException(nameof(User), query.Id);
        }

        return new UserDto(user.Id, user.TenantId, user.Email, user.Role, user.IsActive);
    }
}

public sealed record ListUsersByTenantQuery(Guid TenantId) : IQuery<IReadOnlyList<UserDto>>;

public sealed class ListUsersByTenantQueryHandler : IQueryHandler<ListUsersByTenantQuery, IReadOnlyList<UserDto>>
{
    private readonly IUserRepository _userRepository;

    public ListUsersByTenantQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IReadOnlyList<UserDto>> HandleAsync(ListUsersByTenantQuery query, CancellationToken cancellationToken = default)
    {
        var list = await _userRepository.ListByTenantAsync(query.TenantId, cancellationToken);
        return list.Select(u => new UserDto(u.Id, u.TenantId, u.Email, u.Role, u.IsActive)).ToList();
    }
}
