using FeatureObject.Abstraction.Contracts.Auth;
using FeatureObject.Abstraction.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;


namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IAuthFeature auth) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
        => Ok(await auth.RegisterAsync(req));

// React sends POST request with JSON body
//        ?
//[FromBody] converts JSON ? RegisterRequest object
//        ?
//auth.RegisterAsync(req) runs the business logic
//        ?
//Returns AuthResponse(token + user info)
//        ?
//Ok() wraps it in 200 response
//        ?
//React receives the token


    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
        => Ok(await auth.LoginAsync(req));

   

    [Authorize(Roles = "Admin")]
    [HttpGet("admin-ping")]
    public IActionResult AdminPing() => Ok("admin ok");

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        var email =
            User.FindFirstValue(ClaimTypes.Email) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Email);

        var role = User.FindFirstValue(ClaimTypes.Role);

        return Ok(new { userId, email, role });
    }
}



