namespace Datastore.Abstraction.Models.Catalog;

public sealed class ProductRow
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public int StockQty { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? CreatedAt { get; set; }

    public int TotalSold { get; set; }

}