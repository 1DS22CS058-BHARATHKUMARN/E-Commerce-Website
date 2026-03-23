using Microsoft.AspNetCore.Identity;
using FeatureObject.Abstraction.Contracts.Auth;
using Datastore.Abstraction.Repositories;
using FeatureObject.Abstraction.Services;
using Datastore.Abstraction.Models;

namespace FeatureObject.Implementation;

public class AuthFeature(
    IUserRepository users,
    ITokenService tokens
) : IAuthFeature
{
    private readonly PasswordHasher<UserRow> _hasher = new();

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        var existing = await users.GetByEmailAsync(email);
        if (existing != null)
            throw new InvalidOperationException("Email already registered.");

        var user = new UserRow
        {
            Email = email,
            Role = "Customer",
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _hasher.HashPassword(user, req.Password);
        user.Id = (int) await users.CreateAsync(user);

        return new AuthResponse
        {
            Email = user.Email,
            Role = user.Role,
            AccessToken = tokens.CreateToken(user.Id, user.Email, user.Role)
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();

        var user = await users.GetByEmailAsync(email);
        if (user == null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
        if (result == PasswordVerificationResult.Failed)
            throw new UnauthorizedAccessException("Invalid email or password.");

        return new AuthResponse
        {
            Email = user.Email,
            Role = user.Role,
            AccessToken = tokens.CreateToken(user.Id, user.Email, user.Role)
        };
    }
}