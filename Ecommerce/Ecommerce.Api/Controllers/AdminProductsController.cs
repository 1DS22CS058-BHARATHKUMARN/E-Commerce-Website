using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FeatureObject.Abstraction.Services.Catalog;
using FeatureObject.Abstraction.Services;
using FeatureObject.Abstraction.Contracts.Catalog;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin")]
public class AdminProductsController : ControllerBase
{
    private readonly ICatalogFeature _catalog;
    private readonly IFileStorageService _fileStorage;

    public AdminProductsController(ICatalogFeature catalog, IFileStorageService fileStorage)
    {
        _catalog = catalog;
        _fileStorage = fileStorage;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminUpsertProductRequest req)
    {
        var id = await _catalog.AdminCreateProductAsync(req);
        return Ok(new { id });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminUpsertProductRequest req)
    {
        await _catalog.AdminUpdateProductAsync(id, req);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _catalog.AdminDeleteProductAsync(id);
        return NoContent();
    }
    [HttpPost("{id:int}/upload-image")]
    public async Task<IActionResult> UploadImage(int id, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest("Image file is required.");

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest("File too large. Max allowed size is 10 MB.");

        await using var stream = file.OpenReadStream();
        var imageUrl = await _fileStorage.SaveProductImageAsync(stream, file.FileName, cancellationToken);

        return Ok(new { productId = id, imageUrl });
    }
}