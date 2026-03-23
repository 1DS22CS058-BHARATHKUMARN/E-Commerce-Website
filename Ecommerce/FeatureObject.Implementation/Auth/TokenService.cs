using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using FeatureObject.Abstraction.Services;

namespace FeatureObject.Implementation.Contracts.Auth;



public sealed class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string CreateToken(int userId, string email, string role)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key");
        var issuer = _config["Jwt:Issuer"];
        var audience = _config["Jwt:Audience"];

        var claims = new List<Claim>
{
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),

            new Claim(ClaimTypes.Email, email),
            new Claim(JwtRegisteredClaimNames.Email, email),

            new Claim(ClaimTypes.Role, role),
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(6),
            signingCredentials: creds
        );

        

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}