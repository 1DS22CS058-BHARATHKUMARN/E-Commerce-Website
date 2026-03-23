namespace FeatureObject.Abstraction.Services;

public interface IFileStorageService
{
    Task<string> SaveProductImageAsync(Stream fileStream, string fileName, CancellationToken cancellationToken);
}