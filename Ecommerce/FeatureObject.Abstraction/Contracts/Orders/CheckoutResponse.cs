namespace FeatureObject.Abstraction.Contracts.Orders;

public sealed class CheckoutResponse
{
    public int OrderId { get; set; }
    public string Message { get; set; } = "";
    public decimal Total { get; set; }
    public CheckoutPaymentResponse Payment { get; set; } = new();

}
