import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin"

const nextConfig: NextConfig = {
    images: {
        domains: ['vbyhfzeojpmwnhkyjnrt.supabase.co', 'lh3.googleusercontent.com']
    }
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
