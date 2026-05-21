/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Volume2, AlertCircle, HelpCircle, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { VoiceParsingResponse } from '../types';

interface VoiceToOrderProps {
  onTicketParsed: (ticket: VoiceParsingResponse) => void;
}

export default function VoiceToOrder({ onTicketParsed }: VoiceToOrderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [lastParsed, setLastParsed] = useState<VoiceParsingResponse | null>(null);

  // Suggested pre-backed prompts for easy testing & offline redundancy
  const vocalDemos = [
    { text: "My Samsung S23 charging port is broken. Please pick it up tomorrow morning.", title: "Samsung Port (Pickup)" },
    { text: "Fix my iPhone 14 screen immediately. It is cracked and bleeding color. I will walk in.", title: "iPhone Screen (Walk-in)" },
    { text: "Help with Tecno Spark 10 Pro diagnostics. The battery dies in 2 hours. Very urgent.", title: "Tecno Battery (Urgent)" }
  ];

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechClass) {
      const recInstance = new SpeechClass();
      recInstance.continuous = false;
      recInstance.interimResults = false;
      recInstance.lang = 'en-US';

      recInstance.onstart = () => {
        setIsListening(true);
        setErrorStatus(null);
        setTranscript('Listening to your request...');
      };

      recInstance.onerror = (e: any) => {
        console.error("Speech Recognition Error: ", e);
        if (e.error === 'not-allowed') {
          setErrorStatus('Microphone permission blocked. Please check your browser settings or select a sample voice request below.');
        } else {
          setErrorStatus(`Speech capture issue (${e.error}). Use a sample demo request to test!`);
        }
        setIsListening(false);
      };

      recInstance.onend = () => {
        setIsListening(false);
      };

      recInstance.onresult = (e: any) => {
        const textResult = e.results[0][0].transcript;
        setTranscript(textResult);
        submitToVoiceParser(textResult);
      };

      setRecognition(recInstance);
    } else {
      setErrorStatus("Web Speech API microphone inputs are not natively supported in this browser. Try our preloaded vocal demos below!");
    }
  }, []);

  const handleToggleListen = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      setErrorStatus(null);
      setTranscript('');
      try {
        recognition?.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        // Fallback simulation mode
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          const randDemo = vocalDemos[Math.floor(Math.random() * vocalDemos.length)].text;
          setTranscript(randDemo);
          submitToVoiceParser(randDemo);
        }, 3000);
      }
    }
  };

  const submitToVoiceParser = async (text: string) => {
    if (!text.trim() || text === 'Listening to your request...') return;
    setIsProcessing(true);
    setErrorStatus(null);

    try {
      const response = await fetch('/api/ai/voice-to-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceText: text })
      });

      if (!response.ok) {
        throw new Error('Parser API request failed');
      }

      const parsedTicket: VoiceParsingResponse = await response.json();
      setLastParsed(parsedTicket);
      onTicketParsed(parsedTicket);
    } catch (err) {
      console.error("Voice parsing error:", err);
      setErrorStatus("Failed to process your spoken request correctly. Try inputting manually or choosing another demo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fireDemo = (text: string) => {
    setTranscript(text);
    submitToVoiceParser(text);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-primary-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-indigo-800/40">
      {/* Background radial accent glow */}
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-accent-500/10 blur-3xl pointer-events-none"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="text-left space-y-1.5 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 px-3 py-1 rounded-full text-xs text-indigo-300 font-medium border border-indigo-500/20">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400 fill-indigo-400" />
            <span>Voice-to-Order AI Engine</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight font-display text-white">Speak Your Service Request</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Allowing informal customers to easily place requests in a single breath. Just declare your phone brand, issue and preferred details.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleToggleListen}
            disabled={isProcessing}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-all duration-300 active:scale-95 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/20 text-white'
                : 'bg-primary-500 hover:bg-primary-600 hover:-translate-y-0.5 text-white'
            }`}
            id="voice-mic-trigger-btn"
            title="Start Speaking"
          >
            {isListening ? (
              <MicOff className="h-7 w-7" />
            ) : (
              <Mic className="h-7 w-7" />
            )}
          </button>
          
          <div className="text-left">
            <span className="text-[10px] text-indigo-300 font-bold tracking-wider block font-mono">STATUS</span>
            <span className="text-xs font-semibold">
              {isListening ? 'Listening...' : isProcessing ? 'AI Transcribing...' : 'Tap Mic to Speak'}
            </span>
          </div>
        </div>
      </div>

      {/* Transcript Log area */}
      {transcript && (
        <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-left relative" id="voice-transcript-wrapper">
          <span className="text-[9px] text-indigo-300 font-mono absolute top-2 right-3 uppercase font-semibold">Live Transcript</span>
          <p className="text-sm font-medium text-slate-100 pr-16 leading-relaxed italic">
            "{transcript}"
          </p>
          {isProcessing && (
            <div className="mt-2.5 flex items-center gap-2 text-indigo-300 text-xs">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary-500"></span>
              </span>
              <span>Gemini structuring data payload...</span>
            </div>
          )}
        </div>
      )}

      {/* Error alert */}
      {errorStatus && (
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 text-left flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>{errorStatus}</p>
        </div>
      )}

      {/* Structured Ticket feedback review */}
      {lastParsed && !isProcessing && (
        <div className="mt-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left animate-slide-up">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-2.5">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>AI Voice Parser parsed ticket details successfully!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Brand / Model</span>
              <span className="font-semibold text-slate-200">{lastParsed.brand} {lastParsed.model}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Urgency / Service</span>
              <span className="font-semibold text-slate-100 capitalize">{lastParsed.urgency} Urgency • {lastParsed.type}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Predicted Issue</span>
              <span className="font-semibold text-slate-200 truncate block" title={lastParsed.possibleIssue}>{lastParsed.possibleIssue}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Est. Price Range</span>
              <span className="font-bold text-accent-300">GH₵{lastParsed.estimatedCostMin} - GH₵{lastParsed.estimatedCostMax}</span>
            </div>
          </div>
        </div>
      )}

      {/* Demo helper suggestions buttons */}
      <div className="mt-5 pt-4 border-t border-white/10 text-left">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono mb-2.5">Or try one of our preloaded vocal demos:</span>
        <div className="flex flex-wrap gap-2.5">
          {vocalDemos.map((demo, idx) => (
            <button
              key={idx}
              onClick={() => fireDemo(demo.text)}
              disabled={isListening || isProcessing}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 hover:bg-indigo-600/20 hover:border-indigo-500 transition-all font-medium disabled:opacity-40"
            >
              <Play className="h-3 w-3 fill-slate-200 text-slate-200" />
              <span>{demo.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
