import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Phone, Mail, ExternalLink } from 'lucide-react';

export default function ConversationsViewer({ filters, refreshKey }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);

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

        setConversations(Object.entries(grouped).map(([phone, msgs]) => ({
          phoneNumber: phone,
          messageCount: msgs.length,
          lastMessage: msgs[0]?.created_date,
          messages: msgs,
        })));
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

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Conversation List */}
      <div className="col-span-1 rounded-lg border border-border p-4">
        <h3 className="font-semibold mb-4">Conversations</h3>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.phoneNumber}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedPhoneNumber === conv.phoneNumber
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3 h-3" />
                  <span className="font-mono text-xs font-semibold">
                    {conv.phoneNumber}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {conv.messageCount} messages
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="col-span-2 rounded-lg border border-border p-4">
        {selectedPhoneNumber ? (
          <>
            <div className="mb-4">
              <h3 className="font-semibold">
                Conversation: {selectedPhoneNumber}
              </h3>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {selectedMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages</p>
              ) : (
                selectedMessages.map(msg => (
                  <div key={msg.id} className="rounded-lg bg-muted p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase text-primary">
                          {msg.direction || 'system'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          msg.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {msg.status || 'pending'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {msg.created_date
                          ? formatDistanceToNow(new Date(msg.created_date), {
                            addSuffix: true,
                          })
                          : ''}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {msg.message_body || msg.subject || 'No content'}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {msg.channel && (
                        <span className="uppercase">{msg.channel}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            Select a conversation to view messages
          </div>
        )}
      </div>
    </div>
  );
}