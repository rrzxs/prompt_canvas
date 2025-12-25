import React, { useState, useEffect, useRef } from 'react';
import { PromptItem, ChatMessage, Attachment } from '../types';
import { Icons } from './Icons';
import { CreditCheck, CreditInsufficientModal } from './CreditCheck';
import { apiService } from '../services/apiService';

interface ChatInterfaceProps {
  promptItem: PromptItem;
  onUpdate: (updatedItem: PromptItem) => void;
  readOnly?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ promptItem, onUpdate, readOnly = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(promptItem.chatHistory || []);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeAttachments, setActiveAttachments] = useState<Attachment[]>([]);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditCheckResult, setCreditCheckResult] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(promptItem.chatHistory || []);
  }, [promptItem]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() && activeAttachments.length === 0) return;
    
    const userMsg: ChatMessage = { 
        role: 'user', 
        text: input, 
        timestamp: Date.now(),
        attachments: activeAttachments.length > 0 ? [...activeAttachments] : undefined
    };
    
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setActiveAttachments([]); // Clear attachments after sending
    setIsTyping(true);

    try {
      // 使用 apiService 发送聊天消息
      const responseText = await apiService.sendChatMessage(messages, userMsg.text, userMsg.attachments);
      const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      
      const finalHistory = [...newHistory, modelMsg];
      setMessages(finalHistory);
      
      // 使用 apiService 更新提示词
      const updatedItem = { ...promptItem, chatHistory: finalHistory, updatedAt: Date.now() };
      await apiService.updatePrompt(promptItem.id, { chatHistory: finalHistory });
      onUpdate(updatedItem);

      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('creditUpdated'));

    } catch (error: any) {
      console.error(error);
      const errorMessage = apiService.getErrorMessage(error);
      const errorMsg: ChatMessage = { role: 'model', text: errorMessage, timestamp: Date.now() };
      setMessages([...newHistory, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                const newAttachment: Attachment = {
                    name: file.name,
                    mimeType: file.type,
                    data: ev.target.result as string
                };
                setActiveAttachments(prev => [...prev, newAttachment]);
            }
        };
        reader.readAsDataURL(file);
    }
    // Reset input
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setActiveAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full bg-panel rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300">
           <Icons.MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-white">{promptItem.title}</h2>
          <div className="flex gap-2 mt-1">
            {promptItem.tags.map(t => (
              <span key={t} className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wide">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60">
            <Icons.MessageSquare className="w-16 h-16 mb-4" />
            <p>开启对话，推敲您的逻辑提示词。</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-accent text-white rounded-tr-sm' 
                : 'bg-slate-700 text-slate-200 rounded-tl-sm border border-slate-600'
            }`}>
              {/* Display Attachments in history */}
              {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((att, i) => (
                          <div key={i} className="rounded overflow-hidden bg-black/20 border border-white/10 max-w-[150px]">
                              {att.mimeType.startsWith('image/') ? (
                                  <img src={att.data} alt={att.name} className="w-full h-auto max-h-[150px] object-cover" />
                              ) : (
                                  <div className="p-2 text-xs flex items-center gap-1 truncate">
                                      <Icons.Paperclip className="w-3 h-3" />
                                      {att.name}
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              )}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              <span className="text-[10px] opacity-50 block mt-2 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-slate-700 p-3 rounded-2xl rounded-tl-sm border border-slate-600">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
             </div>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-800/30 border-t border-slate-700">
        {readOnly ? (
            <div className="text-center p-4 text-slate-500 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
                <p>此为公开预览模式，无法直接对话。</p>
                <p className="text-xs mt-1">请点击右上角“克隆”按钮，将此提示词添加到您的灵感库后继续使用。</p>
            </div>
        ) : (
        <>
        {/* Attachment Previews in Input */}
        {activeAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 px-1">
                {activeAttachments.map((att, idx) => (
                    <div key={idx} className="relative group bg-slate-800 rounded-lg border border-slate-600 p-1 pr-6">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-300 truncate max-w-[100px]">{att.name}</span>
                        </div>
                        <button 
                            onClick={() => removeAttachment(idx)}
                            className="absolute right-1 top-1 text-slate-400 hover:text-red-400 p-0.5"
                        >
                            <Icons.X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Attachment Button */}
          <div className="relative">
              <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple={false} 
              />
              <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors mb-2"
                  title="添加附件"
              >
                  <Icons.Paperclip className="w-5 h-5" />
              </button>
          </div>

          <textarea 
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:border-accent outline-none resize-none min-h-[56px] max-h-[150px] scrollbar-hide"
            placeholder="输入您的推理内容..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
            style={{ height: 'auto', minHeight: '56px' }} 
          />
          
          <CreditCheck serviceType="text_chat" onCreditCheck={setCreditCheckResult}>
            {({ sufficient, cost, checking, error, checkResult }) => (
              <button 
                onClick={() => {
                  if (sufficient) {
                    handleSend();
                  } else if (checkResult) {
                    setCreditCheckResult(checkResult);
                    setShowCreditModal(true);
                  }
                }}
                disabled={isTyping || (!input.trim() && activeAttachments.length === 0) || checking || !sufficient}
                className={`w-14 h-10 mb-1 flex items-center justify-center rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end relative ${
                  sufficient 
                    ? 'bg-accent hover:bg-accent-hover' 
                    : 'bg-slate-600'
                }`}
                title={!sufficient ? `积分不足，需要${cost}积分` : `消耗${cost}积分发送消息`}
              >
                {checking ? (
                  <Icons.Clock className="w-5 h-5" />
                ) : (
                  <Icons.Send className="w-5 h-5" />
                )}
                {/* 积分数量显示 */}
                <span className="absolute -top-1 -right-1 bg-slate-800 text-xs px-1 py-0.5 rounded text-slate-300 border border-slate-600 font-mono">
                  {cost}
                </span>
              </button>
            )}
          </CreditCheck>
        </div>
        </>
        )}
        
        {showCreditModal && creditCheckResult && (
          <CreditInsufficientModal
            isOpen={showCreditModal}
            onClose={() => setShowCreditModal(false)}
            checkResult={creditCheckResult}
            onRetry={() => {
              // 重新检查积分后再次尝试发送
              handleSend();
            }}
          />
        )}
      </div>
    </div>
  );
};