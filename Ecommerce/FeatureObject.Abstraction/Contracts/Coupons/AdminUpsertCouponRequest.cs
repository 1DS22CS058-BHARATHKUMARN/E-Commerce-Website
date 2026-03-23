namespace FeatureObject.Abstraction.Contracts.Coupons;

public sealed record AdminUpsertCouponRequest(
    string Code,
    bool IsActive,
    DateTime? ExpiresAtUtc,
    decimal? MinSubtotal,
    string DiscountType,
    decimal DiscountValue,
    decimal? MaxDiscount,
    int? UsageLimitTotal,
    int? UsageLimitPerUser
);