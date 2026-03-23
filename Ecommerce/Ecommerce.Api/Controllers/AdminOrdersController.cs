using FeatureObject.Abstraction.Contracts.Orders;
using FeatureObject.Abstraction.Services.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
public sealed class AdminOrdersController : ControllerBase
{
    private readonly IOrdersFeature _orders;

    public AdminOrdersController(IOrdersFeature orders)
    {
        _orders = orders;
    }

    [HttpGet]
    public async Task<ActionResult<List<AdminOrderDto>>> GetAll()
        => Ok(await _orders.GetAllOrdersAsync());

    [HttpPatch("{orderId:int}/status")]//updates one specific field
    public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] UpdateOrderStatusRequest req)
    {
        await _orders.UpdateOrderStatusAsync(orderId, req.Status);
        return NoContent();
    }
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDetails(int id)
    {
        var dto = await _orders.GetAdminOrderDetailsAsync(id);
        return dto is null ? NotFound() : Ok(dto);
    }
}