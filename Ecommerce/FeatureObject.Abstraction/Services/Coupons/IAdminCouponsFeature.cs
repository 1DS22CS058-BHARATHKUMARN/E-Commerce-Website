using FeatureObject.Abstraction.Contracts.Coupons;

namespace FeatureObject.Abstraction.Services.Coupons;

public interface IAdminCouponsFeature
{
    Task<IReadOnlyList<AdminCouponDto>> GetAllAsync();
    Task<AdminCouponDto?> GetByIdAsync(int id);
    Task<int> CreateAsync(AdminUpsertCouponRequest request);
    Task UpdateAsync(int id, AdminUpsertCouponRequest request);
}