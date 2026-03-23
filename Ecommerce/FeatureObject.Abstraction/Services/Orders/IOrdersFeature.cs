using FeatureObject.Abstraction.Contracts.Orders;

namespace FeatureObject.Abstraction.Services.Orders;

public interface IOrdersFeature
{
    Task<CheckoutResponse> CheckoutAsync(int userId, CheckoutRequest request);


    Task<List<MyOrderDto>> GetMyOrdersAsync(int userId);
    Task<MyOrderDetailsDto?> GetMyOrderDetailsAsync(int userId, int orderId);

    Task<List<AdminOrderDto>> GetAllOrdersAsync();
    Task<MyOrderDetailsDto?> GetAdminOrderDetailsAsync(int orderId);
    Task UpdateOrderStatusAsync(int orderId, string newStatus);
    Task CancelMyOrderAsync(int userId, int orderId);
}