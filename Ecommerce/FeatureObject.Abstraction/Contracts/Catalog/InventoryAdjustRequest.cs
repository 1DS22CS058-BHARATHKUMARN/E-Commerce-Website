namespace FeatureObject.Abstraction.Contracts.Catalog;
public record InventoryAdjustRequest(int ProductId, int Delta, string? Reason);