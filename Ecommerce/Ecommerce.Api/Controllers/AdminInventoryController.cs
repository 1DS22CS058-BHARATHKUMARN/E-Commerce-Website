using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FeatureObject.Abstraction.Services.Catalog;
using FeatureObject.Abstraction.Contracts.Catalog; 


namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/admin/inventory")]
[Authorize(Roles = "Admin")]
public class AdminInventoryController : ControllerBase
{
    private readonly ICatalogFeature _catalog;

    public AdminInventoryController(ICatalogFeature catalog)
    {
        _catalog = catalog;
    }

    [HttpPost("adjust")]
    public async Task<IActionResult> Adjust([FromBody] InventoryAdjustRequest req)
    {
        var newStock = await _catalog.AdminAdjustStockAsync(req.ProductId, req.Delta, req.Reason);
        return Ok(new { productId = req.ProductId, stockQuantity = newStock });
    }
}

