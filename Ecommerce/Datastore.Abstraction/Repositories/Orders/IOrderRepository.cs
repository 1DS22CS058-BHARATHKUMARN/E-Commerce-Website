using Datastore.Abstraction.Models.Orders;
using FeatureObject.Abstraction.Contracts.Orders;

namespace Datastore.Abstraction.Repositories.Orders;

public interface IOrderRepository
{
    Task<CheckoutResponse> CheckoutAsync(int userId, CheckoutRequest request);

    Task<List<MyOrderDto>> GetMyOrdersAsync(int userId);
    Task<MyOrderDetailsDto?> GetMyOrderDetailsAsync(int userId, int orderId);

    Task<List<AdminOrderDto>> GetAllOrdersAsync();

    Task<string?> GetOrderStatusAsync(int orderId);
    Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus);
    Task<MyOrderDetailsDto?> GetAdminOrderDetailsAsync(int orderId);
    Task<bool> CancelMyOrderAsync(int userId, int orderId);
    //Task<int> CreateOrderAsync(OrderRow order, CancellationToken cancellationToken = default);
    //Task CreateOrderItemsAsync(IEnumerable<OrderItemRow> items, CancellationToken cancellationToken = default);

    Task CreateOrderAddressAsync(OrderAddressRow address, CancellationToken cancellationToken = default);
    Task CreateOrderPaymentAsync(OrderPaymentRow payment, CancellationToken cancellationToken = default);


}