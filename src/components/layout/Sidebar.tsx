import { useState } from "react";
import { Users, Package, ClipboardList, LogOut, Menu, UserCog } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import lolanaLogo from "@/assets/lolana.png";

const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();

  const menuItems = [
    { icon: Users, label: "Clientes", path: "/clientes" },
    { icon: Package, label: "Serviços", path: "/servicos" },
    { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
    ...(currentUser?.permissions.is_admin ? [{ icon: UserCog, label: "Funcionários", path: "/funcionarios" }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
    onItemClick?.();
  };

  return (
    <>
      <div className="p-4 border-b border-white/20">
        <div className="flex flex-col items-center">
          <img 
            src={lolanaLogo} 
            alt="Lolana Lavanderia" 
            className="w-24 h-24 md:w-28 md:h-28 object-contain drop-shadow-lg"
          />
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onItemClick}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    "hover:bg-white/20 hover:shadow-lg",
                    isActive && "bg-white/25 shadow-lg backdrop-blur-sm"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/20 space-y-4">
        {currentUser && (
          <div className="text-xs text-white/70 text-center mb-2">
            Olá, <span className="font-semibold">{currentUser.nome}</span>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-white hover:bg-white/20 hover:text-white rounded-xl"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
        <p className="text-xs text-white/50 text-center">
          © 2024 Lolana Lavanderia
        </p>
      </div>
    </>
  );
};

export const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <img 
            src={lolanaLogo} 
            alt="Lolana Lavanderia" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-white font-bold text-lg">Lolana</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="p-0 w-64 bg-gradient-to-b from-[hsl(210,100%,50%)] via-[hsl(210,100%,45%)] to-[hsl(215,70%,25%)] text-white border-0"
          >
            <SidebarContent onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-[hsl(210,100%,50%)] via-[hsl(210,100%,45%)] to-[hsl(215,70%,25%)] text-white flex-col shadow-2xl z-50">
        <SidebarContent />
      </aside>
    </>
  );
};
