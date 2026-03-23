namespace FeatureObject.Abstraction.Contracts.Coupons;



public sealed record AvailableCouponDto(
    string Code,
    string Description,
    decimal? MinSubtotal,
    string DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscount,
    DateTime? ExpiresAtUtc
);