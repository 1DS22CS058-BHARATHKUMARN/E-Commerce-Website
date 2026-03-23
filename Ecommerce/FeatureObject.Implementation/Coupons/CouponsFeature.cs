using Datastore.Abstraction.Repositories.Coupons;
using FeatureObject.Abstraction.Contracts.Coupons;
using FeatureObject.Abstraction.Services.Coupons;

namespace FeatureObject.Implementation.Coupons;

public sealed class CouponsFeature : ICouponsFeature
{
    private readonly ICouponRepository _coupons;

    public CouponsFeature(ICouponRepository coupons)
    {
        _coupons = coupons;
    }

    public async Task<IReadOnlyList<AvailableCouponDto>> GetAvailableAsync()
    {
        var rows = await _coupons.GetAvailableAsync(DateTime.UtcNow);

        return rows
            .Select(x => new AvailableCouponDto(
                x.Code,
                BuildDescription(x),
                x.MinSubtotal,
                x.DiscountType,
                x.DiscountValue,
                x.MaxDiscount,
                x.ExpiresAtUtc
            ))
            .ToList();
    }

    public async Task<CouponPreviewResponse> PreviewAsync(int userId, CouponPreviewRequest request)
    {
        if (userId <= 0)
            throw new InvalidOperationException("Invalid user.");

        var code = NormalizeCode(request.Code);
        var subtotal = request.Subtotal;

        if (string.IsNullOrWhiteSpace(code))
            return new CouponPreviewResponse(false, null, "Enter a coupon code.", subtotal, 0m);

        if (subtotal < 0)
            throw new InvalidOperationException("Subtotal cannot be negative.");

        var coupon = await _coupons.GetByCodeAsync(code);
        if (coupon is null)
            return new CouponPreviewResponse(false, code, "Invalid coupon code.", subtotal, 0m);

        var usesTotal = await _coupons.CountUsesTotalAsync(code);
        var usesByUser = await _coupons.CountUsesByUserAsync(code, userId);

        if (code.Equals("WELCOME10", StringComparison.OrdinalIgnoreCase))
        {
            var priorOrders = await _coupons.CountSuccessfulOrdersByUserAsync(userId);

            if (priorOrders > 0)
            {
                return new CouponPreviewResponse(
                    false,
                    code,
                    "WELCOME10 is only for first-time customers (first order only).",
                    subtotal,
                    0m
                );
            }
        }

        try
        {
            CouponPricing.ValidateCouponOrThrow(coupon, subtotal, DateTime.UtcNow, usesTotal, usesByUser);

            var discount = CouponPricing.CalculateDiscount(subtotal, coupon);

            return new CouponPreviewResponse(
                true,
                code,
                $"Coupon {code} applied: -{discount:0.00}",
                subtotal,
                discount
            );
        }
        catch (Exception ex)
        {
            var msg = ex.Message;

            if (coupon.MinSubtotal.HasValue && subtotal < coupon.MinSubtotal.Value)
            {
                var missing = coupon.MinSubtotal.Value - subtotal;
                msg = $"Spend {missing:0.00} more to use {code} (min subtotal {coupon.MinSubtotal.Value:0.00}).";
            }

            return new CouponPreviewResponse(false, code, msg, subtotal, 0m);
        }
    }

    private static string? NormalizeCode(string? code)
        => string.IsNullOrWhiteSpace(code) ? null : code.Trim().ToUpperInvariant();

    private static string BuildDescription(Datastore.Abstraction.Models.Coupons.CouponRow coupon)
    {
        var discountText = coupon.DiscountType.Equals("Percent", StringComparison.OrdinalIgnoreCase)
            ? $"{coupon.DiscountValue:0.##}% off"
            : $"{coupon.DiscountValue:0.##} off";

        var parts = new List<string> { discountText };

        if (coupon.MinSubtotal.HasValue)
            parts.Add($"on orders above {coupon.MinSubtotal.Value:0.##}");

        if (coupon.MaxDiscount.HasValue && coupon.DiscountType.Equals("Percent", StringComparison.OrdinalIgnoreCase))
            parts.Add($"max discount {coupon.MaxDiscount.Value:0.##}");

        //if (coupon.Code.Equals("WELCOME10", StringComparison.OrdinalIgnoreCase))
        //    parts.Add("first-time customers only");

        return string.Join(", ", parts);
    }
}