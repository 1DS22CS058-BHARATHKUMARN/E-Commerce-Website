using Dapper;
using Datastore.Abstraction;
using Datastore.Abstraction.Models;
using Datastore.Abstraction.Repositories;

namespace Datastore.Implementation.Repositories
{
    public sealed class UserRepository : IUserRepository
    {
        private readonly IDbConnectionFactory _db;

        public UserRepository(IDbConnectionFactory db)
        {
            _db = db;
        }

        public async Task<UserRow?> GetByEmailAsync(string email)
        {
            const string sql = @"
SELECT TOP 1 Id, Email, PasswordHash, Role, CreatedAt
FROM dbo.Users
WHERE Email = @Email;
";// making SQL injection impossible here.
            using var conn = _db.Create();
            return await conn.QuerySingleOrDefaultAsync<UserRow>(sql, new { Email = email });
        }

        public async Task<long> CreateAsync(UserRow user)
        {
            const string sql = @"
INSERT INTO dbo.Users (Email, PasswordHash, Role, CreatedAt)
VALUES (@Email, @PasswordHash, @Role, @CreatedAt);

SELECT CAST(SCOPE_IDENTITY() as bigint);
";//SCOPE_IDENTITY() — returns the auto-generated ID of the row just inserted,
            using var conn = _db.Create();

            var info = await conn.QuerySingleAsync<(string ServerName, string DbName)>(@"
SELECT CAST(@@SERVERNAME as nvarchar(128)) AS ServerName,
       CAST(DB_NAME() as nvarchar(128))   AS DbName;
");
            var files = (await conn.QueryAsync<string>(
                "SELECT physical_name FROM sys.database_files"))//sys.database_files exposes physical file paths of the database on disk
                .ToArray();

            Console.WriteLine($"[DB] Server={info.ServerName} Db={info.DbName}");
            Console.WriteLine($"[DB] Files={string.Join(" | ", files)}");

            var newId = await conn.ExecuteScalarAsync<long>(sql, user);

            var count = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM dbo.Users");
            Console.WriteLine($"[DB] InsertedId={newId}, UsersCountNow={count}");

            return newId;
        }
    }
}