import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Mic, MicOff, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
  gradientColors: string;
  focusColor: string;
}

export default function FloatingChat({ isOpen, onClose, gradientColors, focusColor }: FloatingChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 Bonjour ! Je suis votre assistant IA médical. 

Aujourd'hui nous sommes le ${new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})} à ${new Date().toLocaleTimeString('fr-FR', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}.

Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<any>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsProcessing(true);

    try {
      // Appel à l'API AI générique
      const response = await fetch("/api/ai-assistant/general-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: inputMessage,
          messageHistory: messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "Je suis désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Je suis désolé, une erreur s'est produite. Veuillez réessayer plus tard.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Erreur de communication",
        description: "Impossible de contacter l'assistant IA. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      // Vérifier si la reconnaissance vocale est supportée
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        throw new Error("La reconnaissance vocale n'est pas supportée par votre navigateur. Utilisez Chrome ou Edge.");
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        toast({
          title: "Reconnaissance vocale activée",
          description: "Parlez maintenant, cliquez à nouveau pour arrêter.",
        });
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInputMessage(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Erreur de reconnaissance vocale:', event.error);
        setIsRecording(false);
        
        let errorMessage = "Erreur de reconnaissance vocale";
        if (event.error === 'not-allowed') {
          errorMessage = "Permission microphone refusée. Autorisez l'accès au microphone.";
        } else if (event.error === 'network') {
          errorMessage = "Erreur réseau. Vérifiez votre connexion internet.";
        }
        
        toast({
          title: "Erreur de reconnaissance",
          description: errorMessage,
          variant: "destructive",
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
        toast({
          title: "Reconnaissance terminée",
          description: "Vous pouvez modifier le texte et l'envoyer.",
        });
      };

      // Stocker la référence pour pouvoir l'arrêter
      mediaRecorderRef.current = recognition as any;
      recognition.start();
      
    } catch (error) {
      console.error('Erreur lors du démarrage de la reconnaissance:', error);
      toast({
        title: "Erreur de reconnaissance vocale",
        description: error instanceof Error ? error.message : "Impossible de démarrer la reconnaissance vocale.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Reconnaissance vocale arrêtée",
        description: "Vous pouvez maintenant envoyer votre message.",
      });
    }
  };



  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 max-h-96 flex flex-col backdrop-blur-sm">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r ${gradientColors} text-white rounded-t-2xl`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <span className="font-semibold">Assistant IA</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 min-h-0">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    message.role === 'user'
                      ? `bg-gradient-to-r ${gradientColors} text-white`
                      : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  <p className="leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-white/70' : 'text-slate-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-500">L'assistant réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isRecording ? "Reconnaissance vocale en cours..." : "Tapez ou parlez..."}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-${focusColor} focus:border-transparent disabled:opacity-50`}
            />
            
            {/* Bouton Microphone */}
            <button 
              onClick={handleVoiceToggle}
              disabled={isProcessing}
              className={`px-3 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : `bg-gradient-to-r ${gradientColors} text-white hover:opacity-90`
              }`}
              title={isRecording ? "Arrêter la reconnaissance vocale" : "Commencer la reconnaissance vocale"}
            >
              {isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            {/* Bouton Envoyer */}
            <button 
              onClick={handleSendMessage}
              disabled={isProcessing || !inputMessage.trim()}
              className={`bg-gradient-to-r ${gradientColors} text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Indicateur de reconnaissance vocale */}
          {isRecording && (
            <div className="mt-2 flex items-center justify-center space-x-2 text-red-500 animate-pulse">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-xs font-medium">Reconnaissance vocale active...</span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 