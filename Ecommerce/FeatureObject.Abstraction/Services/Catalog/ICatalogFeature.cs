using FeatureObject.Abstraction.Contracts.Catalog;
using FeatureObject.Abstraction.Contracts.Orders;

namespace FeatureObject.Abstraction.Services.Catalog;

public interface ICatalogFeature
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync();

    Task<PagedResult<ProductListItemDto>> ListProductsAsync(
        string? search,
        int? categoryId,
        string? sort,
        int page,
        int pageSize);

    Task<ProductDetailDto?> GetProductAsync(int id);

    Task<IReadOnlyList<ProductListItemDto>> GetBestSellingProductsAsync(int top);

    Task<int> AdminCreateProductAsync(AdminUpsertProductRequest req);
    Task AdminUpdateProductAsync(int id, AdminUpsertProductRequest req);
    Task AdminDeleteProductAsync(int id);
    Task<int> AdminAdjustStockAsync(int productId, int delta, string? reason);

    Task<int> CreateCategoryAsync(CreateCategoryRequest request);
    Task AdminUpdateProductImageAsync(int productId, string imageUrl);
}