import React, { useState, useRef, useEffect, useCallback } from 'react';
import './AIChat.css';
import { ENDPOINTS } from '../config';

/**
 * AIChat Component - Contextual AI sales chat for the estimator flow
 * Mobile-first design with sales-first persona
 * 
 * System Prompt Configuration:
 * - Knowledge Base: Current labor rates ($75-$125/hr), material costs, 30-day guarantee
 * - Constraint: Sales-first persona - always pivot back to completing submission
 * - State: Can pull data from user's uploaded photos for real-time feedback
 */
export default function AIChat({ photos = [], formData = {}, onSubmit, photoAnalysis = null, triagePerformed = false }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: "Hi there! I'm your Fixetta assistant. I can help you get an accurate estimate for your home repair. What can I help you with today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ── Session Context (Project Snapshot) ─────────────────────────────────────
  // This is the "Stateless Context Bridge" - a small JSON block that travels
  // with every API call so Claude "remembers" the project state.
  const [sessionContext, setSessionContext] = useState(null);

  // Build session context from photo analysis results when available
  useEffect(() => {
    if (photoAnalysis && !sessionContext) {
      // Build Project Snapshot Object (The Bridge)
      const snapshot = {
        status: "photos_uploaded",
        summary: photoAnalysis.summary || `${photos.length} photos uploaded for analysis`,
        estimate_total: photoAnalysis.estimated_cost || null,
        lead_contractor: photoAnalysis.lead_contractor || null,
        last_action: "User is chatting with AI assistant"
      };
      setSessionContext(snapshot);
    }
  }, [photoAnalysis, photos.length, sessionContext]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context_summary for the Stateless Context Bridge
      const contextSummary = sessionContext ? 
        JSON.stringify(sessionContext) : 
        null;

      // Build request body with optional images for triage
      const requestBody = {
        messages: [...messages, userMessage],
        user_message: input.trim(),
        photos_count: photos.length,
        session_id: 'session_' + (formData?.zip || 'anonymous'),
        context_summary: contextSummary
      };

      // Only send images if triage hasn't been performed yet
      if (!triagePerformed && photos.length > 0) {
        const imagePromises = photos.map(photo => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64Data = reader.result.split(',')[1]; // Remove data:image/xxx;base64, prefix
              const mimeType = photo.type || 'image/jpeg';
              resolve({ base64: base64Data, mime_type: mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(photo);
          });
        });
        
        const images = await Promise.all(imagePromises);
        requestBody.images = images;
      }

      // Call the actual backend API
      const response = await fetch(ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update session context with last action
      if (sessionContext) {
        setSessionContext(prev => ({
          ...prev,
          last_action: "User chatted: " + input.trim().slice(0, 50)
        }));
      }
    } catch (error) {
      console.error('[AIChat] Failed to get response:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please go ahead and submit your inquiry and our team will get back to you with an estimate!",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, photos, messages, sessionContext, formData]);

   // Handle form submission from chat
   const handleSubmitInquiry = useCallback(() => {
     if (onSubmit) {
       onSubmit({
         view: 'contractor-matchmaker',
         chatHistory: messages,
         photos,
         ...formData
       });
     }
   }, [messages, photos, formData, onSubmit]);

  // Handle key press for sending message
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="ai-chat-container" ref={chatContainerRef}>
      {/* Chat Header */}
      <div className="ai-chat-header">
        <div className="chat-header-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="chat-header-text">
          <span className="chat-header-title">Fixetta.ai</span>
          <span className="chat-header-status">
            <span className="status-dot" />
            Online
          </span>
        </div>
      </div>

      {/* Photo Context Banner */}
      {photos.length > 0 && (
        <div className="photo-context-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span>{photos.length} photo{photos.length > 1 ? 's' : ''} uploaded for analysis</span>
        </div>
      )}

      {/* Messages Container */}
      <div className="ai-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-4.5a3 3 0 0 1-6 0V5h6z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div className="message-content">
              <p>{msg.content}</p>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant loading">
            <div className="message-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 14a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-4.5a3 3 0 0 1-6 0V5h6z" />
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="ai-chat-input">
        <textarea
          className="chat-input-field"
          placeholder="Ask me anything about your repair..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={1}
          disabled={isLoading}
        />
        <button
          className="chat-send-btn"
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Submit Inquiry Button */}
      <button className="chat-submit-btn" onClick={handleSubmitInquiry}>
        Submit your inquiry!
      </button>
    </div>
  );
}

/**
 * Generate AI response based on user input and context
 * This is a placeholder function - replace with actual API call when backend is ready
 */
function generateAIResponse(userInput, photoContext, systemPrompt) {
  const lowerInput = userInput.toLowerCase();
  
  // Sales-oriented responses that pivot back to submission
  if (lowerInput.includes('cost') || lowerInput.includes('price') || lowerInput.includes('how much') || lowerInput.includes('estimate')) {
    return `Great question! Based on our current labor rates of $75-$125/hour, I can help you get a precise estimate. ${photoContext ? 'I can see from your photos that there\'s some work to be done. ' : ''}Ready to submit your inquiry? Our AI will analyze everything and provide an accurate breakdown including materials and labor.`;
  }
  
  if (lowerInput.includes('long') || lowerInput.includes('time') || lowerInput.includes('duration')) {
    return `Most repairs take between 2-6 hours depending on the scope. ${photoContext ? 'From your photos, I can get a better sense of the timeline. ' : ''}Submit your inquiry and we\'ll give you a detailed timeline along with your estimate!`;
  }
  
  if (lowerInput.includes('guarantee') || lowerInput.includes('warranty') || lowerInput.includes('satisfaction')) {
    return `Absolutely! Fixetta provides a 30-day satisfaction guarantee on all work. We want to make sure you\'re completely happy with the results. Go ahead and submit your inquiry to get started!`;
  }
  
  if (lowerInput.includes('upload') || lowerInput.includes('photo') || lowerInput.includes('picture')) {
    return `You can upload up to 4 photos for our AI to analyze. ${photoContext ? `I see you\'ve already uploaded ${photoContext.match(/\d+/)?.[0] || 'some'} photos - great! ` : ''}More photos mean a more accurate estimate. Submit your inquiry once you\'re ready and our AI will provide a detailed breakdown!`;
  }
  
  // Default sales-pivot response
  return `I understand your concern. The best way to get accurate information for your specific situation is to submit your inquiry. Our AI will analyze ${photoContext ? 'your photos and ' : ''}provide a detailed estimate with cost breakdown, timeline, and matched professionals. It only takes a moment - would you like to proceed?`;
}