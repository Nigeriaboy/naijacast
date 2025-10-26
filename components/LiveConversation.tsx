import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode, decode, decodeAudioData, createBlob } from '../utils/audioUtils';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { MicrophoneIcon, StopCircleIcon } from './icons/SimpleIcons';

type ConversationStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type Transcription = { user?: string; model?: string };

export const LiveConversation: React.FC = () => {
    const [status, setStatus] = useState<ConversationStatus>('disconnected');
    const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const stopConversation = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
                session.close();
            }).catch(console.error);
            sessionPromiseRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if(scriptProcessorRef.current){
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        setStatus('disconnected');
    }, []);

    const startConversation = useCallback(async () => {
        setStatus('connecting');
        setError(null);
        setTranscriptions([]);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';

        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY environment variable not set.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Fix: Cast window to any to support webkitAudioContext for older browsers.
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // Fix: Cast window to any to support webkitAudioContext for older browsers.
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            let nextStartTime = 0;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        if (!audioContextRef.current) return;
                        
                        const source = audioContextRef.current.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;

                        const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = createBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription?.text) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription?.text) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }

                        if(message.serverContent?.turnComplete) {
                           const userInput = currentInputTranscriptionRef.current.trim();
                           const modelOutput = currentOutputTranscriptionRef.current.trim();
                           if(userInput || modelOutput) {
                                setTranscriptions(prev => [...prev, {user: userInput, model: modelOutput}]);
                           }
                           currentInputTranscriptionRef.current = '';
                           currentOutputTranscriptionRef.current = '';
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContext.destination);
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        setError('A connection error occurred.');
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                    systemInstruction: "You are a friendly AI news assistant with a Nigerian persona. Your very first response in this conversation MUST be a warm and friendly greeting, such as 'Hello! Welcome to Naija NewsCast. How can I help you with today's news?'. After the initial greeting, continue the conversation by answering the user's questions.",
                },
            });
        } catch (err) {
            console.error('Failed to start conversation:', err);
            setError('Could not access microphone or start session. Please check permissions.');
            setStatus('error');
        }
    }, [stopConversation]);
    
    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    return (
        <div className="bg-gray-800/50 rounded-2xl p-4 md:p-6 shadow-lg border border-gray-700 backdrop-blur-sm">
            <p className="text-gray-400 text-sm mb-4">Have a real-time voice conversation with the AI. Powered by Gemini Live API.</p>
            <div className="flex justify-center mb-4">
                {status !== 'connected' && status !== 'connecting' && (
                    <button onClick={startConversation} className="flex items-center px-6 py-3 bg-emerald-600 rounded-full text-white font-bold hover:bg-emerald-500 transition-colors">
                        <MicrophoneIcon className="w-6 h-6 mr-2" /> Start Conversation
                    </button>
                )}
                {(status === 'connected' || status === 'connecting') && (
                    <button onClick={stopConversation} className="flex items-center px-6 py-3 bg-red-600 rounded-full text-white font-bold hover:bg-red-500 transition-colors">
                        <StopCircleIcon className="w-6 h-6 mr-2" /> Stop Conversation
                    </button>
                )}
            </div>
            <div className="text-center mb-4 font-mono text-sm uppercase"
                style={{
                    color: status === 'connected' ? '#34d399' : (status === 'connecting' ? '#fbbf24' : '#9ca3af')
                }}>
                {status}
            </div>
            
            <div className="h-64 bg-gray-900/70 rounded-lg p-4 overflow-y-auto space-y-4">
                {transcriptions.map((t, i) => (
                    <div key={i}>
                        {t.user && <p className="text-emerald-300"><strong className="font-semibold">You:</strong> {t.user}</p>}
                        {t.model && <p className="text-gray-300"><strong className="font-semibold">AI:</strong> {t.model}</p>}
                    </div>
                ))}
                {status === 'connecting' && <LoadingSpinner className="w-8 h-8 mx-auto text-emerald-400" />}
            </div>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
    );
};