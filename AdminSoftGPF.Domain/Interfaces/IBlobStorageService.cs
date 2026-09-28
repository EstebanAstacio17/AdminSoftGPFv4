namespace AdminSoftGPF.Domain.Interfaces;

public interface IBlobStorageService
{
    Task<string> UploadAsync(string containerName, string blobName, Stream content, string contentType, CancellationToken cancellationToken = default);
    Task<Stream?> DownloadAsync(string containerName, string blobName, CancellationToken cancellationToken = default);
    Task<string> GenerateSasUrlAsync(string containerName, string blobName, TimeSpan validity, CancellationToken cancellationToken = default);
}
