namespace AdminSoftGPF.Application.Common.Interfaces;

/// <summary>
/// Contrato para el hashing seguro y verificación de contraseñas de usuarios.
/// </summary>
public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
