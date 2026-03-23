namespace FeatureObject.Abstraction.Contracts.Catalog;

public record AdminUpsertProductRequest(
    string Name,
    string? Description,
    int CategoryId,
    decimal Price,
    int StockQty,
    string? ImageUrl
);