import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import FloatingChatButton from "@/components/floating-chat-button";

export default function Signup() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name })
      });
      if (!res.ok) throw new Error("Erreur lors de l'inscription");
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({ title: "Compte créé", description: "Bienvenue " + data.user.name });
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
          <h2 className="text-lg font-semibold text-center">Inscription</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "..." : "Créer le compte"}</Button>
          </form>
          <p className="text-xs text-center mt-3">
            Vous avez déjà un compte ? <a href="/login" className="text-medical-blue">Se connecter</a>
          </p>
        </CardContent>
      </Card>
      
      {/* Floating Chat */}
      <FloatingChatButton
        gradientColors="from-green-600 to-emerald-600"
        focusColor="green-500"
        shadowColor="green-500/25"
      />
    </div>
  );
} 