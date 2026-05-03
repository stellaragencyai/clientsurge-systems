// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  if (!isUser && message.role !== 'assistant') return null;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
          S
        </div>
      )}
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-foreground text-background rounded-br-sm'
          : 'bg-white border border-border text-foreground rounded-bl-sm'
      }`}>
        {isUser ? message.content : (
          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function SamPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConversation) return;
    const unsub = base44.agents.subscribeToConversation(activeConversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConversation?.id]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    const convs = await base44.agents.listConversations({ agent_name: 'sam' });
    setConversations(convs || []);
    setLoadingConvs(false);
  };

  const startNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: 'sam',
      metadata: { name: `Conversation ${new Date().toLocaleDateString()}` },
    });
    setConversations(prev => [conv, ...prev]);
    setActiveConversation(conv);
    setMessages([]);
  };

  const openConversation = async (conv) => {
    const full = await base44.agents.getConversation(conv.id);
    setActiveConversation(full);
    setMessages(full.messages || []);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !activeConversation) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    await base44.agents.addMessage(activeConversation, { role: 'user', content: text });
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-border bg-white flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground mb-3 block">← Back</Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">S</div>
            <div>
              <p className="font-semibold text-foreground">Sam</p>
              <p className="text-xs text-muted-foreground">Lead Manager</p>
            </div>
          </div>
          <Button onClick={startNewConversation} className="w-full gap-2" size="sm">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingConvs ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  activeConversation?.id === conv.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <p className="truncate">{conv.metadata?.name || 'Conversation'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.updated_date ? new Date(conv.updated_date).toLocaleDateString() : ''}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">S</div>
              <div>
                <p className="font-semibold text-foreground">Sam</p>
                <p className="text-xs text-muted-foreground">Lead Pipeline Manager</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-secondary/10">
              {visibleMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-primary">S</span>
                  </div>
                  <p className="font-semibold text-foreground">I'm Sam, your lead manager.</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    Ask me to create leads, update statuses, show pipeline stats, or anything else about your leads.
                  </p>
                </div>
              )}
              {visibleMessages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
                  <div className="bg-white border border-border px-4 py-3 rounded-2xl rounded-bl-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-white">
              <div className="flex gap-3 max-w-3xl mx-auto">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask Sam to manage your leads..."
                  className="flex-1 border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button onClick={handleSend} disabled={!input.trim() || sending} className="rounded-xl px-5">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-primary">S</span>
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Meet Sam</h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              Sam manages your lead pipeline. Create, update, and track leads using natural language.
            </p>
            <Button onClick={startNewConversation} className="gap-2">
              <Plus className="w-4 h-4" />
              Start a Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
