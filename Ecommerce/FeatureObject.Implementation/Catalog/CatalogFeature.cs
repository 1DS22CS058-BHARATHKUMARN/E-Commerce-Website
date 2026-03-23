using Datastore.Abstraction.Models.Catalog;
using Datastore.Abstraction.Repositories.Catalog;
using FeatureObject.Abstraction.Contracts.Catalog;
using FeatureObject.Abstraction.Contracts.Orders;
using FeatureObject.Abstraction.Services.Catalog;


namespace FeatureObject.Implementation.Catalog;

public sealed class CatalogFeature : ICatalogFeature
{
    private readonly ICategoryRepository _categories;
    private readonly IProductRepository _products;

    public CatalogFeature(ICategoryRepository categories, IProductRepository products)
    {
        _categories = categories;
        _products = products;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync()
    {
        var rows = await _categories.GetAllAsync();
        return rows.Select(x => new CategoryDto(x.Id, x.Name)).ToList();
    }

    public async Task<int> CreateCategoryAsync(CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Category name is required.");

        var name = request.Name.Trim();

        return await _categories.CreateAsync(name);
    }

    public async Task<PagedResult<ProductListItemDto>> ListProductsAsync(
        string? search, int? categoryId, string? sort, int page, int pageSize)
    {
        var result = await _products.ListAsync(search, categoryId, sort, page, pageSize);

        var items = result.Items;
        var total = result.TotalCount;

        var dtos = new List<ProductListItemDto>(items.Count);
            
        foreach (var p in items)
        {
            var catName = await _products.GetCategoryNameAsync(p.CategoryId) ?? "Unknown";

            dtos.Add(new ProductListItemDto(
                p.Id,
                p.Name,
                p.Price,
                p.CategoryId,
                catName,
                p.StockQty,
                p.ImageUrl
            ));
        }

        return new PagedResult<ProductListItemDto>(dtos, page, pageSize, total);
    }

    public async Task<ProductDetailDto?> GetProductAsync(int id)
    {
        var p = await _products.GetByIdAsync(id);
        if (p is null) return null;

        var catName = await _products.GetCategoryNameAsync(p.CategoryId) ?? "Unknown";

        return new ProductDetailDto(
            p.Id,
            p.Name,
            p.Description,
            p.Price,
            p.CategoryId,
            catName,
            p.StockQty,
            p.ImageUrl
        );
    }

    public async Task<int> AdminCreateProductAsync(AdminUpsertProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            throw new Exception("Product name is required");

        var row = new ProductRow
        {
            Name = req.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            CategoryId = req.CategoryId,
            Price = req.Price,
            StockQty = req.StockQty,
            ImageUrl = string.IsNullOrWhiteSpace(req.ImageUrl) ? null : req.ImageUrl.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        if (row.StockQty < 0) throw new Exception("Stock cannot be negative");
        if (row.Price < 0) throw new Exception("Price cannot be negative");

        return await _products.AdminCreateAsync(row);
    }

    public async Task AdminUpdateProductAsync(int id, AdminUpsertProductRequest req)
    {
        var existing = await _products.GetByIdAsync(id);
        if (existing is null) throw new Exception("Product not found");

        if (string.IsNullOrWhiteSpace(req.Name))
            throw new Exception("Product name is required");

        existing.Name = req.Name.Trim();
        existing.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        existing.CategoryId = req.CategoryId;
        existing.Price = req.Price;
        existing.StockQty = req.StockQty;
        existing.ImageUrl = string.IsNullOrWhiteSpace(req.ImageUrl) ? null : req.ImageUrl.Trim();

        if (existing.StockQty < 0) throw new Exception("Stock cannot be negative");
        if (existing.Price < 0) throw new Exception("Price cannot be negative");

        var ok = await _products.AdminUpdateAsync(existing);
        if (!ok) throw new Exception("Update failed");
    }

    public async Task AdminDeleteProductAsync(int id)
    {
        var ok = await _products.AdminDeleteAsync(id);
        if (!ok) throw new Exception("Delete failed");
    }

    public async Task<int> AdminAdjustStockAsync(int productId, int delta, string? reason)
    {
        var p = await _products.GetByIdAsync(productId);
        if (p is null) throw new Exception("Product not found");

        var newStock = p.StockQty + delta;
        if (newStock < 0) throw new Exception("Stock cannot be negative");

        var ok = await _products.UpdateStockAsync(productId, newStock);
        if (!ok) throw new Exception("Stock update failed");

        return newStock;
    }
    public async Task AdminUpdateProductImageAsync(int productId, string imageUrl)
    {
        await _products.UpdateProductImageAsync(productId, imageUrl);
    }
    public async Task<IReadOnlyList<ProductListItemDto>> GetBestSellingProductsAsync(int top)
    {
        var rows = await _products.GetBestSellingAsync(top);

        var items = new List<ProductListItemDto>();

        foreach (var x in rows)
        {
            var categoryName = await _products.GetCategoryNameAsync(x.CategoryId) ?? "Unknown";

            items.Add(new ProductListItemDto(
                x.Id,
                x.Name,
                x.Price,
                x.CategoryId,
                categoryName,
                x.StockQty,
                x.ImageUrl
            ));
        }

        return items;
    }
}
//CatalogFeature(business logic layer)
//    ├── GetCategoriesAsync()           → list all categories
//    ├── CreateCategoryAsync()          → validate + create category
//    ├── ListProductsAsync()            → paginated product browsing 
//    ├── GetProductAsync()              → single product detail
//    ├── AdminCreateProductAsync()      → validate + insert product
//    ├── AdminUpdateProductAsync()      → fetch + mutate + update product
//    ├── AdminDeleteProductAsync()      → delete with existence check
//    ├── AdminAdjustStockAsync()        → delta-based stock adjustment
//    └── GetBestSellingProductsAsync()  → top N by units sold 