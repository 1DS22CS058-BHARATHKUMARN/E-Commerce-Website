using Datastore.Abstraction.Models.Coupons;
using Datastore.Abstraction.Repositories.Coupons;
using FeatureObject.Abstraction.Contracts.Coupons;
using FeatureObject.Abstraction.Services.Coupons;

namespace FeatureObject.Implementation.Coupons;

public sealed class AdminCouponsFeature : IAdminCouponsFeature
{
    private readonly ICouponRepository _coupons;

    public AdminCouponsFeature(ICouponRepository coupons)
    {
        _coupons = coupons;
    }

    public async Task<IReadOnlyList<AdminCouponDto>> GetAllAsync()
    {
        var rows = await _coupons.GetAllAsync();

        return rows.Select(Map).ToList();
    }

    public async Task<AdminCouponDto?> GetByIdAsync(int id)
    {
        var row = await _coupons.GetByIdAsync(id);
        return row is null ? null : Map(row);
    }

    public async Task<int> CreateAsync(AdminUpsertCouponRequest request)
    {
        ValidateRequest(request);

        var code = NormalizeCode(request.Code)!;

        var existing = await _coupons.GetByCodeAsync(code);
        if (existing is not null)
            throw new InvalidOperationException("Coupon code already exists.");

        var row = new CouponRow
        {
            Code = code,
            IsActive = request.IsActive,
            ExpiresAtUtc = request.ExpiresAtUtc,
            MinSubtotal = request.MinSubtotal,
            DiscountType = NormalizeDiscountType(request.DiscountType),
            DiscountValue = request.DiscountValue,
            MaxDiscount = request.MaxDiscount,
            UsageLimitTotal = request.UsageLimitTotal,
            UsageLimitPerUser = request.UsageLimitPerUser,
            CreatedAtUtc = DateTime.UtcNow
        };

        return await _coupons.AdminCreateAsync(row);
    }

    public async Task UpdateAsync(int id, AdminUpsertCouponRequest request)
    {
        if (id <= 0)
            throw new InvalidOperationException("Invalid coupon id.");

        ValidateRequest(request);

        var existing = await _coupons.GetByIdAsync(id);
        if (existing is null)
            throw new KeyNotFoundException("Coupon not found.");

        var code = NormalizeCode(request.Code)!;

        var sameCode = await _coupons.GetByCodeAsync(code);
        if (sameCode is not null && sameCode.Id != id)
            throw new InvalidOperationException("Coupon code already exists.");

        existing.Code = code;
        existing.IsActive = request.IsActive;
        existing.ExpiresAtUtc = request.ExpiresAtUtc;
        existing.MinSubtotal = request.MinSubtotal;
        existing.DiscountType = NormalizeDiscountType(request.DiscountType);
        existing.DiscountValue = request.DiscountValue;
        existing.MaxDiscount = request.MaxDiscount;
        existing.UsageLimitTotal = request.UsageLimitTotal;
        existing.UsageLimitPerUser = request.UsageLimitPerUser;

        var ok = await _coupons.AdminUpdateAsync(existing);
        if (!ok)
            throw new InvalidOperationException("Update failed.");
    }

    private static AdminCouponDto Map(CouponRow x)
        => new(
            x.Id,
            x.Code,
            x.IsActive,
            x.ExpiresAtUtc,
            x.MinSubtotal,
            x.DiscountType,
            x.DiscountValue,
            x.MaxDiscount,
            x.UsageLimitTotal,
            x.UsageLimitPerUser,
            x.CreatedAtUtc
        );

    private static void ValidateRequest(AdminUpsertCouponRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            throw new InvalidOperationException("Coupon code is required.");

        if (request.Code.Trim().Length > 50)
            throw new InvalidOperationException("Coupon code is too long.");

        if (request.MinSubtotal.HasValue && request.MinSubtotal.Value < 0)
            throw new InvalidOperationException("Min subtotal cannot be negative.");

        if (request.DiscountValue <= 0)
            throw new InvalidOperationException("Discount value must be greater than 0.");

        var discountType = NormalizeDiscountType(request.DiscountType);

        if (discountType == "Percent" && request.DiscountValue > 100)
            throw new InvalidOperationException("Percent discount cannot exceed 100.");

        if (request.MaxDiscount.HasValue && request.MaxDiscount.Value < 0)
            throw new InvalidOperationException("Max discount cannot be negative.");

        if (request.UsageLimitTotal.HasValue && request.UsageLimitTotal.Value <= 0)
            throw new InvalidOperationException("UsageLimitTotal must be greater than 0.");

        if (request.UsageLimitPerUser.HasValue && request.UsageLimitPerUser.Value <= 0)
            throw new InvalidOperationException("UsageLimitPerUser must be greater than 0.");
    }

    private static string? NormalizeCode(string? code)
        => string.IsNullOrWhiteSpace(code) ? null : code.Trim().ToUpperInvariant();

    private static string NormalizeDiscountType(string? discountType)
    {
        if (string.Equals(discountType, "Percent", StringComparison.OrdinalIgnoreCase))
            return "Percent";

        if (string.Equals(discountType, "Fixed", StringComparison.OrdinalIgnoreCase))
            return "Fixed";

        throw new InvalidOperationException("DiscountType must be Percent or Fixed.");
    }
}