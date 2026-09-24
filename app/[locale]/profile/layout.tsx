import { privateMetadata } from "@/lib/seo/metadata";
export const metadata = privateMetadata;
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
