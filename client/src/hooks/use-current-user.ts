import { useQuery } from "@tanstack/react-query";

export function useCurrentUser() {
  const query = useQuery<{ id: number; name: string; username: string; role: string } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (res.status === 401) {
          // Token invalide, on le supprime
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return null;
        }
        
        if (!res.ok) {
          throw new Error("Erreur fetch user");
        }
        
        return res.json();
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return query;
} 