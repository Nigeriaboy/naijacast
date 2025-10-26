import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import { createWavBlobFromPcm, decode } from '../utils/audioUtils';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const NEWS_PROMPT = `
Create a detailed summary of today's most important news stories from Nigeria, covering various sectors like politics, economy, technology, and social issues.
Source your information from reputable Nigerian news outlets like punch.ng, The Vanguard, and The Nation newspaper.
Present the summary as a conversational dialogue script between two podcast hosts, Bayo and Chioma.
Start the podcast with a brief, friendly introduction. For example: Bayo: "Welcome to Naija NewsCast, your daily briefing on all things Nigeria! What's leading the news today, Chioma?"
Ensure the dialogue flows naturally, with each host contributing to the discussion of the news items.
The entire script should be what is TTS'd.
`;

export async function getNewsSummaryAndSources() {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: NEWS_PROMPT,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const summary = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { summary, sources };
}

export async function generateAudioFromText(text: string): Promise<Blob> {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                multiSpeakerVoiceConfig: {
                    speakerVoiceConfigs: [
                        {
                            speaker: 'Bayo',
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Puck' }
                            }
                        },
                        {
                            speaker: 'Chioma',
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: 'Kore' }
                            }
                        }
                    ]
                }
            }
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from TTS API.");
    }

    const audioBytes = decode(base64Audio);
    return createWavBlobFromPcm(audioBytes);
}

export async function getLowLatencyText(prompt: string): Promise<string> {
    const response: GenerateContentResponse = await ai.models.generateContent({
        // Fix: Use the recommended model name for gemini flash lite.
        model: 'gemini-flash-lite-latest',
        contents: prompt,
        config: {
            systemInstruction: 'You are a helpful assistant answering questions about Nigerian news. Be concise and quick.',
        }
    });
    return response.text;
}

export async function getComplexAnalysis(prompt: string): Promise<string> {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: 'You are an expert analyst. Provide detailed, thoughtful, and well-reasoned responses to complex questions about Nigerian affairs.',
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
}