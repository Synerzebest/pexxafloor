import type { ReactNode } from "react";
import HomeInfoSidebar from "@/components/HomeInfoSidebar";

export default function CategorySidebarShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1500px] items-start lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10 xl:gap-14">
      {/* Left margin on every width: the grid itself is edge to edge below 1500px */}
      <div className="relative top-28 hidden py-12 pl-6 lg:block xl:pl-8">
        <HomeInfoSidebar />
      </div>
      <div className="min-w-0">
        {children}
        <div className="px-4 pb-16 sm:px-6 lg:hidden">
          <HomeInfoSidebar />
        </div>
      </div>
    </div>
  );
}
