import { Stethoscope, LogOut, Clock, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../hooks/use-current-user";
import NotificationsPanel from "./notifications-panel";
import { queryClient } from "../lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function NavLink({ href, label }: { href: string; label: string }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href} className={`px-1 pt-1 pb-4 text-sm font-medium transition-colors ${
      isActive 
        ? "text-medical-blue border-b-2 border-medical-blue" 
        : "text-slate-500 hover:text-slate-700"
    }`}>
      {label}
    </Link>
  );
}

function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (!lastActivity) return;

      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      const timeRemaining = (20 * 60 * 1000) - timeSinceLastActivity; // 20 minutes

      if (timeRemaining <= 0) {
        setTimeLeft("Session expirée");
        return;
      }

      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
      <Clock className="h-3 w-3 mr-1" />
      {timeLeft}
    </div>
  );
}

export default function Header() {
  const { data: currentUser } = useCurrentUser();
  const displayName = currentUser?.name || currentUser?.username || "Invité";
  const [, navigate] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("lastActivity");
    localStorage.removeItem("user");
    queryClient.clear();
    navigate("/login");
  };

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n.charAt(0).toUpperCase())
    .join("");

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Stethoscope className="text-medical-blue text-2xl mr-3" />
              <h1 className="text-xl font-bold text-slate-900">MediAssist</h1>
            </div>
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <NavLink href="/" label="Tableau de Bord" />
              <NavLink href="/patients" label="Patients" />
              <NavLink href="/consultations" label="Consultations" />
              <NavLink href="/appointments" label="Rendez-vous" />
              <NavLink href="/certificates" label="Certificats" />
              <NavLink href="/prescriptions" label="Ordonnances" />
              <NavLink href="/assistant-ia" label="Assistant IA" />
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationsPanel />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{initials}</span>
                  </div>
                  <span className="text-sm text-slate-600 hidden sm:block">{displayName}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">{initials}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{displayName}</p>
                      <p className="text-xs text-slate-500">Médecin</p>
                    </div>
                  </div>
                </div>
                
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Session: </span>
                    <SessionTimer />
                  </div>
                </div>
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}