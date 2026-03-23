using Datastore.Abstraction.Repositories.Coupons;
using FeatureObject.Implementation.Coupons;
using Xunit;

public class CouponPricingTests
{
    [Fact]
    public void PercentCoupon_DiscountIsCapped()
    {
        var c = new CouponRow(
            Id: 1, Code: "WELCOME10", IsActive: true, ExpiresAtUtc: null, MinSubtotal: 0,
            DiscountType: "Percent", DiscountValue: 10m, MaxDiscount: 50m,
            UsageLimitTotal: null, UsageLimitPerUser: null
        );

        var discount = CouponPricing.CalculateDiscount(1000m, c);
        Assert.Equal(50m, discount);
    }

    [Fact]
    public void FixedCoupon_DiscountCannotExceedSubtotal()
    {
        var c = new CouponRow(
            1, "FLAT1000", true, null, 0,
            "Fixed", 1000m, null,
            null, null
        );

        var discount = CouponPricing.CalculateDiscount(120m, c);
        Assert.Equal(120m, discount);
    }

    [Fact]
    public void ExpiredCoupon_Throws()
    {
        var c = new CouponRow(
            1, "EXPIRED", true, DateTime.UtcNow.AddMinutes(-1), 0,
            "Percent", 10m, null,
            null, null
        );

        Assert.Throws<InvalidOperationException>(() =>
            CouponPricing.ValidateCouponOrThrow(c, 100m, DateTime.UtcNow, usesTotal: 0, usesByUser: 0)
        );
    }
}