using FeatureObject.Abstraction.Contracts.Coupons;

namespace FeatureObject.Abstraction.Services.Coupons;

public interface ICouponsFeature
{
    Task<IReadOnlyList<AvailableCouponDto>> GetAvailableAsync();
    Task<CouponPreviewResponse> PreviewAsync(int userId, CouponPreviewRequest request);
   

}