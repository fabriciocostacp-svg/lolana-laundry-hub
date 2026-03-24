import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BackupButton } from "@/components/BackupButton";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <Sidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 md:p-6 lg:p-8 safe-bottom">
        <header className="mb-4 md:mb-6 lg:mb-8 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground animate-fade-in">
            {title}
          </h1>
          <BackupButton />
        </header>
        <div className="animate-fade-in pb-4">{children}</div>
      </main>
    </div>
  );
};
