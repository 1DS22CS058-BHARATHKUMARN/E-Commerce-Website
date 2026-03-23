using FeatureObject.Abstraction.Contracts.Coupons;
using FeatureObject.Abstraction.Services.Coupons;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/admin/coupons")]
[Authorize(Roles = "Admin")]
public sealed class AdminCouponsController : ControllerBase
{
    private readonly IAdminCouponsFeature _coupons;

    public AdminCouponsController(IAdminCouponsFeature coupons)
    {
        _coupons = coupons;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminCouponDto>>> GetAll()
        => Ok(await _coupons.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AdminCouponDto>> GetById(int id)
    {
        var coupon = await _coupons.GetByIdAsync(id);
        return coupon is null ? NotFound() : Ok(coupon);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminUpsertCouponRequest req)
    {
        var id = await _coupons.CreateAsync(req);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminUpsertCouponRequest req)//extract data from HTTP request
    {
        await _coupons.UpdateAsync(id, req);
        return NoContent();
    }
}