import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const quickReplies = [
  "How do I request a pickup?",
  "What are eco points?",
  "Track my pickup",
  "Contact support",
];

const botResponses: Record<string, string> = {
  "how do i request a pickup?": "To request a pickup, go to your Dashboard and click the 'Request Pickup' button. A driver will be assigned shortly! 🚛",
  "what are eco points?": "Eco Points are rewards you earn for every pickup, recycling, and eco-friendly action. Redeem them for free pickups, discounts, and badges! 🌱",
  "track my pickup": "You can track your pickup in real-time from the Map page. Your assigned driver's location updates live! 📍",
  "contact support": "You can reach our support team at support@ecotrack.com or call +234-800-ECO-TRACK. We're available 24/7! 📞",
};

function getBotResponse(text: string): string {
  const lower = text.toLowerCase().trim();
  for (const [key, response] of Object.entries(botResponses)) {
    if (lower.includes(key.split(" ").slice(0, 3).join(" "))) return response;
  }
  return "Thanks for your message! Our team will look into this. In the meantime, try the quick replies below for common questions. 😊";
}

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: "Hi there! 👋 I'm EcoBot. How can I help you today?", sender: "bot", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: `u${Date.now()}`, text, sender: "user", timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg: Message = { id: `b${Date.now()}`, text: getBotResponse(text), sender: "bot", timestamp: new Date() };
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-80 sm:w-96 h-[28rem] flex flex-col z-50 shadow-2xl border-border/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">EcoBot</p>
                <p className="text-[10px] opacity-80">Always here to help</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2", msg.sender === "user" && "flex-row-reverse")}>
                <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0", msg.sender === "bot" ? "bg-primary/10" : "bg-accent")}>
                  {msg.sender === "bot" ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-accent-foreground" />}
                </div>
                <div className={cn("max-w-[75%] rounded-xl px-3 py-2 text-sm", msg.sender === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground")}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => sendMessage(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-2 border-t border-border shrink-0">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="text-sm h-9"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105",
          isOpen ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
