using FeatureObject.Abstraction.Contracts.Orders;
using FeatureObject.Abstraction.Services.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/orders")]
public sealed class OrdersController : ControllerBase
{
    private readonly IOrdersFeature _orders;

    public OrdersController(IOrdersFeature orders)
    {
        _orders = orders;
    }

    [HttpPost("checkout")]
    [Authorize]
    public async Task<ActionResult<CheckoutResponse>> Checkout([FromBody] CheckoutRequest req)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Missing user id claim.");

        var res = await _orders.CheckoutAsync(userId, req);
        return Ok(res);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<List<MyOrderDto>>> MyOrders()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Missing user id claim.");

        var rows = await _orders.GetMyOrdersAsync(userId);
        return Ok(rows);
    }

    [HttpGet("my/{orderId:int}")]
    [Authorize]
    public async Task<ActionResult<MyOrderDetailsDto>> MyOrderDetails(int orderId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Missing user id claim.");

        var order = await _orders.GetMyOrderDetailsAsync(userId, orderId);
        return order == null ? NotFound() : Ok(order);
    }

    [HttpPost("my/{orderId:int}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelMyOrder(int orderId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdStr) || !int.TryParse(userIdStr, out var userId))
            return Unauthorized("Missing user id claim.");

        await _orders.CancelMyOrderAsync(userId, orderId);
        return Ok(new { message = "Order cancelled successfully." });
    }
}