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
      <main className="ml-64 p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground animate-fade-in">
            {title}
          </h1>
        </header>
        <div className="animate-fade-in">{children}</div>
      </main>
    </div>
  );
};
