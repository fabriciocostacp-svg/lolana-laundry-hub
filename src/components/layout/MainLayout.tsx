import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export const MainLayout = ({ children, title }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0 p-4 md:p-6 lg:p-8">
        <header className="mb-4 md:mb-6 lg:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground animate-fade-in">
            {title}
          </h1>
        </header>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
};
