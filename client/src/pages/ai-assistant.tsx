import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, Wand2, FileText, Pill, Mail, Eye, Download, Share, Trash2, Filter, Menu, X, Send, Sparkles, Brain } from "lucide-react";
import Header from "../components/header";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { apiRequest, queryClient } from "../lib/queryClient";
import type { AiSummaryWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AiAssistant from "../components/ai-assistant";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import FloatingChatButton from "../components/floating-chat-button";

export default function AiAssistantPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  const { data: allSummaries, isLoading: summariesLoading } = useQuery<AiSummaryWithDetails[]>({
    queryKey: ["/api/ai-summaries"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ai-summaries/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Résumé supprimé avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-summaries"] });
    },
  });

  const filteredSummaries = allSummaries?.filter(summary => 
    typeFilter === "all" || summary.type === typeFilter
  ) || [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
      case 'prescription': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'certificate': return 'bg-gradient-to-r from-amber-500 to-orange-500';
      default: return 'bg-gradient-to-r from-slate-500 to-slate-600';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'consultation': return 'Consultation';
      case 'prescription': return 'Prescription';
      case 'certificate': return 'Certificat';
      default: return 'Autre';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return FileText;
      case 'prescription': return Pill;
      case 'certificate': return Mail;
      default: return Bot;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center">
                  <Brain className="h-8 w-8 mr-3 text-purple-200" />
            Assistant IA Médical
          </h1>
                <p className="text-purple-100 text-lg">
                  Votre compagnon intelligent pour la pratique médicale
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center text-purple-100">
                    <Sparkles className="h-5 w-5 mr-2" />
                    <span className="font-medium">Alimenté par l'IA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Chat Area */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Chat Assistant</h2>
                    <p className="text-slate-600">Posez vos questions médicales</p>
                  </div>
                </div>
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden rounded-xl">
                      <Menu className="h-4 w-4 mr-2" />
                      Historique
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                    <SheetHeader>
                      <SheetTitle>Historique des Résumés</SheetTitle>
                      <SheetDescription>
                        Consultez tous vos résumés générés par l'IA
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6">
                      {/* Mobile version of summaries */}
                      <div className="space-y-4">
                        {filteredSummaries.map((summary) => {
                          const IconComponent = getTypeIcon(summary.type);
                          return (
                            <Card key={summary.id} className="border border-slate-200/50 rounded-xl">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${getTypeColor(summary.type)}`}>
                                      <IconComponent className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-slate-900">
                                        {summary.patient?.firstName} {summary.patient?.lastName}
                                      </h4>
                                      <p className="text-xs text-slate-500">
                                        {summary.generatedAt ? format(new Date(summary.generatedAt), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className={`${getTypeColor(summary.type)} text-white text-xs`}>
                                    {getTypeLabel(summary.type)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                  {summary.content}
                                </p>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" size="sm" className="rounded-lg">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Voir
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(summary.id)} className="rounded-lg text-red-600">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
            <div className="h-[700px]">
              <AiAssistant onViewSummary={() => {}} />
            </div>
          </div>
          
          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block space-y-6">
            {/* Filter Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2 text-purple-600" />
                Filtrer par type
              </h3>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Type de résumé" />
                    </SelectTrigger>
                <SelectContent className="rounded-xl">
                      <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="consultation">Consultations</SelectItem>
                      <SelectItem value="prescription">Prescriptions</SelectItem>
                  <SelectItem value="certificate">Certificats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

            {/* Summaries History */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Historique des Résumés
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {filteredSummaries.length} résumé{filteredSummaries.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                  {summariesLoading ? (
                  <div className="p-6 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        </div>
                      ))}
                  </div>
                ) : filteredSummaries.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-slate-600 text-sm">
                      {typeFilter === "all" ? "Aucun résumé généré" : "Aucun résumé de ce type"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredSummaries.map((summary) => {
                      const IconComponent = getTypeIcon(summary.type);
                      return (
                        <div key={summary.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm ${getTypeColor(summary.type)}`}>
                                <IconComponent className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-900 text-sm">
                                  {summary.patient?.firstName} {summary.patient?.lastName}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {summary.generatedAt ? format(new Date(summary.generatedAt), 'dd MMM yyyy', { locale: fr }) : 'Date inconnue'}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${getTypeColor(summary.type)} text-white text-xs px-2 py-1 rounded-full`}>
                              {getTypeLabel(summary.type)}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                            {summary.content}
                          </p>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs rounded-lg">
                              <Eye className="h-3 w-3 mr-1" />
                              Voir
                              </Button>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs rounded-lg">
                              <Download className="h-3 w-3 mr-1" />
                              Export
                              </Button>
                              <Button
                              variant="outline" 
                                size="sm"
                              onClick={() => deleteMutation.mutate(summary.id)}
                              className="h-7 px-2 text-xs rounded-lg text-red-600 hover:bg-red-50"
                              >
                              <Trash2 className="h-3 w-3" />
                              </Button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* Floating Chat Bubble */}
        {showFloatingChat && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 max-h-96 flex flex-col backdrop-blur-sm">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">Assistant IA</span>
                </div>
                <button 
                  onClick={() => setShowFloatingChat(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto bg-slate-50">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                  <p className="text-slate-700 text-sm leading-relaxed">
                    👋 Bonjour ! Je suis votre assistant IA médical. Comment puis-je vous aider aujourd'hui ?
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
                <div className="flex space-x-3">
                  <input 
                    type="text" 
                    placeholder="Tapez votre message..."
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Chat */}
        <FloatingChatButton
          gradientColors="from-purple-600 to-pink-600"
          focusColor="purple-500"
          shadowColor="purple-500/25"
        />
      </div>
    </div>
  );
}