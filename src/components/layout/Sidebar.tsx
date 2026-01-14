import { Users, Package, ClipboardList, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import lolanaLogo from "@/assets/lolana.png";

const menuItems = [
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Package, label: "Serviços", path: "/servicos" },
  { icon: ClipboardList, label: "Pedidos", path: "/pedidos" },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-[hsl(210,100%,50%)] via-[hsl(210,100%,45%)] to-[hsl(215,70%,25%)] text-white flex flex-col shadow-2xl z-50">
      <div className="p-4 border-b border-white/20">
        <div className="flex flex-col items-center">
          <img 
            src={lolanaLogo} 
            alt="Lolana Lavanderia" 
            className="w-28 h-28 object-contain drop-shadow-lg"
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
    </aside>
  );
};
