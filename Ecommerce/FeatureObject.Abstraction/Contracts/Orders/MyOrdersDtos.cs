namespace FeatureObject.Abstraction.Contracts.Orders;

public sealed record MyOrderDto(int Id, string Status, decimal TotalAmount, DateTime CreatedAt);

public sealed record MyOrderItemDto(int ProductId, string ProductName, decimal UnitPrice, int Qty, decimal LineTotal);

public sealed record MyOrderDetailsDto(
    int Id,
    string Status,
    decimal TotalAmount,      // grand total
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal ShippingTotal,
    string? CouponCode,
    DateTime CreatedAt,
    List<MyOrderItemDto> Items
);


public sealed record CreateCategoryRequest(string Name);