import type { ReactNode } from "react";
import HomeInfoSidebar from "@/components/HomeInfoSidebar";

export default function CategorySidebarShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] items-start lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10 xl:gap-14">
      <div className="relative top-28 hidden px-4 py-12 lg:block xl:px-0">
        <HomeInfoSidebar />
      </div>
      <div className="min-w-0">
        {children}
        <div className="px-4 pb-16 lg:hidden">
          <HomeInfoSidebar />
        </div>
      </div>
    </div>
  );
}
