using Datastore.Abstraction.Repositories.Orders;
using FeatureObject.Abstraction.Contracts.Orders;
using FeatureObject.Abstraction.Services.Orders;
using System.Text.RegularExpressions;

namespace FeatureObject.Implementation.Orders;

public sealed class OrdersFeature : IOrdersFeature
{
    private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "Placed", "Packed", "Shipped", "Delivered", "Cancelled"
    };

    private static readonly Dictionary<string, HashSet<string>> AllowedTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Placed"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Packed", "Cancelled" },
        ["Packed"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Shipped", "Cancelled" },
        ["Shipped"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "Delivered" },
        ["Delivered"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
        ["Cancelled"] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    };

    private readonly IOrderRepository _repo;

    public OrdersFeature(IOrderRepository repo)
    {
        _repo = repo;
    }

    public Task<CheckoutResponse> CheckoutAsync(int userId, CheckoutRequest request)
    {
        if (userId <= 0)
            throw new InvalidOperationException("Invalid user.");

        if (request == null)
            throw new InvalidOperationException("Request is required.");

        if (request.Items == null || request.Items.Count == 0)
            throw new InvalidOperationException("Cart is empty.");

        if (request.Items.Any(i => i.ProductId <= 0))
            throw new InvalidOperationException("Invalid ProductId in cart.");

        if (request.Items.Any(i => i.Qty <= 0))
            throw new InvalidOperationException("Qty must be greater than 0.");

        // validate address/payment only if these properties exist in your CheckoutRequest
        if (request.Address != null)
            ValidateAddress(request.Address);

        if (request.Payment != null)
            ValidatePayment(request.Payment);

        // merge duplicate items directly back into same request type
        request.Items = request.Items
            .GroupBy(x => x.ProductId)
            .Select(g => new CheckoutItemRequest
            {
                ProductId = g.Key,
                Qty = g.Sum(x => x.Qty)
            })
            .ToList();

        return _repo.CheckoutAsync(userId, request);
    }

    public Task<List<MyOrderDto>> GetMyOrdersAsync(int userId)
        => _repo.GetMyOrdersAsync(userId);

    public Task<MyOrderDetailsDto?> GetMyOrderDetailsAsync(int userId, int orderId)
        => _repo.GetMyOrderDetailsAsync(userId, orderId);

    public Task<List<AdminOrderDto>> GetAllOrdersAsync()
        => _repo.GetAllOrdersAsync();

    public Task<MyOrderDetailsDto?> GetAdminOrderDetailsAsync(int orderId)
        => _repo.GetAdminOrderDetailsAsync(orderId);

    public async Task UpdateOrderStatusAsync(int orderId, string newStatus)
    {
        if (orderId <= 0)
            throw new InvalidOperationException("Invalid orderId.");

        if (string.IsNullOrWhiteSpace(newStatus))
            throw new InvalidOperationException("Status is required.");

        if (!AllowedStatuses.Contains(newStatus))
            throw new InvalidOperationException("Invalid status.");

        var current = await _repo.GetOrderStatusAsync(orderId);
        if (current == null)
            throw new KeyNotFoundException("Order not found.");

        if (!AllowedTransitions.TryGetValue(current, out var allowedNext) || !allowedNext.Contains(newStatus))
            throw new InvalidOperationException($"Invalid status transition: {current} -> {newStatus}");

        var ok = await _repo.UpdateOrderStatusAsync(orderId, newStatus);
        if (!ok)
            throw new KeyNotFoundException("Order not found.");
    }

    public async Task CancelMyOrderAsync(int userId, int orderId)
    {
        if (userId <= 0)
            throw new InvalidOperationException("Invalid userId.");

        if (orderId <= 0)
            throw new InvalidOperationException("Invalid orderId.");

        var ok = await _repo.CancelMyOrderAsync(userId, orderId);

        if (!ok)
            throw new InvalidOperationException("Order cannot be cancelled.");
    }

    private static void ValidateAddress(CheckoutAddressRequest address)
    {
        if (string.IsNullOrWhiteSpace(address.FullName))
            throw new ArgumentException("Full name is required.");

        if (string.IsNullOrWhiteSpace(address.PhoneNumber))
            throw new ArgumentException("Phone number is required.");

        if (string.IsNullOrWhiteSpace(address.AddressLine1))
            throw new ArgumentException("Address line 1 is required.");

        if (string.IsNullOrWhiteSpace(address.City))
            throw new ArgumentException("City is required.");

        if (string.IsNullOrWhiteSpace(address.State))
            throw new ArgumentException("State is required.");

        if (string.IsNullOrWhiteSpace(address.PostalCode))
            throw new ArgumentException("Postal code is required.");

        if (string.IsNullOrWhiteSpace(address.Country))
            throw new ArgumentException("Country is required.");
    }

    private static void ValidatePayment(CheckoutPaymentRequest payment)
    {
        if (string.IsNullOrWhiteSpace(payment.CardHolderName))
            throw new ArgumentException("Cardholder name is required.");

        var digits = new string((payment.CardNumber ?? "").Where(char.IsDigit).ToArray());
        if (digits.Length != 16)
            throw new ArgumentException("Card number must be 16 digits.");

        if (string.IsNullOrWhiteSpace(payment.Expiry) || !Regex.IsMatch(payment.Expiry, @"^\d{2}/\d{2}$"))
            throw new ArgumentException("Expiry must be in MM/YY format.");

        var cvvDigits = new string((payment.Cvv ?? "").Where(char.IsDigit).ToArray());
        if (cvvDigits.Length < 3 || cvvDigits.Length > 4)
            throw new ArgumentException("CVV must be 3 or 4 digits.");
    }

    private static string MaskCardNumber(string cardNumber)
    {
        var digits = new string((cardNumber ?? "").Where(char.IsDigit).ToArray());
        if (digits.Length < 4)
            return "****";

        return $"**** **** **** {digits[^4..]}";
    }
}