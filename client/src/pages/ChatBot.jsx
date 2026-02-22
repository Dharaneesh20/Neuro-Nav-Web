import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiMessageCircle, FiAlertCircle } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Card from '../components/Card';
import { useAuthContext } from '../context/AuthContext';
import { apiClient } from '../services/api';
import '../styles/pages/ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Hi! I'm your NeuroNav AI Assistant. I'm here to help you with anxiety management, sensory issues, route planning, and general support. What would you like to talk about?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuthContext();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send message to Gemini AI
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await apiClient.post('/chat', {
        message: input,
        userName: user?.name || user?.username || 'Friend',
      });

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text:
          data.reply ||
          "I'm here to help! Could you tell me more about what you're experiencing?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const serverMsg = err?.response?.data?.error;
      setError(serverMsg || 'Failed to get response. Please try again.');

      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: serverMsg
          ? `I couldn't respond — ${serverMsg}. Please try again.`
          : "I'm sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="chatbot">
      <motion.div
        className="chatbot-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <div className="header-icon">
            <FiMessageCircle size={32} />
          </div>
          <div>
            <h1>🤖 AI Assistant</h1>
            <p>Chat with your supportive AI companion</p>
          </div>
        </div>
      </motion.div>

      <div className="chatbot-container">
        <Card className="chat-card">
          {/* Messages Area */}
          <motion.div
            className="messages-area"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`message ${msg.type}`}
                variants={messageVariants}
              >
                <div className="message-content">
                  <div className={`message-bubble ${msg.type}`}>
                    {msg.type === 'bot' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p style={{ margin: '0 0 0.5em 0' }}>{children}</p>,
                          ul: ({ children }) => <ul style={{ margin: '0.4em 0 0.5em 1.1em', padding: 0 }}>{children}</ul>,
                          ol: ({ children }) => <ol style={{ margin: '0.4em 0 0.5em 1.4em', padding: 0 }}>{children}</ol>,
                          li: ({ children }) => <li style={{ marginBottom: '0.25em', lineHeight: 1.5 }}>{children}</li>,
                          strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                          h2: ({ children }) => <h2 style={{ fontSize: '1em', fontWeight: 700, margin: '0.6em 0 0.3em' }}>{children}</h2>,
                          h3: ({ children }) => <h3 style={{ fontSize: '0.95em', fontWeight: 700, margin: '0.5em 0 0.25em' }}>{children}</h3>,
                          code: ({ children }) => <code style={{ background: 'rgba(0,0,0,0.10)', borderRadius: 4, padding: '1px 5px', fontSize: '0.88em' }}>{children}</code>,
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                className="message bot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="message-content">
                  <div className="message-bubble bot">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                className="error-banner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <FiAlertCircle /> {error}
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </motion.div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <div className="input-wrapper">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... (anxiety tips, sensory support, etc.)"
                className="chat-input"
                disabled={isLoading}
                maxLength={500}
              />
              <motion.button
                type="submit"
                className="send-btn"
                disabled={isLoading || !input.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiSend size={20} />
              </motion.button>
            </div>
            <div className="char-count">{input.length}/500</div>
          </form>

          {/* Quick Actions */}
          <div className="quick-actions">
            <p>Quick Actions:</p>
            <div className="action-buttons">
              {['Anxiety tips', 'Sensory hacks', 'Today plan', 'Help me calm'].map((action) => (
                <motion.button
                  key={action}
                  className="action-btn"
                  onClick={() => setInput(action)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action}
                </motion.button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChatBot;
