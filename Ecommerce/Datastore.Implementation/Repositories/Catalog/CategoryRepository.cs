using Dapper;
using Datastore.Abstraction.Models.Catalog;
using Datastore.Abstraction.Repositories;
using Datastore.Abstraction.Repositories.Catalog;

namespace Datastore.Implementation.Repositories.Catalog;

public sealed class CategoryRepository : ICategoryRepository
{
    private readonly IDbConnectionFactory _db;

    public CategoryRepository(IDbConnectionFactory db) => _db = db;

    public async Task<IReadOnlyList<CategoryRow>> GetAllAsync()
    {
        using var conn = _db.Create();

        var sql = """
            SELECT Id, Name
            FROM dbo.Categories
            ORDER BY Name;
        """;

        var rows = await conn.QueryAsync<CategoryRow>(sql);//Dapper maps each row directly to a CategoryRow object 
        //QueryAsync it returns IEnumerable<T>-->standard way to iterate loop in C#
        return rows.ToList();
    }

    public async Task<int> CreateAsync(string name)
    {
        using var conn = _db.Create();

        var sql = """
            INSERT INTO dbo.Categories (Name)
            OUTPUT INSERTED.Id
            VALUES (@Name);
        """;
        // OUTPUT INSERTED.Id == Returns the ID as part of the INSERT itself

        return await conn.ExecuteScalarAsync<int>(sql, new { Name = name });//returns new generated id
    }
}

//CategoryRepository
//    ├── GetAllAsync()  → SELECT all categories(e.g. for a dropdown in UI)
//    └── CreateAsync()  → INSERT new category → returns new Id