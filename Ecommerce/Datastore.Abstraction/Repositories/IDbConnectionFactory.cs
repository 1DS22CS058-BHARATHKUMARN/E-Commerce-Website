using System.Data;

namespace Datastore.Abstraction.Repositories
{
    public interface IDbConnectionFactory
    {
        IDbConnection Create();
    }
}