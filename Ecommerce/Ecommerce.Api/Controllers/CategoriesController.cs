using FeatureObject.Abstraction.Contracts.Catalog;
using FeatureObject.Abstraction.Contracts.Orders;
using FeatureObject.Abstraction.Services.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly ICatalogFeature _catalog;
    public CategoriesController(ICatalogFeature catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _catalog.GetCategoriesAsync());

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var id = await _catalog.CreateCategoryAsync(request);
        return Ok(new { id, message = "Category created successfully." });
    }
}