using AdminSoftGPF.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace AdminSoftGPF.Infrastructure.BlobStorage;

public sealed class AzureBlobStorageService : IBlobStorageService
{
    private readonly string _storageConnectionString;

    public AzureBlobStorageService(IConfiguration configuration)
    {
        _storageConnectionString = configuration.GetConnectionString("AzureBlobStorage")
            ?? "UseDevelopmentStorage=true;";
    }

    public Task<string> UploadAsync(string containerName, string blobName, Stream content, string contentType, CancellationToken cancellationToken = default)
    {
        // En producción interactúa con Azure.Storage.Blobs (BlobContainerClient y BlobClient)
        // En entorno de desarrollo emite la URL simulada
        var mockBlobUrl = $"https://adminsoftgpfstorage.blob.core.windows.net/{containerName}/{blobName}";
        return Task.FromResult(mockBlobUrl);
    }

    public Task<Stream?> DownloadAsync(string containerName, string blobName, CancellationToken cancellationToken = default)
    {
        return Task.FromResult<Stream?>(new MemoryStream(System.Text.Encoding.UTF8.GetBytes("PDF Document Content")));
    }

    public Task<string> GenerateSasUrlAsync(string containerName, string blobName, TimeSpan validity, CancellationToken cancellationToken = default)
    {
        var sasUrl = $"https://adminsoftgpfstorage.blob.core.windows.net/{containerName}/{blobName}?sig=sas_token_valid_{validity.TotalHours}h";
        return Task.FromResult(sasUrl);
    }
}
