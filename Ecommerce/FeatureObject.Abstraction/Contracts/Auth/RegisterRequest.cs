using System.ComponentModel.DataAnnotations;

namespace FeatureObject.Abstraction.Contracts.Auth;

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required, MinLength(6)]
    public string Password { get; set; } = "";
}