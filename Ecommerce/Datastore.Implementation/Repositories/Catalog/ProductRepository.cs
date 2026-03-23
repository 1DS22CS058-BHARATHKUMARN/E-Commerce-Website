using Dapper;
using Datastore.Abstraction.Models.Catalog;
using Datastore.Abstraction.Repositories;
using Datastore.Abstraction.Repositories.Catalog;
using Datastore.Implementation.Data;


namespace Datastore.Implementation.Repositories.Catalog;

public sealed class ProductRepository : IProductRepository
{
    private readonly IDbConnectionFactory _db;
    public ProductRepository(IDbConnectionFactory db) => _db = db;

    public async Task<(IReadOnlyList<ProductRow> Items, int TotalCount)> ListAsync(
        string? search,
        int? categoryId,
        string? sort,
        int page,
        int pageSize)
    {
        using var conn = _db.Create();

        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 12 : (pageSize > 100 ? 100 : pageSize);
        var offset = (page - 1) * pageSize;

        var where = new List<string>();
        var p = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(search))
        {
            where.Add("(p.Name LIKE @q OR p.Description LIKE @q)");
            p.Add("q", $"%{search.Trim()}%");
        }

        if (categoryId is not null)
        {
            where.Add("p.CategoryId = @categoryId");
            p.Add("categoryId", categoryId.Value);
        }

        var whereSql = where.Count == 0 ? "" : "WHERE " + string.Join(" AND ", where);

        var orderBy = sort switch
        {
            "priceAsc" => "p.Price ASC",
            "priceDesc" => "p.Price DESC",
            "nameAsc" => "p.Name ASC",
            "newest" => "p.CreatedAt DESC",
            _ => "p.Id DESC"
        };

        p.Add("offset", offset);
        p.Add("pageSize", pageSize);

        var countSql = $"""
            SELECT COUNT(*)
            FROM dbo.Products p
            {whereSql};
        """;

        var listSql = $"""
            SELECT
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.CategoryId,
                p.StockQty,
                p.ImageUrl,
                p.CreatedAt
            FROM dbo.Products p
            {whereSql}
            ORDER BY {orderBy}
            OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
        """;

        var total = await conn.ExecuteScalarAsync<int>(countSql, p);
        var items = (await conn.QueryAsync<ProductRow>(listSql, p)).ToList();

        return (items, total);
    }
    public async Task<IReadOnlyList<ProductRow>> GetBestSellingAsync(int top)
    {
        const string sql = @"
        SELECT TOP (@Top)
            p.Id,
            p.Name,
            p.Description,
            p.Price,
            p.CategoryId,
            p.StockQty,
            p.ImageUrl
        FROM Products p
        INNER JOIN OrderItems oi ON oi.ProductId = p.Id
        GROUP BY
            p.Id,
            p.Name,
            p.Description,
            p.Price,
            p.CategoryId,
            p.StockQty,
            p.ImageUrl
        ORDER BY SUM(oi.Qty) DESC, p.Id DESC;";

        using var connection = _db.Create();
        var items = await connection.QueryAsync<ProductRow>(sql, new { Top = top });
        return items.ToList();
    }

    public async Task<ProductRow?> GetByIdAsync(int id)
    {
        using var conn = _db.Create();

        var sql = """
            SELECT
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.CategoryId,
                p.StockQty,
                p.ImageUrl,
                p.CreatedAt
            FROM dbo.Products p
            WHERE p.Id = @id;
        """;

        return await conn.QuerySingleOrDefaultAsync<ProductRow>(sql, new { id });
    }

    public async Task<string?> GetCategoryNameAsync(int categoryId)
    {
        using var conn = _db.Create();

        var sql = """
            SELECT Name
            FROM dbo.Categories
            WHERE Id = @categoryId;
        """;

        return await conn.ExecuteScalarAsync<string?>(sql, new { categoryId });
    }

    public async Task<int> AdminCreateAsync(ProductRow row)
    {
        const string sql = @"
INSERT INTO Products (CategoryId, Name, Description, Price, StockQty, ImageUrl, CreatedAt)
VALUES (@CategoryId, @Name, @Description, @Price, @StockQty, @ImageUrl, @CreatedAt);
SELECT CAST(SCOPE_IDENTITY() as int);
";
        using var conn = _db.Create();
        return await conn.ExecuteScalarAsync<int>(sql, row);
    }

    public async Task<bool> AdminUpdateAsync(ProductRow row)
    {
        const string sql = @"
UPDATE Products
SET CategoryId = @CategoryId,
    Name = @Name,
    Description = @Description,
    Price = @Price,
    StockQty = @StockQty,
    ImageUrl = @ImageUrl
WHERE Id = @Id;
";
        using var conn = _db.Create();
        var affected = await conn.ExecuteAsync(sql, row);
        return affected == 1;
    }



    public async Task<bool> AdminDeleteAsync(int id)
    {
        const string sql = @"DELETE FROM Products WHERE Id = @id;";
        using var conn = _db.Create();
        var affected = await conn.ExecuteAsync(sql, new { id });
        return affected == 1;
    }

    public async Task<bool> UpdateStockAsync(int productId, int newStock)
    {
        const string sql = @"UPDATE Products SET StockQty = @newStock WHERE Id = @productId;";
        using var conn = _db.Create();
        var affected = await conn.ExecuteAsync(sql, new { productId, newStock });
        return affected == 1;
    }
    public async Task UpdateProductImageAsync(int productId, string imageUrl)
    {
        using var conn = _db.Create();
        await conn.ExecuteAsync(
            "UPDATE dbo.Products SET ImageUrl = @ImageUrl WHERE Id = @Id",
            new { ImageUrl = imageUrl, Id = productId });
    }
}

//ProductRepository
//    ├── ListAsync()           → Browsing/search page(paginated, filtered, sorted)
//    ├── GetBestSellingAsync() → Homepage "best sellers" widget
//    ├── GetByIdAsync()        → Product detail page
//    ├── GetCategoryNameAsync()→ Display category label on a product
//    ├── AdminCreateAsync()    → Admin: add new product
//    ├── AdminUpdateAsync()    → Admin: edit product details
//    ├── AdminDeleteAsync()    → Admin: remove product
//    └── UpdateStockAsync()    → Order processing: adjust stock after purchase