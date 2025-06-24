import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    console.error(`Erreur API: ${res.status}: ${text}`);
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Requête API: ${method} ${url}`);
  try {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`Réponse API: ${method} ${url} - Status: ${res.status}`);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Erreur lors de la requête API: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Exécution de la requête avec QueryKey:`, queryKey);
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Retour null pour 401 sur ${queryKey[0]}`);
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`Données reçues pour ${queryKey[0]}:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      onError: (error) => {
        console.error("Erreur de requête:", error);
      }
    },
    mutations: {
      retry: false,
      onError: (error) => {
        console.error("Erreur de mutation:", error);
      }
    },
  },
});
