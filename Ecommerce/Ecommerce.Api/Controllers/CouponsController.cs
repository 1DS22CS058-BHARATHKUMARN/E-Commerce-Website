using System.Security.Claims;
using FeatureObject.Abstraction.Contracts.Coupons;
using FeatureObject.Abstraction.Services.Coupons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/coupons")]
public sealed class CouponsController : ControllerBase
{
    private readonly ICouponsFeature _coupons;

    public CouponsController(ICouponsFeature coupons)
    {
        _coupons = coupons;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<AvailableCouponDto>>> GetAvailable()
    {
        var items = await _coupons.GetAvailableAsync();
        return Ok(items);
    }

    [HttpPost("preview")]
    [Authorize]
    public async Task<ActionResult<CouponPreviewResponse>> Preview([FromBody] CouponPreviewRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Missing user id claim.");

        var response = await _coupons.PreviewAsync(userId, req);
        return Ok(response);
    }
}