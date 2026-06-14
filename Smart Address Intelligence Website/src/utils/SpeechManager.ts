export class SpeechManager {
    private static instance: SpeechManager;
    private synthesis: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];

    private constructor() {
        this.synthesis = window.speechSynthesis;
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                this.voices = this.synthesis.getVoices();
            };
        }
    }

    public static getInstance(): SpeechManager {
        if (!SpeechManager.instance) {
            SpeechManager.instance = new SpeechManager();
        }
        return SpeechManager.instance;
    }

    public speak(text: string, langCode: string = 'en-US'): void {
        if (!this.synthesis) return;

        // 1. Cancel strictly to clear queue
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // 2. Strong Voice Matching
        if (this.voices.length === 0) {
            this.voices = this.synthesis.getVoices();
        }

        // Priority: Exact Match -> Language Match -> Google/Microsoft version -> First available
        const voice = this.voices.find(v => v.lang === langCode) ||
            this.voices.find(v => v.lang.startsWith(langCode.split('-')[0]));

        if (voice) {
            utterance.voice = voice;
        }

        // 3. Error / End Handling
        utterance.onend = () => {
            // console.log('Speech finished');
        };
        utterance.onerror = (e) => {
            console.error('Speech error:', e);
            // If error is heavy, maybe reset?
            this.synthesis.cancel();
        };

        this.synthesis.speak(utterance);

        // 4. Watchdog for "hanging" synthesis (common Chrome bug)
        // If speaking but callback never fires, we force a resume
        if (this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    public cancel(): void {
        this.synthesis.cancel();
    }
}
