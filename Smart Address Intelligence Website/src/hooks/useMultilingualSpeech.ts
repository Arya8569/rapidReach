import { useState, useRef, useCallback } from 'react';

// Define the SpeechRecognition type helper
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (event: Event) => void;
    onend: (event: Event) => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare global {
    interface Window {
        webkitSpeechRecognition: {
            new(): SpeechRecognition;
        };
        SpeechRecognition: {
            new(): SpeechRecognition;
        };
    }
}

export const useMultilingualSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Supported Indian Languages
    const languages = [
        { code: 'hi-IN', name: 'Hindi' },
        { code: 'en-IN', name: 'English (India)' },
        { code: 'mr-IN', name: 'Marathi' },
        { code: 'gu-IN', name: 'Gujarati' },
        { code: 'ta-IN', name: 'Tamil' },
        { code: 'te-IN', name: 'Telugu' },
        { code: 'kn-IN', name: 'Kannada' },
        { code: 'bn-IN', name: 'Bengali' },
        { code: 'ml-IN', name: 'Malayalam' },
        { code: 'pa-IN', name: 'Punjabi' }
    ];

    const [selectedLanguage, setSelectedLanguage] = useState(languages[0].code);

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Web Speech API is not supported in this browser. Please use Chrome.');
            return;
        }

        const SpeechRecognition = window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage;

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
            setInterimTranscript('');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let final = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }

            if (final) {
                setTranscript((prev) => prev + ' ' + final);
            }
            setInterimTranscript(interim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [selectedLanguage]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        languages,
        selectedLanguage,
        setSelectedLanguage
    };
};
