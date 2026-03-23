using System.ComponentModel.DataAnnotations;

namespace FeatureObject.Abstraction.Contracts.Auth;


public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}