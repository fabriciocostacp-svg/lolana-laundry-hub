import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Lock, User, HelpCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import lolanaLogo from "@/assets/lolana.png";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Forgot password states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"phone" | "result">("phone");
  const [forgotPhone, setForgotPhone] = useState("");
  const [foundUser, setFoundUser] = useState<{ nome: string; usuario: string; senha: string } | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(username, password);
    if (success) {
      toast.success("Bem-vindo à Lolana Lavanderia!");
      navigate("/clientes");
    } else {
      toast.error("Usuário ou senha incorretos!");
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotPhone.trim()) {
      toast.error("Digite o número de telefone!");
      return;
    }

    setIsForgotLoading(true);

    try {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("nome, usuario, senha")
        .eq("telefone", forgotPhone)
        .eq("ativo", true)
        .single();

      if (error || !data) {
        toast.error("Telefone não encontrado no sistema!");
        setFoundUser(null);
      } else {
        setFoundUser(data);
        setForgotStep("result");
        toast.success("Usuário encontrado!");
      }
    } catch {
      toast.error("Erro ao buscar usuário!");
    }

    setIsForgotLoading(false);
  };

  const resetForgotDialog = () => {
    setForgotStep("phone");
    setForgotPhone("");
    setFoundUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(210,100%,50%)] via-[hsl(210,100%,45%)] to-[hsl(215,70%,25%)] flex items-center justify-center p-4">
      {/* Bubbles decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: "3s" }} />
        <div className="absolute top-40 right-20 w-6 h-6 md:w-8 md:h-8 bg-white/15 rounded-full animate-bounce" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
        <div className="absolute bottom-32 left-1/4 w-8 h-8 md:w-12 md:h-12 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-1/4 w-4 h-4 md:w-6 md:h-6 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: "2.5s" }} />
        <div className="absolute bottom-20 right-10 w-8 h-8 md:w-10 md:h-10 bg-white/10 rounded-full animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.3s" }} />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden mx-4">
        <CardHeader className="text-center pb-2 pt-6 md:pt-8">
          <div className="flex justify-center mb-4">
            <img 
              src={lolanaLogo} 
              alt="Lolana Lavanderia" 
              className="w-28 h-28 md:w-40 md:h-40 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[hsl(215,70%,25%)]">
            Bem-vindo!
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Faça login para acessar o sistema
          </p>
        </CardHeader>
        <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-[hsl(215,70%,25%)]">
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 border-[hsl(210,100%,90%)] focus:border-[hsl(210,100%,50%)] transition-colors"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[hsl(215,70%,25%)]">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-2 border-[hsl(210,100%,90%)] focus:border-[hsl(210,100%,50%)] transition-colors"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-lg font-semibold bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] hover:from-[hsl(210,100%,45%)] hover:to-[hsl(215,70%,30%)] shadow-lg transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                resetForgotDialog();
                setForgotOpen(true);
              }}
              className="text-[hsl(210,100%,50%)] hover:text-[hsl(210,100%,40%)] gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              Esqueci minha senha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={(open) => {
        setForgotOpen(open);
        if (!open) resetForgotDialog();
      }}>
        <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(215,70%,25%)] flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Recuperar Senha
            </DialogTitle>
          </DialogHeader>

          {forgotStep === "phone" ? (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Digite o número de telefone cadastrado para recuperar sua senha.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgotPhone">Telefone Cadastrado</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="forgotPhone"
                    placeholder="(00) 00000-0000"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl w-full sm:w-auto">Cancelar</Button>
                </DialogClose>
                <Button
                  onClick={handleForgotPassword}
                  className="rounded-xl bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] w-full sm:w-auto"
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? "Buscando..." : "Buscar"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {foundUser ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-800 font-medium mb-2">Usuário encontrado!</p>
                    <div className="space-y-1 text-sm">
                      <p><strong>Nome:</strong> {foundUser.nome}</p>
                      <p><strong>Usuário:</strong> {foundUser.usuario}</p>
                      <p><strong>Senha:</strong> {foundUser.senha}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Por segurança, altere sua senha após fazer login.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">Telefone não encontrado no sistema.</p>
                </div>
              )}
              <DialogFooter>
                <Button
                  onClick={() => setForgotOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] w-full"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
