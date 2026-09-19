import React, { useState } from 'react';
import type { NormalizedBatteryState } from '../../types/telemetry';
import { ArrowLeft, MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';

interface AssistantDrawerProps {
  batteryState: NormalizedBatteryState;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({ batteryState, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hello! I am BRAIN Conversational AI. I am monitoring your live simulated battery pack (Voltage: ${batteryState.voltage}V, Current: ${batteryState.current}A, SOC: ${batteryState.soc}%, Temp: ${batteryState.temperature}°C). How can I assist you with battery health or future risk prediction today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Generate intelligent AI response based on real live batteryState parameters
    setTimeout(() => {
      let botResponse = '';
      const qLower = query.toLowerCase();

      if (qLower.includes('health') || qLower.includes('soh')) {
        botResponse = `Your battery State of Health (SOH) is currently ${batteryState.soh}%. Operating condition is ${batteryState.safetyState}. Internal resistance is approx ${batteryState.internalResistance} mΩ.`;
      } else if (qLower.includes('risk') || qLower.includes('danger') || qLower.includes('safety')) {
        botResponse = `Future Risk Assessment: Current Risk Score is ${batteryState.risk}%. Max Temperature is ${batteryState.maxTemperature}°C. ${
          batteryState.risk > 50 ? 'Warning: Elevated thermal risk detected! Recommend reducing discharge current.' : 'All electrochemical parameters are safe.'
        }`;
      } else if (qLower.includes('cell') || qLower.includes('voltage')) {
        const cellInfo = batteryState.cells.map((c) => `C${c.id}: ${c.voltage}V (${c.temperature}°C)`).join(', ');
        botResponse = `Live Pack Voltage is ${batteryState.voltage}V. Cell telemetry breakdown: ${cellInfo}.`;
      } else if (qLower.includes('range') || qLower.includes('distance')) {
        botResponse = `Estimated remaining driving range is approx ${batteryState.estimatedRange} km based on SOC at ${batteryState.soc}%.`;
      } else {
        botResponse = `I am analyzing your live battery pack. Current Pack Voltage: ${batteryState.voltage}V | Load Current: ${batteryState.current}A | Temp: ${batteryState.temperature}°C | SOC: ${batteryState.soc}%. SOH is healthy at ${batteryState.soh}%.`;
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="space-y-3 animate-fadeIn text-slate-900 flex flex-col h-[76vh]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black text-slate-900 heading-tech uppercase flex items-center gap-1.5 truncate">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              BRAIN CONVERSATIONAL ASSISTANT
            </h2>
            <p className="text-[11px] text-slate-500 font-semibold truncate">
              Live Battery Telemetry Q&amp;A &amp; AI Diagnostic Agent
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3 h-3 text-emerald-600" /> ONLINE
        </span>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none text-xs w-full">
        {[
          'How is my battery health?',
          'Predict future thermal risk',
          'What is my range?',
          'Diagnose cell voltages',
        ].map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl text-slate-700 text-[11px] font-semibold whitespace-nowrap transition cursor-pointer shrink-0 shadow-sm"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto space-y-3 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-xl text-white shrink-0 ${msg.sender === 'user' ? 'bg-emerald-600' : 'bg-slate-800'}`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-medium space-y-1 ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
            }`}>
              <p className="leading-relaxed">{msg.text}</p>
              <div className={`text-[9px] font-mono text-right ${msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask BRAIN AI about live battery health, thermal risk, or range..."
          className="flex-1 px-3 py-2 text-xs font-medium text-slate-900 outline-none bg-transparent"
        />
        <button
          onClick={() => handleSend()}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
