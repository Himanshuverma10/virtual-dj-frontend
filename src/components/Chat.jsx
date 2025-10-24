// frontend/src/components/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';

function Chat({ messages, onSendMessage }) {
  const [message, setMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg h-full flex flex-col p-4">
      <h2 className="text-xl font-bold mb-3 text-purple-300">Chat</h2>
      
      {/* Message List */}
      <div className="flex-grow overflow-y-auto mb-3 space-y-2 pr-2">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.user === 'System' ? (
              <p className="text-sm text-gray-400 italic text-center">--- {msg.text} ---</p>
            ) : (
              <div className="flex flex-col">
                <span className="text-sm font-medium text-purple-300">{msg.user}</span>
                <p className="bg-gray-700 p-2 rounded-lg break-words">{msg.text}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow p-2 rounded-l-md text-gray-900"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white p-2 rounded-r-md font-semibold hover:bg-purple-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;