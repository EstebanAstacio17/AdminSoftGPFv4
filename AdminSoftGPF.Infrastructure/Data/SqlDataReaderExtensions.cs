using System.Data;
using Microsoft.Data.SqlClient;

namespace AdminSoftGPF.Infrastructure.Data;

/// <summary>
/// Métodos de extensión para lectura segura y eficiente de datos desde SqlDataReader en ADO.NET.
/// </summary>
public static class SqlDataReaderExtensions
{
    public static Guid GetGuidSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.GetGuid(ordinal);
    }

    public static Guid? GetNullableGuidSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetGuid(ordinal);
    }

    public static string GetStringSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? string.Empty : reader.GetString(ordinal);
    }

    public static string? GetNullableStringSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    public static decimal GetDecimalSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.GetDecimal(ordinal);
    }

    public static bool GetBooleanSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.GetBoolean(ordinal);
    }

    public static DateTime GetDateTimeSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.GetDateTime(ordinal);
    }

    public static DateOnly GetDateOnlySafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        var dt = reader.GetDateTime(ordinal);
        return DateOnly.FromDateTime(dt);
    }

    public static long GetInt64Safe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        return reader.GetInt64(ordinal);
    }

    public static byte[]? GetBytesSafe(this SqlDataReader reader, string columnName)
    {
        int ordinal = reader.GetOrdinal(columnName);
        if (reader.IsDBNull(ordinal)) return null;

        var buffer = new byte[8]; // RowVersion es de 8 bytes
        reader.GetBytes(ordinal, 0, buffer, 0, 8);
        return buffer;
    }

    public static object ToDbValue(this object? value)
    {
        return value ?? DBNull.Value;
    }
}
