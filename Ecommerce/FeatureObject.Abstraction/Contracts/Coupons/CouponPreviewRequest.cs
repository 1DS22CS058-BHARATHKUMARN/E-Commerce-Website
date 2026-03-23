namespace FeatureObject.Abstraction.Contracts.Coupons;

public sealed record CouponPreviewRequest(
    string? Code,
    decimal Subtotal
);