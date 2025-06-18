import { Stethoscope, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

function NavLink({ href, label }: { href: string; label: string }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <a className={`px-1 pt-1 pb-4 text-sm font-medium transition-colors ${
        isActive 
          ? "text-medical-blue border-b-2 border-medical-blue" 
          : "text-slate-500 hover:text-slate-700"
      }`}>
        {label}
      </a>
    </Link>
  );
}

export default function Header() {
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
              <NavLink href="/assistant-ia" label="Assistant IA" />
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-400 hover:text-slate-500 relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 bg-medical-red text-white text-xs h-5 w-5 flex items-center justify-center p-0 rounded-full">
                3
              </Badge>
            </button>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Dr. Marie Dubois</p>
                <p className="text-xs text-slate-500">Médecin Généraliste</p>
              </div>
              <div className="h-8 w-8 bg-medical-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">MD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}