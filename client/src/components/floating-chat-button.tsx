import { useState } from "react";
import { Bot } from "lucide-react";
import FloatingChat from "./floating-chat";

interface FloatingChatButtonProps {
  gradientColors: string;
  focusColor: string;
  shadowColor?: string;
}

export default function FloatingChatButton({ 
  gradientColors, 
  focusColor, 
  shadowColor 
}: FloatingChatButtonProps) {
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  return (
    <>
      {/* Floating Chat */}
      <FloatingChat
        isOpen={showFloatingChat}
        onClose={() => setShowFloatingChat(false)}
        gradientColors={gradientColors}
        focusColor={focusColor}
      />

      {/* Floating Chat Button */}
      {!showFloatingChat && (
        <button
          onClick={() => setShowFloatingChat(true)}
          className={`fixed bottom-6 right-6 z-50 bg-gradient-to-r ${gradientColors} text-white p-4 rounded-2xl shadow-2xl hover:opacity-90 transition-all duration-300 hover:scale-110 ${shadowColor ? `hover:shadow-${shadowColor}` : ''}`}
        >
          <Bot className="h-6 w-6" />
        </button>
      )}
    </>
  );
} 