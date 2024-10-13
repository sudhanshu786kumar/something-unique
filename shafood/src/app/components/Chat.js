'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faSmile, faUserPlus, faMapMarkerAlt, faMapPin, faFile, faPlus, faUtensils, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/customScrollbar.css';
import OrderProcess from './OrderProcess';


const NearbyUsersList = ({ nearbyUsers, onAddUser, onClose }) => (
  <div className="absolute inset-0 bg-white dark:bg-gray-800 z-10 p-4">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-semibold">Add Users to Chat</h3>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
    <ul className="space-y-2">
      {nearbyUsers.map(user => (
        <li key={user.id} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
          <span>{user.name}</span>
          <button
            onClick={() => onAddUser(user.id)}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Add
          </button>
        </li>
      ))}
    </ul>
  </div>
);

const Chat = ({ selectedUsers, onUpdateSelectedUsers, onChatIdChange, onClose }) => {
  const { data: session } = useSession();
 
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [showNearbyUsers, setShowNearbyUsers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // const [isOrderProcessOpen, setIsOrderProcessOpen] = useState(false);

  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '👀'];

  const findOrCreateChatSession = useCallback(async (userIds) => {
    if (userIds.length < 2) {
      toast.error("A chat requires at least two users.");
      return;
    }

    try {
      const response = await fetch('/api/chat/find-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: [...userIds, session.user.id] }),
      });

      if (response.ok) {
        const { chatId } = await response.json();
        setChatId(chatId);
        onChatIdChange(chatId);
        fetchMessages(chatId);
        initializePusher(chatId);
        //toast.success("Chat session updated successfully.");
      } else {
        throw new Error("Failed to create or update chat session");
      }
    } catch (error) {
      console.error("Error in findOrCreateChatSession:", error);
      toast.error("Failed to update chat session. Please try again.");
    }
  }, [session.user.id, onChatIdChange]);

  useEffect(() => {
    if (selectedUsers && selectedUsers.length > 1) {
      const userIds = selectedUsers.map(user => user.id);
      findOrCreateChatSession(userIds);
        
    }
  }, [selectedUsers, findOrCreateChatSession]);

  // useEffect(() => {
  //   // Assuming you have a function to generate or fetch chatId
  //   const fetchChatId = async () => {
  //     const id = await generateChatId(); // Implement this function
  //     setChatId(id);
  //     onChatIdChange(id);
  //   };

  //   fetchChatId();
  // }, [onChatIdChange]);

  const addEmoji = (emoji) => {
    setNewMessage(prevMessage => prevMessage + emoji);
    setShowEmojiPicker(false);
  };

  const sendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const locationMessage = `My current location: https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
        sendMessage(locationMessage, 'location', { latitude: position.coords.latitude, longitude: position.coords.longitude });
      }, (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please check your browser settings.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const calculateNearestLocation = async () => {
    try {
      const response = await fetch('/api/chat/nearest-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chatId,
          currentUserId: session.user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate nearest location');
      }

      const data = await response.json();
      const nearestLocationMessage = `Nearest location: https://www.google.com/maps?q=${data.latitude},${data.longitude}`;
      sendMessage(nearestLocationMessage, 'location', { latitude: data.latitude, longitude: data.longitude });
      toast.success('Nearest location calculated successfully.');
    } catch (error) {
      console.error('Error calculating nearest location:', error);
      toast.error('Failed to calculate nearest location. Please try again.');
    }
  };

  const sendDocument = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const data = await response.json();
          if (data.url) {
            sendMessage(`Shared document: ${file.name}`, 'document', { url: data.url, fileName: file.name });
            toast.success('Document uploaded successfully.');
          } else {
            throw new Error('Failed to upload document');
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          toast.error("Failed to upload file. Please try again.");
        }
      }
    };
    input.click();
  };


  const addUserToChat = async (userId) => {
    const userToAdd = nearbyUsers.find(user => user.id === userId);
    if (userToAdd && !selectedUsers.some(u => u.id === userId)) {
      const updatedUsers = [...selectedUsers, userToAdd];
      await findOrCreateChatSession(updatedUsers.map(user => user.id));
      onUpdateSelectedUsers(updatedUsers);
      setShowNearbyUsers(false);
    }
  };

  const removeUserFromChat = async (userId) => {
    if (userId === session.user.id) {
      toast.error("You cannot remove yourself from the chat.");
      return;
    }
    const updatedUsers = selectedUsers.filter(user => user.id !== userId);
    await findOrCreateChatSession(updatedUsers.map(user => user.id));
    onUpdateSelectedUsers(updatedUsers);
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

  const sendMessage = async (messageText = newMessage, messageType = 'text', additionalData = null) => {
    if (messageText.trim()) {
      const messageId = Date.now();
      const tempMessage = {
        id: messageId,
        text: messageText,
        sender: session.user.name,
        createdAt: new Date().toISOString(),
        messageType,
        additionalData
      };

      setMessages((prevMessages) => [...prevMessages, tempMessage]);
      setNewMessage('');

      try {
        const response = await fetch('/api/chat/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: messageText,
            sender: session.user.name,
            chatId: chatId,
            id: messageId,
            messageType,
            additionalData
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Message sent successfully, no need for a success toast as the message appears in the chat
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message. Please try again.');
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

  const renderMessage = (msg) => {
    switch (msg.messageType) {
      case 'text':
        return <p className="text-sm break-words">{msg.text}</p>;
      case 'location':
        return (
          <div>
            <a href={msg.text} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              View Location
            </a>
            <div className="mt-2">
              <iframe
                width="200"
                height="150"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${msg.additionalData.latitude},${msg.additionalData.longitude}`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        );
      case 'document':
        return (
          <div>
            <a href={msg.additionalData.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              {msg.additionalData.fileName}
            </a>
            {msg.additionalData.url.match(/\.(jpeg|jpg|gif|png)$/) && (
              <div className="mt-2">
                <img src={msg.additionalData.url} alt={msg.additionalData.fileName} className="max-w-xs rounded-lg shadow-md" />
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-sm break-words">{msg.text}</p>;
    }
  };

  const SelectedUsersList = ({ users, onRemove }) => (
    <div className="flex flex-wrap items-center">
      {users.map(user => (
        <div key={user.id} className="bg-blue-600 rounded-full px-3 py-1 text-sm mr-2 mb-2 flex items-center">
          <span>{user.name}</span>
          {user.id !== session.user.id && (
            <button
              onClick={() => onRemove(user.id)}
              className="ml-2 text-white hover:text-gray-200 focus:outline-none"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const resetChat = () => {
    setMessages([]);
    setNewMessage('');
    // Any other reset actions you need
  };

  if (!selectedUsers) {
    return null; // or return a loading indicator
  }

  if (loadingMessages) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FontAwesomeIcon icon={faSpinner} size="3x" className="text-orange-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden">
      <div className="bg-blue-500 text-white p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            {selectedUsers.length > 2 ? 'Group Chat' : 'Chat'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <SelectedUsersList users={selectedUsers} onRemove={removeUserFromChat} />
        <button
          onClick={() => setShowNearbyUsers(true)}
          className="mt-2 bg-blue-600 text-white px-2 py-1 text-sm rounded-full hover:bg-blue-700 transition duration-300"
        >
          <FontAwesomeIcon icon={faUserPlus} className="mr-1" />
          Add User
        </button>
      </div>

      {showNearbyUsers && (
        <NearbyUsersList
          nearbyUsers={ nearbyUsers}
          onAddUser={addUserToChat}
          onClose={() => setShowNearbyUsers(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loadingMessages ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                </div>
                <div className="flex-1 space-y-1 py-1">
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-base">Start a new chat!</p>
            <p className="text-sm">Send a message to begin the conversation.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.sender === session.user.name ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.sender === session.user.name ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'} rounded-lg p-2 shadow`}>
                <p className="font-semibold text-xs mb-1">{msg.sender}</p>
                {renderMessage(msg)}
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs opacity-75">
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </div>
                  <div className="flex space-x-1">
                    {msg.reactions && msg.reactions.map((reaction, i) => (
                      <span key={i} className="text-xs">{reaction}</span>
                    ))}
                    <button onClick={() => addReaction(index, '👍')} className="text-xs opacity-75 hover:opacity-100">👍</button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
        {typingUsers.size > 0 && (
          <div className="text-gray-500 dark:text-gray-400 italic text-xs">
            {Array.from(typingUsers).join(', ')} {typingUsers.size > 1 ? 'are' : 'is'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </form>
      </div>

      {showMenu && (
        <div className="absolute bottom-14 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            <FontAwesomeIcon icon={faSmile} className="mr-2" /> Emoji
          </button>
          <button onClick={sendLocation} className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" /> Send Location
          </button>
          <button onClick={calculateNearestLocation} className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            <FontAwesomeIcon icon={faMapPin} className="mr-2" /> Nearest Location
          </button>
          <button onClick={sendDocument} className="block w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
            <FontAwesomeIcon icon={faFile} className="mr-2" /> Send Document
          </button>
        </div>
      )}

      {showEmojiPicker && (
        <div className="absolute bottom-14 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
          <div className="grid grid-cols-5 gap-1">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => addEmoji(emoji)}
                className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {isOrderProcessOpen && (
        <OrderProcess
          chatId={chatId}
          users={selectedUsers}
          currentUserId={session.user.id}
          onClose={() => setIsOrderProcessOpen(false)}
        />
      )}
    </div>
  );
};

export default Chat;