using Datastore.Abstraction.Models.Catalog;

namespace Datastore.Abstraction.Repositories.Catalog;

public interface IProductRepository
{
    Task<(IReadOnlyList<ProductRow> Items, int TotalCount)> ListAsync(
        string? search,
        int? categoryId,
        string? sort,
        int page,
        int pageSize);

    Task<ProductRow?> GetByIdAsync(int id);
    Task<string?> GetCategoryNameAsync(int categoryId);

    Task<int> AdminCreateAsync(ProductRow row);
    Task<bool> AdminUpdateAsync(ProductRow row);
    Task<bool> AdminDeleteAsync(int id);
    Task<bool> UpdateStockAsync(int productId, int newStock);


    Task UpdateProductImageAsync(int productId, string imageUrl);
    Task<IReadOnlyList<ProductRow>> GetBestSellingAsync(int top);
}