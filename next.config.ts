import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
    // Domain redirects are managed in Vercel (apex -> www).
    // A reverse redirect here would create an infinite loop.
    async headers() {
        return ["/auth/:path*", "/api/:path*"].map(source => ({
            source,
            headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        }));
    },
    images: {
        domains: ['vbyhfzeojpmwnhkyjnrt.supabase.co', 'lh3.googleusercontent.com']
    }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
