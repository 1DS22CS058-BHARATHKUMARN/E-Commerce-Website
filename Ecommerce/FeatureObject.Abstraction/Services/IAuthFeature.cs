using FeatureObject.Abstraction.Contracts.Auth;

namespace FeatureObject.Abstraction.Services;

public interface IAuthFeature
{
    Task<AuthResponse> RegisterAsync(RegisterRequest req);
    Task<AuthResponse> LoginAsync(LoginRequest req);
}
