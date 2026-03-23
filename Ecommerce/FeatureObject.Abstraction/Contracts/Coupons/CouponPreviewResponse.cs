namespace FeatureObject.Abstraction.Contracts.Coupons;

public sealed record CouponPreviewResponse(
    bool IsValid,
    string? Code,
    string Message,
    decimal Subtotal,
    decimal Discount
);