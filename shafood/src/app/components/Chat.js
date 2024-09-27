'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

const Chat = ({ selectedUsers }) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null); // Reference for scrolling to the bottom

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
    setLoadingMessages(true);
    const response = await fetch(`/api/chat/${chatId}/messages`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages);
    }
    setLoadingMessages(false);
  };

  const initializePusher = (chatId) => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe(`chat-${chatId}`);
    channel.bind('new-message', (data) => {
      // Check if the message already exists to prevent duplicates
      setMessages((prevMessages) => {
        const messageExists = prevMessages.some(msg => msg.id === data.id);
        if (!messageExists) {
          return [...prevMessages, data];
        }
        return prevMessages; // Return the previous messages if it already exists
      });
    });

    channel.bind('typing', (data) => {
      if (data.sender !== session.user.name) { // Exclude current user
        setTypingUsers((prev) => new Set(prev).add(data.sender));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = new Set(prev);
            updated.delete(data.sender);
            return updated;
          });
        }, 2000); // Remove typing indicator after 2 seconds
      }
    });
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      // Create a unique ID for the message
      const messageId = Date.now(); // Using timestamp as a unique ID

      // Create a temporary message object
      const tempMessage = {
        id: messageId, // Add the unique ID
        text: newMessage,
        sender: session.user.name,
        createdAt: new Date().toISOString(), // Use ISO string for consistency
      };

      // Optimistically update the messages state
      setMessages((prevMessages) => [...prevMessages, tempMessage]);

      // Clear the input field
      setNewMessage('');

      try {
        // Send the message to the server
        const response = await fetch('/api/chat/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: newMessage,
            sender: session.user.name,
            chatId: chatId,
            id: messageId, // Send the unique ID to the server
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Optionally, you can handle the response if needed
        // const sentMessage = await response.json();
        // Here you can update the message with the ID returned from the server if needed
      } catch (error) {
        console.error('Error sending message:', error);
        // Optionally, you can revert the optimistic update if the send fails
        setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== messageId));
      }
    }
  };

  const handleTyping = () => {
    if (newMessage.trim()) {
      fetch(`/api/chat/send-typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: session.user.name,
          chatId: chatId,
        }),
      });
    }
  };

  const addReaction = (index, reaction) => {
    const updatedMessages = [...messages];
    if (!updatedMessages[index].reactions) {
      updatedMessages[index].reactions = [];
    }
    // Check if the reaction already exists
    if (!updatedMessages[index].reactions.includes(reaction)) {
      updatedMessages[index].reactions.push(reaction);
    }
    setMessages(updatedMessages);
  };

  // Scroll to the bottom of the messages container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Chat with Selected Users</h2>
      <div className="flex-1 overflow-y-auto mb-4 max-h-[300px]"> {/* Set max height for scrollable area */}
        {loadingMessages ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`mb-2 flex items-center ${msg.sender === session.user.name ? 'justify-end' : 'justify-start'}`}>
              {msg.sender !== session.user.name && (
                <div className="h-8 w-8 flex items-center justify-center bg-blue-500 text-white rounded-full mr-2">
                  {msg.sender.charAt(0)} {/* Display the first letter of the sender's name */}
                </div>
              )}
              <div className={`flex flex-col ${msg.sender === session.user.name ? 'items-end' : 'items-start'}`}>
                <strong className="text-blue-600">{msg.sender}</strong>
                <span>{msg.text}</span>
                <div className="flex space-x-2 mt-1">
                  <button onClick={() => addReaction(index, '👍')} className="text-sm">👍</button>

                </div>
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="text-gray-500 text-sm">
                    {msg.reactions.join(' ')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {typingUsers.size > 0 && (
          <div className="text-gray-500 italic">
            {Array.from(typingUsers).join(', ')} {typingUsers.size > 1 ? 'are' : 'is'} typing...
          </div>
        )}
        <div ref={messagesEndRef} /> {/* Reference for scrolling to the bottom */}
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping(); // Call typing handler on input change
          }}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-lg p-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
