namespace Datastore.Abstraction.Models.Coupons;

public sealed class CouponRow
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public decimal? MinSubtotal { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscount { get; set; }
    public int? UsageLimitTotal { get; set; }
    public int? UsageLimitPerUser { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}