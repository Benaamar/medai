import { Stethoscope, LogOut, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useCurrentUser } from "../hooks/use-current-user";
import NotificationsPanel from "./notifications-panel";
import { queryClient } from "../lib/queryClient";

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
            <div className="flex items-center justify-between gap-4">
              <SessionTimer />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-600">{initials}</span>
                </div>
                <span className="text-sm text-slate-600">{displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}