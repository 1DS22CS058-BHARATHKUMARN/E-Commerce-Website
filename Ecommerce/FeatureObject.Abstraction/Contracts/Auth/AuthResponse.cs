namespace FeatureObject.Abstraction.Contracts.Auth;

public class AuthResponse
{
    public string AccessToken { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
}