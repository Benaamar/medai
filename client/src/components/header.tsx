import { Stethoscope, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCurrentUser } from "../hooks/use-current-user";
import NotificationsPanel from "./notifications-panel";

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

export default function Header() {
  const { data: currentUser } = useCurrentUser();
  const displayName = currentUser?.name || currentUser?.username || "Invité";
  const [, navigate] = useLocation();

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n.charAt(0).toUpperCase())
    .join("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    window.location.reload();
  };

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
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{currentUser ? "Connecté" : "Hors connexion"}</p>
              </div>
              <div className="h-8 w-8 bg-medical-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{initials}</span>
              </div>
              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-slate-600"
                  title="Se déconnecter"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}