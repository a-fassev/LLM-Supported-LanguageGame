using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Sockets;
using UnityEngine;

namespace LanguageGame.Presentation.Steps
{
    /// <summary>
    /// Validates http(s) URLs used by toolkit steps for remote images/audio.
    /// </summary>
    /// <remarks>
    /// <para>
    /// <see cref="IsAllowed"/> performs fast static checks only (scheme, host string parsing,
    /// literal IPs and obvious hostnames like localhost). It does not perform DNS lookups.
    /// </para>
    /// <para>
    /// For mitigating hostnames that resolve to link-local or private addresses (DNS rebinding at fetch time),
    /// call <see cref="TryVerifyForClientFetch"/> immediately before starting a Unity web request from a coroutine.
    /// It resolves the host and rejects if any resolved address is loopback, RFC1918, link-local, or IPv6 ULA.
    /// </para>
    /// <para>
    /// If <c>Dns.GetHostAddresses</c> throws (offline, WebGL limitations, resolver errors), verification fails open
    /// and only logs a warning — fetch may still proceed; content should remain author-controlled.
    /// </para>
    /// </remarks>
    public static class ToolkitStepHttpResourceUrl
    {
        private static readonly Dictionary<string, sbyte> HostResolutionCache = new(StringComparer.OrdinalIgnoreCase);
        // +1 = all resolved addresses are acceptable; 0 = rejected; -1 = verified fail-open (skip re-query this session)

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

        /// <summary>
        /// Call from a coroutine before issuing a Unity WebRequest for remote media (images, audio).
        /// Runs static checks plus DNS resolution when the host is not a literal IP (with in-session caching).
        /// </summary>
        public static bool TryVerifyForClientFetch(string raw, out string error)
        {
            error = null;
            if (!IsAllowed(raw, out error))
                return false;
            if (string.IsNullOrWhiteSpace(raw))
                return true;

            if (!Uri.TryCreate(raw.Trim(), UriKind.Absolute, out var uri))
                return false;

            var host = uri.IdnHost;
            if (string.IsNullOrWhiteSpace(host))
            {
                error = "URL host is missing or invalid.";
                return false;
            }

            var hostForIp = host.StartsWith("[", StringComparison.Ordinal) && host.EndsWith("]", StringComparison.Ordinal)
                ? host.Substring(1, host.Length - 2)
                : host;

            if (IPAddress.TryParse(hostForIp, out _))
            {
                // Literal IP: IsAllowed / IsDisallowedHost already classified it.
                return true;
            }

            lock (HostResolutionCache)
            {
                if (HostResolutionCache.TryGetValue(host, out var cached))
                {
                    if (cached == 1)
                        return true;
                    if (cached == 0)
                    {
                        error = "Host resolves to a non-public address.";
                        return false;
                    }

                    // -1: previously failed open; allow without re-query
                    return true;
                }
            }

            try
            {
                var addrs = Dns.GetHostAddresses(host);
                if (addrs == null || addrs.Length == 0)
                {
                    lock (HostResolutionCache)
                        HostResolutionCache[host] = 0;
                    error = "Impossibile risolvere l'host dell'URL.";
                    return false;
                }

                foreach (var addr in addrs)
                {
                    var ip = NormalizeIp(addr);
                    if (IsNonPublicOrRestrictedIp(ip, out var ipErr))
                    {
                        lock (HostResolutionCache)
                            HostResolutionCache[host] = 0;
                        error = ipErr;
                        return false;
                    }
                }

                lock (HostResolutionCache)
                    HostResolutionCache[host] = 1;
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[ToolkitStepHttpResourceUrl] DNS verification skipped for host '{host}': {ex.Message}");
                lock (HostResolutionCache)
                    HostResolutionCache[host] = -1;
                return true;
            }
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
                if (IsNonPublicOrRestrictedIp(NormalizeIp(ip), out var ipErr))
                {
                    error = ipErr;
                    return true;
                }

                return false;
            }

            return false;
        }

        private static IPAddress NormalizeIp(IPAddress ip)
        {
            if (ip.AddressFamily == AddressFamily.InterNetworkV6 && ip.IsIPv4MappedToIPv6)
                return ip.MapToIPv4();
            return ip;
        }

        private static bool IsNonPublicOrRestrictedIp(IPAddress ip, out string error)
        {
            error = null;
            ip = NormalizeIp(ip);

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
