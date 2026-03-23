using Datastore.Abstraction.Models.Coupons;

namespace FeatureObject.Implementation.Coupons;

public static class CouponPricing
{
    public static void ValidateCouponOrThrow(
        CouponRow coupon,
        decimal subtotal,
        DateTime utcNow,
        int usesTotal,
        int usesByUser)
    {
        if (!coupon.IsActive)
            throw new InvalidOperationException("Coupon is inactive.");

        if (coupon.ExpiresAtUtc.HasValue && coupon.ExpiresAtUtc.Value <= utcNow)
            throw new InvalidOperationException("Coupon is expired.");

        if (coupon.MinSubtotal.HasValue && subtotal < coupon.MinSubtotal.Value)
            throw new InvalidOperationException($"Minimum order subtotal is {coupon.MinSubtotal.Value:0.00}.");

        if (coupon.UsageLimitTotal.HasValue && usesTotal >= coupon.UsageLimitTotal.Value)
            throw new InvalidOperationException("Coupon usage limit reached.");

        if (coupon.UsageLimitPerUser.HasValue && usesByUser >= coupon.UsageLimitPerUser.Value)
            throw new InvalidOperationException("You already used this coupon.");
    }

    public static decimal CalculateDiscount(decimal subtotal, CouponRow coupon)
    {
        if (subtotal <= 0) return 0m;

        decimal discount;

        if (coupon.DiscountType.Equals("Percent", StringComparison.OrdinalIgnoreCase))
        {
            discount = subtotal * (coupon.DiscountValue / 100m);

            if (coupon.MaxDiscount.HasValue)
                discount = Math.Min(discount, coupon.MaxDiscount.Value);
        }
        else if (coupon.DiscountType.Equals("Fixed", StringComparison.OrdinalIgnoreCase))
        {
            discount = coupon.DiscountValue;
        }
        else
        {
            throw new InvalidOperationException("Invalid coupon discount type.");
        }

        discount = Math.Min(discount, subtotal);
        discount = Math.Max(discount, 0m);

        return decimal.Round(discount, 2, MidpointRounding.AwayFromZero);
    }
}