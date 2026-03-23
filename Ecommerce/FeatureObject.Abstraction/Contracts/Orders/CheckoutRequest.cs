namespace FeatureObject.Abstraction.Contracts.Orders;

public sealed class CheckoutRequest
{
    public List<CheckoutItemRequest> Items { get; set; } = new();
    public string? CouponCode { get; set; }
    public CheckoutAddressRequest Address { get; set; } = new();
    public CheckoutPaymentRequest Payment { get; set; } = new();
}

public sealed class CheckoutItemRequest
{
    public int ProductId { get; set; }
    public int Qty { get; set; }
}