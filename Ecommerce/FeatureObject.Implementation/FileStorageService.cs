using FeatureObject.Abstraction.Services;

namespace FeatureObject.Implementation;

public class FileStorageService : IFileStorageService
{
    private readonly string _webRootPath;
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".webp" };

    public FileStorageService(string webRootPath)
    {
        _webRootPath = webRootPath;
    }

    public async Task<string> SaveProductImageAsync(Stream fileStream, string fileName, CancellationToken cancellationToken)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(ext))
            throw new ArgumentException("Only .jpg, .jpeg, .png, .webp files are allowed.");

        var uploadFolder = Path.Combine(_webRootPath, "uploads", "products");
        Directory.CreateDirectory(uploadFolder);

        var newFileName = $"{Guid.NewGuid():N}{ext}";
        var physicalPath = Path.Combine(uploadFolder, newFileName);

        await using var output = new FileStream(physicalPath, FileMode.Create);
        await fileStream.CopyToAsync(output, cancellationToken);

        return $"/uploads/products/{newFileName}";
    }
}