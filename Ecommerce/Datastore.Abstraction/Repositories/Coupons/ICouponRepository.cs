using Datastore.Abstraction.Models.Coupons;

namespace Datastore.Abstraction.Repositories.Coupons;

public interface ICouponRepository
{
    Task<CouponRow?> GetByCodeAsync(string code);
    Task<CouponRow?> GetByIdAsync(int id);
    Task<IReadOnlyList<CouponRow>> GetAllAsync();

    Task<int> CountUsesTotalAsync(string code);
    Task<int> CountUsesByUserAsync(string code, int userId);
    Task<int> CountSuccessfulOrdersByUserAsync(int userId);

    Task<int> AdminCreateAsync(CouponRow row);
    Task<bool> AdminUpdateAsync(CouponRow row);
    Task<IReadOnlyList<CouponRow>> GetAvailableAsync(DateTime utcNow);
}