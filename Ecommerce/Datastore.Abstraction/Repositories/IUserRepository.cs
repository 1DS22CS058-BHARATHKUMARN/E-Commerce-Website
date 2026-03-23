using Datastore.Abstraction.Models;

namespace Datastore.Abstraction.Repositories
{
    public interface IUserRepository
    {
        Task<UserRow?> GetByEmailAsync(string email);
        Task<long> CreateAsync(UserRow user);
    }
}