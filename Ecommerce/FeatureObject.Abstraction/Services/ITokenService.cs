namespace FeatureObject.Abstraction.Services
{
    public interface ITokenService
    {
        string CreateToken(int userId, string email, string role);
    }
}
