namespace Datastore.Abstraction.Models.Orders;

public sealed class OrderRow
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = "";
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
}
