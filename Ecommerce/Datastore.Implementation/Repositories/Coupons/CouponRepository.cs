using Dapper;
using Datastore.Abstraction.Models.Coupons;
using Datastore.Abstraction.Repositories;
using Datastore.Abstraction.Repositories.Coupons;

namespace Datastore.Implementation.Repositories.Coupons;

public sealed class CouponRepository : ICouponRepository
{
    private readonly IDbConnectionFactory _db;

    public CouponRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<CouponRow?> GetByCodeAsync(string code)
    {
        const string sql = @"
SELECT
    Id,
    Code,
    IsActive,
    ExpiresAtUtc,
    MinSubtotal,
    DiscountType,
    DiscountValue,
    MaxDiscount,
    UsageLimitTotal,
    UsageLimitPerUser,
    CreatedAtUtc
FROM dbo.Coupons
WHERE Code = @code;";

        using var conn = _db.Create();
        return await conn.QuerySingleOrDefaultAsync<CouponRow>(sql, new { code });
    }

    public async Task<CouponRow?> GetByIdAsync(int id)
    {
        const string sql = @"
SELECT
    Id,
    Code,
    IsActive,
    ExpiresAtUtc,
    MinSubtotal,
    DiscountType,
    DiscountValue,
    MaxDiscount,
    UsageLimitTotal,
    UsageLimitPerUser,
    CreatedAtUtc
FROM dbo.Coupons
WHERE Id = @id;";

        using var conn = _db.Create();
        return await conn.QuerySingleOrDefaultAsync<CouponRow>(sql, new { id });
    }

    public async Task<IReadOnlyList<CouponRow>> GetAllAsync()
    {
        const string sql = @"
SELECT
    Id,
    Code,
    IsActive,
    ExpiresAtUtc,
    MinSubtotal,
    DiscountType,
    DiscountValue,
    MaxDiscount,
    UsageLimitTotal,
    UsageLimitPerUser,
    CreatedAtUtc
FROM dbo.Coupons
ORDER BY Id DESC;";

        using var conn = _db.Create();
        var rows = await conn.QueryAsync<CouponRow>(sql);
        return rows.ToList();
    }

    public async Task<int> CountUsesTotalAsync(string code)
    {
        const string sql = @"
SELECT COUNT(*)
FROM dbo.Orders
WHERE CouponCode = @code
  AND Status IN ('Placed','Packed','Shipped','Delivered');";

        using var conn = _db.Create();
        return await conn.ExecuteScalarAsync<int>(sql, new { code });
    }

    public async Task<int> CountUsesByUserAsync(string code, int userId)
    {
        const string sql = @"
SELECT COUNT(*)
FROM dbo.Orders
WHERE UserId = @userId
  AND CouponCode = @code
  AND Status IN ('Placed','Packed','Shipped','Delivered');";

        using var conn = _db.Create();
        return await conn.ExecuteScalarAsync<int>(sql, new { code, userId });
    }

    public async Task<int> AdminCreateAsync(CouponRow row)
    {
        const string sql = @"
INSERT INTO dbo.Coupons
(
    Code,
    IsActive,
    ExpiresAtUtc,
    MinSubtotal,
    DiscountType,
    DiscountValue,
    MaxDiscount,
    UsageLimitTotal,
    UsageLimitPerUser,
    CreatedAtUtc
)
VALUES
(
    @Code,
    @IsActive,
    @ExpiresAtUtc,
    @MinSubtotal,
    @DiscountType,
    @DiscountValue,
    @MaxDiscount,
    @UsageLimitTotal,
    @UsageLimitPerUser,
    @CreatedAtUtc
);

SELECT CAST(SCOPE_IDENTITY() as int);";

        using var conn = _db.Create();
        return await conn.ExecuteScalarAsync<int>(sql, row);
    }

    public async Task<bool> AdminUpdateAsync(CouponRow row)
    {
        const string sql = @"
UPDATE dbo.Coupons
SET Code = @Code,
    IsActive = @IsActive,
    ExpiresAtUtc = @ExpiresAtUtc,
    MinSubtotal = @MinSubtotal,
    DiscountType = @DiscountType,
    DiscountValue = @DiscountValue,
    MaxDiscount = @MaxDiscount,
    UsageLimitTotal = @UsageLimitTotal,
    UsageLimitPerUser = @UsageLimitPerUser
WHERE Id = @Id;";

        using var conn = _db.Create();
        var affected = await conn.ExecuteAsync(sql, row);
        return affected == 1;
    }
    public async Task<int> CountSuccessfulOrdersByUserAsync(int userId)
    {
        const string sql = @"
SELECT COUNT(*)
FROM dbo.Orders
WHERE UserId = @userId
  AND Status IN ('Placed','Packed','Delivered');";

        using var conn = _db.Create();
        return await conn.ExecuteScalarAsync<int>(sql, new { userId });
    }
    public async Task<IReadOnlyList<CouponRow>> GetAvailableAsync(DateTime utcNow)
    {
        const string sql = @"
SELECT
    Id,
    Code,
    IsActive,
    ExpiresAtUtc,
    MinSubtotal,
    DiscountType,
    DiscountValue,
    MaxDiscount,
    UsageLimitTotal,
    UsageLimitPerUser,
    CreatedAtUtc
FROM dbo.Coupons
WHERE IsActive = 1
  AND (ExpiresAtUtc IS NULL OR ExpiresAtUtc > @utcNow)
ORDER BY Id DESC;";

        using var conn = _db.Create();
        var rows = await conn.QueryAsync<CouponRow>(sql, new { utcNow });
        return rows.ToList();
    }
}