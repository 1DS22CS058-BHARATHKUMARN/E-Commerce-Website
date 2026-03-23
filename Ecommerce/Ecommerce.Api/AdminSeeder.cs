using Microsoft.AspNetCore.Identity;
using Datastore.Abstraction.Models;
using Datastore.Abstraction.Repositories;
namespace Ecommerce.Api
{
    public static class AdminSeeder
    {
        public static async Task SeedAsync(IServiceProvider sp)
        {
            using var scope = sp.CreateScope();
            //AddScoped — scoped services can't be resolved from the root provider directly. 
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var users = scope.ServiceProvider.GetRequiredService<IUserRepository>();

            var email = config["AdminSeed:Email"]?.Trim().ToLowerInvariant();
            var password = config["AdminSeed:Password"];

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                return;
            //Idempotency 
            var existing = await users.GetByEmailAsync(email);
            if (existing != null) return;

            var hasher = new PasswordHasher<UserRow>();

            var admin = new UserRow
            {
                Email = email,
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };
            admin.PasswordHash = hasher.HashPassword(admin, password);

            await users.CreateAsync(admin);
        }
    }
}
