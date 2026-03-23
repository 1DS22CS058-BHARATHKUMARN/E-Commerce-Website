using Dapper;
using Datastore.Abstraction.Models.Orders;
using Datastore.Abstraction.Repositories;
using Datastore.Abstraction.Repositories.Coupons;
using Datastore.Abstraction.Repositories.Orders;
using FeatureObject.Abstraction.Contracts.Orders;
using FeatureObject.Implementation.Coupons;
using System.Data;

namespace Datastore.Implementation.Repositories.Orders;

public sealed class OrderRepository : IOrderRepository
{
    private readonly IDbConnectionFactory _db;
    private readonly ICouponRepository _coupons;

    public OrderRepository(IDbConnectionFactory db, ICouponRepository coupons)
    {
        _db = db;
        _coupons = coupons;
    }

    public async Task<CheckoutResponse> CheckoutAsync(int userId, CheckoutRequest request)
    {   //complete checkout flow
        using var conn = _db.Create();
        conn.Open();

        using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

        try
        {
            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToArray();

            var products = (await conn.QueryAsync<ProductSnap>(
                @"SELECT Id, Name, Price
                  FROM dbo.Products
                  WHERE Id IN @Ids;",
                new { Ids = productIds }, tx)).ToDictionary(p => p.Id);

            foreach (var it in request.Items)
            {
                if (!products.ContainsKey(it.ProductId))
                    throw new InvalidOperationException($"Product {it.ProductId} not found.");
            }

            foreach (var it in request.Items)
            {
                var rows = await conn.ExecuteAsync(
                    @"UPDATE dbo.Products
                      SET StockQty = StockQty - @Qty
                      WHERE Id = @Id AND StockQty >= @Qty;",
                    new { Id = it.ProductId, Qty = it.Qty }, tx);

                if (rows == 0)
                    throw new InvalidOperationException($"Insufficient stock for product {it.ProductId}.");
            }

            var lines = request.Items.Select(it =>
            {
                var p = products[it.ProductId];
                var lineTotal = p.Price * it.Qty;
                return new OrderLine(it.ProductId, p.Name, p.Price, it.Qty, lineTotal);
            }).ToList();

            var subtotal = lines.Sum(l => l.LineTotal);

            string? couponCode = NormalizeCoupon(request.CouponCode);
            string? couponDiscountType = null;
            decimal? couponDiscountValue = null;
            decimal discountTotal = 0m;

            if (!string.IsNullOrWhiteSpace(couponCode))
            {
                var coupon = await _coupons.GetByCodeAsync(couponCode)
                             ?? throw new InvalidOperationException("Invalid coupon code.");

                var usesTotal = await _coupons.CountUsesTotalAsync(couponCode);
                var usesByUser = await _coupons.CountUsesByUserAsync(couponCode, userId);

                if (couponCode.Equals("WELCOME10", StringComparison.OrdinalIgnoreCase))
                {
                    var priorOrders = await CountSuccessfulOrdersByUserAsync(conn, userId, tx);
                    if (priorOrders > 0)
                        throw new InvalidOperationException("WELCOME10 is only for first-time customers (first order only).");
                }

                CouponPricing.ValidateCouponOrThrow(coupon, subtotal, DateTime.UtcNow, usesTotal, usesByUser);
                discountTotal = CouponPricing.CalculateDiscount(subtotal, coupon);

                couponDiscountType = coupon.DiscountType;
                couponDiscountValue = coupon.DiscountValue;
            }

            var discountedSubtotal = Math.Max(0m, subtotal - discountTotal);

            var taxTotal = Math.Round(discountedSubtotal * 0.08m, 2, MidpointRounding.AwayFromZero);
            var shippingTotal = Math.Round(discountedSubtotal * 0.03m, 2, MidpointRounding.AwayFromZero);

            var grandTotal = discountedSubtotal + taxTotal + shippingTotal;
            if (grandTotal < 0) grandTotal = 0m;

            var orderId = await conn.ExecuteScalarAsync<int>(
                @"INSERT INTO dbo.Orders
                    (UserId, Status, TotalAmount, Subtotal, DiscountTotal, TaxTotal, ShippingTotal,
                     CouponCode, CouponDiscountType, CouponDiscountValue)
                  OUTPUT INSERTED.Id
                  VALUES
                    (@UserId, @Status, @TotalAmount, @Subtotal, @DiscountTotal, @TaxTotal, @ShippingTotal,
                     @CouponCode, @CouponDiscountType, @CouponDiscountValue);",
                new
                {
                    UserId = userId,
                    Status = "Placed",
                    TotalAmount = grandTotal,
                    Subtotal = subtotal,
                    DiscountTotal = discountTotal,
                    TaxTotal = taxTotal,
                    ShippingTotal = shippingTotal,
                    CouponCode = couponCode,
                    CouponDiscountType = couponDiscountType,
                    CouponDiscountValue = couponDiscountValue
                }, tx);

            foreach (var l in lines)
            {
                await conn.ExecuteAsync(
                    @"INSERT INTO dbo.OrderItems
                      (OrderId, ProductId, ProductName, UnitPrice, Qty, LineTotal)
                      VALUES
                      (@OrderId, @ProductId, @ProductName, @UnitPrice, @Qty, @LineTotal);",
                    new
                    {
                        OrderId = orderId,
                        ProductId = l.ProductId,
                        ProductName = l.ProductName,
                        UnitPrice = l.UnitPrice,
                        Qty = l.Qty,
                        LineTotal = l.LineTotal
                    }, tx);
            }

            if (request.Address != null)
            {
                await conn.ExecuteAsync(
                    @"INSERT INTO dbo.OrderAddresses
                      (OrderId, FullName, PhoneNumber, AddressLine1, AddressLine2, City, State, PostalCode, Country, CreatedAt)
                      VALUES
                      (@OrderId, @FullName, @PhoneNumber, @AddressLine1, @AddressLine2, @City, @State, @PostalCode, @Country, @CreatedAt);",
                    new
                    {
                        OrderId = orderId,
                        FullName = request.Address.FullName,
                        PhoneNumber = request.Address.PhoneNumber,
                        AddressLine1 = request.Address.AddressLine1,
                        AddressLine2 = request.Address.AddressLine2,
                        City = request.Address.City,
                        State = request.Address.State,
                        PostalCode = request.Address.PostalCode,
                        Country = request.Address.Country,
                        CreatedAt = DateTime.UtcNow
                    }, tx);
            }

            string maskedCardNumber = "****";
            string paymentStatus = "Pending";

            if (request.Payment != null)
            {
                maskedCardNumber = MaskCardNumber(request.Payment.CardNumber);
                paymentStatus = "Paid";

                await conn.ExecuteAsync(
                    @"INSERT INTO dbo.OrderPayments
                      (OrderId, CardHolderName, MaskedCardNumber, Expiry, Amount, Status, PaidAt, CreatedAt)
                      VALUES
                      (@OrderId, @CardHolderName, @MaskedCardNumber, @Expiry, @Amount, @Status, @PaidAt, @CreatedAt);",
                    new
                    {
                        OrderId = orderId,
                        CardHolderName = request.Payment.CardHolderName,
                        MaskedCardNumber = maskedCardNumber,
                        Expiry = request.Payment.Expiry,
                        Amount = grandTotal,
                        Status = paymentStatus,
                        PaidAt = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow
                    }, tx);
            }

            tx.Commit();

            return new CheckoutResponse
            {
                OrderId = orderId,
                Message = "Order placed successfully.",
                Total = grandTotal,
                Payment = new CheckoutPaymentResponse
                {
                    Status = paymentStatus,
                    MaskedCardNumber = maskedCardNumber
                }
            };
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<List<MyOrderDto>> GetMyOrdersAsync(int userId)
    {
        using var conn = _db.Create();

        var rows = await conn.QueryAsync<MyOrderDto>(
            @"SELECT Id, Status, TotalAmount, CreatedAt
              FROM dbo.Orders
              WHERE UserId = @UserId
              ORDER BY CreatedAt DESC;",
            new { UserId = userId });

        return rows.ToList();
    }

    public async Task<MyOrderDetailsDto?> GetMyOrderDetailsAsync(int userId, int orderId)
    {
        using var conn = _db.Create();

        var order = await conn.QuerySingleOrDefaultAsync<OrderHead>(
            @"SELECT Id, Status, TotalAmount, Subtotal, DiscountTotal, TaxTotal, ShippingTotal, CouponCode, CreatedAt
              FROM dbo.Orders
              WHERE Id = @OrderId AND UserId = @UserId;",
            new { OrderId = orderId, UserId = userId });

        if (order == null) return null;

        var items = await conn.QueryAsync<MyOrderItemDto>(
            @"SELECT ProductId, ProductName, UnitPrice, Qty, LineTotal
              FROM dbo.OrderItems
              WHERE OrderId = @OrderId
              ORDER BY Id;",
            new { OrderId = orderId });

        return new MyOrderDetailsDto(
            order.Id,
            order.Status,
            order.TotalAmount,
            order.Subtotal,
            order.DiscountTotal,
            order.TaxTotal,
            order.ShippingTotal,
            order.CouponCode,
            order.CreatedAt,
            items.ToList()
        );
    }

    public async Task<List<AdminOrderDto>> GetAllOrdersAsync()
    {
        using var conn = _db.Create();

        var rows = await conn.QueryAsync<AdminOrderDto>(
            @"SELECT Id, UserId, Status, TotalAmount, CreatedAt
              FROM dbo.Orders
              ORDER BY CreatedAt DESC;");

        return rows.ToList();
    }

    public async Task<string?> GetOrderStatusAsync(int orderId)
    {
        using var conn = _db.Create();

        return await conn.ExecuteScalarAsync<string?>(
            @"SELECT Status
              FROM dbo.Orders
              WHERE Id = @OrderId;",
            new { OrderId = orderId });
    }

    public async Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus)
    {
        using var conn = _db.Create();

        var rows = await conn.ExecuteAsync(
            @"UPDATE dbo.Orders
              SET Status = @Status
              WHERE Id = @OrderId;",
            new { Status = newStatus, OrderId = orderId });

        return rows > 0;
    }

    public async Task<MyOrderDetailsDto?> GetAdminOrderDetailsAsync(int orderId)
    {
        using var conn = _db.Create();

        var head = await conn.QuerySingleOrDefaultAsync<OrderHead>(
            @"SELECT Id, Status, TotalAmount, Subtotal, DiscountTotal, TaxTotal, ShippingTotal, CouponCode, CreatedAt
              FROM dbo.Orders
              WHERE Id = @OrderId;",
            new { OrderId = orderId });

        if (head == null) return null;

        var items = (await conn.QueryAsync<MyOrderItemDto>(
            @"SELECT ProductId, ProductName, UnitPrice, Qty,
                     CAST(UnitPrice * Qty AS decimal(18,2)) AS LineTotal
              FROM dbo.OrderItems
              WHERE OrderId = @OrderId
              ORDER BY Id;",
            new { OrderId = orderId }
        )).ToList();

        return new MyOrderDetailsDto(
            head.Id,
            head.Status,
            head.TotalAmount,
            head.Subtotal,
            head.DiscountTotal,
            head.TaxTotal,
            head.ShippingTotal,
            head.CouponCode,
            head.CreatedAt,
            items
        );
    }

    public async Task<bool> CancelMyOrderAsync(int userId, int orderId)
    {
        using var conn = _db.Create();
        conn.Open();

        using var tx = conn.BeginTransaction(IsolationLevel.ReadCommitted);

        try
        {
            var currentStatus = await conn.ExecuteScalarAsync<string?>(
                @"SELECT Status
                  FROM dbo.Orders
                  WHERE Id = @OrderId AND UserId = @UserId;",
                new { OrderId = orderId, UserId = userId }, tx);

            if (currentStatus == null)
            {
                tx.Rollback();
                return false;
            }

            if (!currentStatus.Equals("Placed", StringComparison.OrdinalIgnoreCase) &&
                !currentStatus.Equals("Packed", StringComparison.OrdinalIgnoreCase))
            {
                tx.Rollback();
                return false;
            }

            var updated = await conn.ExecuteAsync(
                @"UPDATE dbo.Orders
                  SET Status = 'Cancelled'
                  WHERE Id = @OrderId
                    AND UserId = @UserId
                    AND Status IN ('Placed', 'Packed');",
                new { OrderId = orderId, UserId = userId }, tx);

            if (updated == 0)
            {
                tx.Rollback();
                return false;
            }

            var items = await conn.QueryAsync<(int ProductId, int Qty)>(
                @"SELECT ProductId, Qty
                  FROM dbo.OrderItems
                  WHERE OrderId = @OrderId;",
                new { OrderId = orderId }, tx);

            foreach (var item in items)
            {
                await conn.ExecuteAsync(
                    @"UPDATE dbo.Products
                      SET StockQty = StockQty + @Qty
                      WHERE Id = @ProductId;",
                    new { ProductId = item.ProductId, Qty = item.Qty }, tx);
            }

            tx.Commit();
            return true;
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task CreateOrderAddressAsync(OrderAddressRow address, CancellationToken cancellationToken = default)
    {
        const string sql = """
        INSERT INTO OrderAddresses
        (
            OrderId,
            FullName,
            PhoneNumber,
            AddressLine1,
            AddressLine2,
            City,
            State,
            PostalCode,
            Country,
            CreatedAt
        )
        VALUES
        (
            @OrderId,
            @FullName,
            @PhoneNumber,
            @AddressLine1,
            @AddressLine2,
            @City,
            @State,
            @PostalCode,
            @Country,
            @CreatedAt
        );
        """;

        using var connection = _db.Create();
        await connection.ExecuteAsync(new CommandDefinition(sql, address, cancellationToken: cancellationToken));
    }

    public async Task CreateOrderPaymentAsync(OrderPaymentRow payment, CancellationToken cancellationToken = default)
    {
        const string sql = """
        INSERT INTO OrderPayments
        (
            OrderId,
            CardHolderName,
            MaskedCardNumber,
            Expiry,
            Amount,
            Status,
            PaidAt,
            CreatedAt
        )
        VALUES
        (
            @OrderId,
            @CardHolderName,
            @MaskedCardNumber,
            @Expiry,
            @Amount,
            @Status,
            @PaidAt,
            @CreatedAt
        );
        """;

        using var connection = _db.Create();
        await connection.ExecuteAsync(new CommandDefinition(sql, payment, cancellationToken: cancellationToken));
    }

    private async Task<int> CountSuccessfulOrdersByUserAsync(IDbConnection conn, int userId, IDbTransaction? tx = null)
    {
        return await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*)
              FROM dbo.Orders
              WHERE UserId = @UserId
                AND Status IN ('Placed','Packed','Delivered');",
            new { UserId = userId }, tx);
    }

    private static string? NormalizeCoupon(string? code)
        => string.IsNullOrWhiteSpace(code) ? null : code.Trim().ToUpperInvariant();

    private static string MaskCardNumber(string cardNumber)
    {
        var digits = new string((cardNumber ?? "").Where(char.IsDigit).ToArray());
        if (digits.Length < 4) return "****";
        return $"**** **** **** {digits[^4..]}";
    }

    private sealed record ProductSnap(int Id, string Name, decimal Price);

    private sealed record OrderHead(
        int Id,
        string Status,
        decimal TotalAmount,
        decimal Subtotal,
        decimal DiscountTotal,
        decimal TaxTotal,
        decimal ShippingTotal,
        string? CouponCode,
        DateTime CreatedAt
    );

    private sealed record OrderLine(int ProductId, string ProductName, decimal UnitPrice, int Qty, decimal LineTotal);
}