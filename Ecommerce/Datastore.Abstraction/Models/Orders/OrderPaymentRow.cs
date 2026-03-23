namespace Datastore.Abstraction.Models.Orders;

public sealed class OrderPaymentRow
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string CardHolderName { get; set; } = "";
    public string MaskedCardNumber { get; set; } = "";
    public string Expiry { get; set; } = "";
    public decimal Amount { get; set; }
    public string Status { get; set; } = "";
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}