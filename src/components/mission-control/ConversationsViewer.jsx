import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react';
import { useRealTimePolling } from '@/hooks/useRealTimePolling';
import { deltaFetchHelpers } from './DeltaFetchHelper';

export default function ConversationsViewer({ filters, refreshKey }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now());

  // Real-time delta fetch
  const fetchDeltaConversations = async (lastTimestamp) => {
    try {
      const newEvents = await deltaFetchHelpers.fetchNewCommunicationEvents(lastTimestamp);
      if (newEvents.length > 0) {
        setConversations(prevConversations => {
          const updated = { ...Object.fromEntries(prevConversations.map(c => [c.phoneNumber, c.messages])) };
          
          newEvents.forEach(event => {
            const phone = event.lead_id || 'unknown';
            if (!updated[phone]) {
              updated[phone] = [];
            }
            // Avoid duplicate messages
            if (!updated[phone].find(m => m.id === event.id)) {
              updated[phone].unshift(event);
            }
          });

          const result = Object.entries(updated).map(([phone, msgs]) => ({
            phoneNumber: phone,
            messageCount: msgs.length,
            lastMessage: msgs[0]?.created_date,
            messages: msgs,
          }));

          // Update selected conversation if it's being viewed
          if (selectedPhoneNumber) {
            const selected = result.find(c => c.phoneNumber === selectedPhoneNumber);
            if (selected) {
              setSelectedMessages(selected.messages);
            }
          }

          return result;
        });
        setLastUpdatedTime(Date.now());
      }
      return newEvents;
    } catch (error) {
      console.error('Error fetching delta conversations:', error);
      throw error;
    }
  };

  // Real-time polling
  useRealTimePolling(fetchDeltaConversations, 3000, null, null, true);

  // Initial load
  useEffect(() => {
    const loadConversations = async () => {
      setLoading(true);
      try {
        const events = await base44.entities.CommunicationEvent.list('-created_date', 100);
        const grouped = {};

        (events || []).forEach(event => {
          const phone = event.lead_id || 'unknown';
          if (!grouped[phone]) {
            grouped[phone] = [];
          }
          grouped[phone].push(event);
        });

        const result = Object.entries(grouped).map(([phone, msgs]) => ({
          phoneNumber: phone,
          messageCount: msgs.length,
          lastMessage: msgs[0]?.created_date,
          messages: msgs,
        }));

        setConversations(result);
        setLastUpdatedTime(Date.now());
      } catch (error) {
        console.error('Error loading conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [filters, refreshKey]);

  const handleSelectConversation = (conversation) => {
    setSelectedPhoneNumber(conversation.phoneNumber);
    setSelectedMessages(conversation.messages);
  };

  if (loading) {
    return <div className="h-40 bg-muted rounded-lg animate-pulse" />;
  }

  const filteredConversations = selectedPhoneNumber
    ? conversations
    : conversations.filter(c =>
      !filters.phoneNumber || c.phoneNumber.includes(filters.phoneNumber)
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Conversations</h3>
          <span className="text-xs text-muted-foreground">
            {filteredConversations.length} • Updated {Math.round((Date.now() - lastUpdatedTime) / 1000)}s ago
          </span>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No conversations</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <button
                key={conversation.phoneNumber}
                onClick={() => handleSelectConversation(conversation)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedPhoneNumber === conversation.phoneNumber
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4" />
                  <span className="font-mono font-semibold text-sm">
                    {conversation.phoneNumber}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {conversation.messageCount} message
                  {conversation.messageCount !== 1 ? 's' : ''} •{' '}
                  {formatDistanceToNow(new Date(conversation.lastMessage), {
                    addSuffix: true,
                  })}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages Panel */}
      <div className="lg:col-span-2">
        {selectedPhoneNumber ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Conversation with {selectedPhoneNumber}</h3>
              <button
                onClick={() => setSelectedPhoneNumber(null)}
                className="text-xs text-primary hover:underline"
              >
                Clear
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto border border-border rounded-lg p-4 bg-muted/20">
              {selectedMessages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No messages</p>
                </div>
              ) : (
                selectedMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.direction === 'inbound'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-green-100 text-green-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">
                        {msg.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatDistanceToNow(new Date(msg.created_date), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="break-words">{msg.message_body || msg.subject || '(no content)'}</p>
                    <div className="text-xs opacity-60 mt-1">
                      {msg.channel} • {msg.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-25" />
            <p className="text-muted-foreground">Select a conversation to view messages</p>
          </div>
        )}
      </div>
    </div>
  );
}