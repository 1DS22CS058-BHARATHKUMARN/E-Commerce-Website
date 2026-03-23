namespace FeatureObject.Abstraction.Contracts.Orders;

public sealed class CheckoutPaymentResponse
{
    public string Status { get; set; } = "";
    public string MaskedCardNumber { get; set; } = "";
}