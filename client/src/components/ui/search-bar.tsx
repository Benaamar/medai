import React from "react";
import { Search } from "lucide-react";
import { Input } from "./input";
import { useSearch } from "../../hooks/use-search";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  delay?: number;
  className?: string;
}

export default function SearchBar({ placeholder="Rechercher...", onSearch, delay=300, className="" }: SearchBarProps) {
  const { query, setQuery, debounced } = useSearch("", delay);

  // call parent when debounced changes
  React.useEffect(()=>{ onSearch(debounced); }, [debounced]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e)=>setQuery(e.target.value)}
        className="pl-10"
      />
    </div>
  );
} 