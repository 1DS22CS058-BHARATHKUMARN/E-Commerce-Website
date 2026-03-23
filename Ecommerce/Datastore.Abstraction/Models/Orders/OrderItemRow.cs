namespace Datastore.Abstraction.Models.Orders;

public sealed class OrderItemRow
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public decimal UnitPrice { get; set; }
    public int Qty { get; set; }
    public decimal LineTotal { get; set; }
}