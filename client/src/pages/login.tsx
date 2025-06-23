import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";
import FloatingChatButton from "../components/floating-chat-button";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error("Identifiants incorrects");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Connecté", description: "Bienvenue " + data.user.name });
      setLocation("/");
    } catch (error) {
      toast({ title: "Erreur", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm shadow">
        <CardHeader>
          <h2 className="text-lg font-semibold text-center">Connexion</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "Se connecter"}</Button>
          </form>
          <p className="text-xs text-center mt-3">
            Pas de compte ? <a href="/signup" className="text-medical-blue">S'inscrire</a>
          </p>
        </CardContent>
      </Card>
      
      {/* Floating Chat */}
      <FloatingChatButton
        gradientColors="from-blue-600 to-indigo-600"
        focusColor="blue-500"
        shadowColor="blue-500/25"
      />
    </div>
  );
} 