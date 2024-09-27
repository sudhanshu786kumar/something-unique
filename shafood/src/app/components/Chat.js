'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

const Chat = ({ selectedUsers }) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    if (selectedUsers.length > 0) {
      const userIds = selectedUsers.map(user => user.id);
      findOrCreateChatSession(userIds);
    }
  }, [selectedUsers]);

  const findOrCreateChatSession = async (userIds) => {
    const response = await fetch('/api/chat/find-or-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });

    if (response.ok) {
      const { chatId } = await response.json();
      setChatId(chatId);
      fetchMessages(chatId);
      initializePusher(chatId);
    }
  };

  const fetchMessages = async (chatId) => {
    const response = await fetch(`/api/chat/${chatId}/messages`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages);
    }
   
  };

  const initializePusher = (chatId) => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(`chat-${chatId}`);
    channel.bind('new-message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const response = await fetch('/api/chat/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          sender: session.user.name,
          chatId: chatId,
        }),
      });

      if (response.ok) {
        setNewMessage('');
      }
    }
  };

  return (
    <div className="chat-container">
      <h2>Chat with Selected Users</h2>
      <div className="messages" style={{ height: '300px', overflowY: 'scroll' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
