namespace FeatureObject.Abstraction.Contracts.Orders;

public sealed class CheckoutPaymentRequest
{
    public string CardHolderName { get; set; } = "";
    public string CardNumber { get; set; } = "";
    public string Expiry { get; set; } = "";
    public string Cvv { get; set; } = "";
}