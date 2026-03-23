namespace Datastore.Abstraction.Models;

public class UserRow
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "Customer";
    public DateTime CreatedAt { get; set; }
}