namespace FeatureObject.Abstraction.Contracts.Orders;

public sealed record AdminOrderDto(int Id, int UserId, string Status, decimal TotalAmount, DateTime CreatedAt);