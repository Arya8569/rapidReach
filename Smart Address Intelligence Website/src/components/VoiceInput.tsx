import React, { useEffect } from 'react';
import { Mic, MicOff, Globe } from 'lucide-react';
import { useMultilingualSpeech } from '../hooks/useMultilingualSpeech';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceInputProps {
    onTranscriptChange: (text: string) => void;
    onListeningStateChange?: (isListening: boolean) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
    onTranscriptChange,
    onListeningStateChange
}) => {
    const {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        languages,
        selectedLanguage,
        setSelectedLanguage
    } = useMultilingualSpeech();

    // Propagate transcript changes
    useEffect(() => {
        const fullText = (transcript + ' ' + interimTranscript).trim();
        if (fullText) {
            onTranscriptChange(fullText);
        }
    }, [transcript, interimTranscript, onTranscriptChange]);

    // Propagate state changes
    useEffect(() => {
        if (onListeningStateChange) {
            onListeningStateChange(isListening);
        }
    }, [isListening, onListeningStateChange]);

    return (
        <div className="flex flex-col gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => setSelectedLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${selectedLanguage === lang.code
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {selectedLanguage === lang.code && <Globe className="w-3 h-3" />}
                        {lang.name}
                    </button>
                ))}
            </div>

            {/* Mic Button & Status */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${isListening
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700'
                            }`}
                    >
                        <AnimatePresence mode="wait">
                            {isListening ? (
                                <motion.div
                                    key="listening"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                >
                                    <MicOff className="w-5 h-5" />
                                    <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-75"></span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                >
                                    <Mic className="w-5 h-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>

                    <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${isListening ? 'text-red-600' : 'text-slate-700'}`}>
                            {isListening ? 'Listening...' : 'Tap Mic to Speak'}
                        </span>
                        <span className="text-xs text-slate-400">
                            {isListening ? 'Speak your address clearly' : 'Supports 10+ Indian Languages'}
                        </span>
                    </div>
                </div>

                {isListening && (
                    <div className="flex gap-1 h-4 items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.div
                                key={i}
                                className="w-1 bg-red-500 rounded-full"
                                animate={{ height: [4, 16, 4] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.1
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Live Transcript Preview */}
            <AnimatePresence>
                {(transcript || interimTranscript) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-sm"
                    >
                        <span className="text-slate-700">{transcript}</span>
                        <span className="text-slate-400 italic">{interimTranscript}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
