namespace FeatureObject.Abstraction.Contracts.Catalog;

public sealed record ProductListItemDto(
    int Id,
    string Name,
    decimal Price,
    int CategoryId,
    string CategoryName,
    int StockQty,
    string? ImageUrl
);

public sealed record ProductDetailDto(
    int Id,
    string Name,
    string? Description,
    decimal Price,
    int CategoryId,
    string CategoryName,
    int StockQty,
    string? ImageUrl
);

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount
);

