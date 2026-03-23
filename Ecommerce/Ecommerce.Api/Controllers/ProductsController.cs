using FeatureObject.Abstraction.Services.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController : ControllerBase
{
    private readonly ICatalogFeature _catalog;
    public ProductsController(ICatalogFeature catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] string? sort,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var result = await _catalog.ListProductsAsync(search, categoryId, sort, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await _catalog.GetProductAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("best-sellers")]
    public async Task<IActionResult> GetBestSellers([FromQuery] int top = 5)
    {
        var result = await _catalog.GetBestSellingProductsAsync(top);
        return Ok(result);
    }
}