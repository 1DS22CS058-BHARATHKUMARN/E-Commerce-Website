using Datastore.Abstraction.Models.Catalog;

namespace Datastore.Abstraction.Repositories.Catalog;

public interface ICategoryRepository
{
    Task<IReadOnlyList<CategoryRow>> GetAllAsync();
    Task<int> CreateAsync(string name);
}



