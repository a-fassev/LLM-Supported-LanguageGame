using System;
using System.Net;
using System.Net.Sockets;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Validates http(s) URLs used by toolkit steps for remote images/audio, blocking obvious SSRF targets
    /// (loopback, RFC1918, link-local, IPv6 ULA) while allowing normal public hostnames.
    /// </summary>
    public static class ToolkitStepHttpResourceUrl
    {
        public static bool IsAllowed(string raw, out string error)
        {
            error = null;
            if (string.IsNullOrWhiteSpace(raw))
                return true;
            var s = raw.Trim();
            if (!Uri.TryCreate(s, UriKind.Absolute, out var uri))
            {
                error = "URL must be an absolute http or https URL.";
                return false;
            }

            if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            {
                error = "URL must use http or https.";
                return false;
            }

            if (IsDisallowedHost(uri, out var hostError))
            {
                error = hostError;
                return false;
            }

            return true;
        }

        internal static bool IsDisallowedHost(Uri uri, out string error)
        {
            error = null;
            var host = uri.IdnHost;
            if (string.IsNullOrWhiteSpace(host))
            {
                error = "URL host is missing or invalid.";
                return true;
            }

            if (string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase))
            {
                error = "localhost URLs are not allowed.";
                return true;
            }

            if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase))
            {
                error = ".localhost URLs are not allowed.";
                return true;
            }

            var hostForIp = host.StartsWith("[", StringComparison.Ordinal) && host.EndsWith("]", StringComparison.Ordinal)
                ? host.Substring(1, host.Length - 2)
                : host;

            if (IPAddress.TryParse(hostForIp, out var ip))
            {
                if (IsNonPublicOrRestrictedIp(ip, out var ipErr))
                {
                    error = ipErr;
                    return true;
                }

                return false;
            }

            return false;
        }

        private static bool IsNonPublicOrRestrictedIp(IPAddress ip, out string error)
        {
            error = null;
            if (IPAddress.IsLoopback(ip))
            {
                error = "Loopback URLs are not allowed.";
                return true;
            }

            if (ip.AddressFamily == AddressFamily.InterNetwork)
            {
                var b = ip.GetAddressBytes();
                if (b[0] == 10)
                {
                    error = "Private network URLs are not allowed.";
                    return true;
                }

                if (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
                {
                    error = "Private network URLs are not allowed.";
                    return true;
                }

                if (b[0] == 192 && b[1] == 168)
                {
                    error = "Private network URLs are not allowed.";
                    return true;
                }

                if (b[0] == 169 && b[1] == 254)
                {
                    error = "Link-local URLs are not allowed.";
                    return true;
                }

                if (b[0] == 127)
                {
                    error = "Loopback URLs are not allowed.";
                    return true;
                }

                if (b[0] == 0)
                {
                    error = "Invalid URL address.";
                    return true;
                }
            }
            else if (ip.AddressFamily == AddressFamily.InterNetworkV6)
            {
                if (IPAddress.IsLoopback(ip))
                {
                    error = "Loopback URLs are not allowed.";
                    return true;
                }

                if (ip.IsIPv6LinkLocal)
                {
                    error = "Link-local URLs are not allowed.";
                    return true;
                }

                var bytes = ip.GetAddressBytes();
                if ((bytes[0] & 0xfe) == 0xfc)
                {
                    error = "Private network URLs are not allowed.";
                    return true;
                }
            }

            return false;
        }
    }
}
