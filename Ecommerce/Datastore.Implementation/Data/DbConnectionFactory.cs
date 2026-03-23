using System.Data;
using Datastore.Abstraction.Repositories;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace Datastore.Implementation.Data;

public sealed class DbConnectionFactory : IDbConnectionFactory
{
    private readonly IConfiguration _configuration;

    public DbConnectionFactory(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public IDbConnection Create()
    {
        var cs = _configuration.GetConnectionString("DefaultConnection")
                 ?? throw new InvalidOperationException("Missing connection string: DefaultConnection");

        return new SqlConnection(cs);
    }
}