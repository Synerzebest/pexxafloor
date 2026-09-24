import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
    async redirects() {
        return [{
            source: "/:path*",
            has: [{ type: "host", value: "www.pexxafloor.be" }],
            destination: "https://pexxafloor.be/:path*",
            permanent: true,
        }];
    },
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
