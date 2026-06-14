import React, { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Bot, User, Globe, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    timestamp: Date;
}

const LANGUAGES = [
    { code: 'English', label: 'English', native: 'English' },
    { code: 'Hindi', label: 'Hindi', native: 'हिंदी' },
    { code: 'Marathi', label: 'Marathi', native: 'मराठी' },
    { code: 'Gujarati', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'Tamil', label: 'Tamil', native: 'தமிழ்' },
    { code: 'Telugu', label: 'Telugu', native: 'తెలుగు' },
    { code: 'Kannada', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const Chatbot = () => {
    const [language, setLanguage] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleLanguageSelect = (lang: string) => {
        setLanguage(lang);
        // Add welcome message
        setMessages([{
            id: 'welcome',
            role: 'ai',
            text: `Namaste! I am your Smart Address Assistant. I will speak in ${lang}. Ask me how to use the app or ask for directions!`,
            timestamp: new Date()
        }]);
    };

    const sendMessage = async () => {
        if (!input.trim() || !language) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMsg.text,
                    language: language,
                    history: messages.map(m => ({ role: m.role, content: m.text })).slice(-4)
                }),
            });

            const data = await response.json();

            if (data.action === 'navigate') {
                const replyText = data.reply_text || "Redirecting to Google Maps...";
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'ai',
                    text: replyText,
                    timestamp: new Date()
                }]);

                // Handle Redirection
                setTimeout(() => {
                    const source = data.source === 'Current Location' ? '' : encodeURIComponent(data.source);
                    const dest = encodeURIComponent(data.destination);
                    // If source is empty, Google Maps uses current location by default usually, but 'origin' param might be needed empty
                    // Standard format: https://www.google.com/maps/dir/?api=1&origin=...&destination=...
                    // If origin is missing, user might need to input it, OR we leave it blank for 'My Location'
                    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
                    if (source) {
                        url += `&origin=${source}`;
                    }
                    window.open(url, '_blank');
                }, 1500);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'ai',
                    text: data.response || "Sorry, I couldn't understand that.",
                    timestamp: new Date()
                }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                text: "Network error. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!language) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Select Language</h2>
                    <p className="text-slate-500">Choose your preferred language to start chatting</p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    {LANGUAGES.map((lang) => (
                        <motion.button
                            key={lang.code}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all text-left"
                        >
                            <div className="font-bold text-slate-800">{lang.native}</div>
                            <div className="text-xs text-slate-500">{lang.label}</div>
                        </motion.button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">AI Assistant</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Speaking {language}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setLanguage(null)}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                >
                    Change Language
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`
                  max-w-[80%] p-4 rounded-2xl shadow-sm
                  ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                    }
                `}
                            >
                                <div className="text-sm leading-relaxed">{msg.text}</div>
                                <div className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 shadow-sm flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t">
                <div className="max-w-4xl mx-auto relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder={`Ask navigation questions in ${language}...`}
                        className="flex-1 bg-slate-100 border-0 rounded-full px-6 py-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
