namespace FeatureObject.Abstraction.Contracts.Coupons;

public sealed record AdminCouponDto(
    int Id,
    string Code,
    bool IsActive,
    DateTime? ExpiresAtUtc,
    decimal? MinSubtotal,
    string DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscount,
    int? UsageLimitTotal,
    int? UsageLimitPerUser,
    DateTime CreatedAtUtc
);