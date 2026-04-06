import { View, Text } from 'react-native'
import React, { createContext, useContext, useState } from 'react'
import { ChatMessage } from '../interfaces/interfaces'


interface ChatContextValue {
    messages: ChatMessage[];
    loading: boolean;
    sendMessage: (content:string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);


export const ChatProvider: React.FC<{children:React.ReactNode}> = ({children}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const sendMessage = async (userInput: any) => {
    const timestamp = Date.now();
    const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userInput,
        timestamp: Date.now(),
    };
    const newMessages = [...messages!, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch(
        'https://exerciseplus-a70aea8e1a80.herokuapp.com/api/gpt-chat/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({query: userInput}),
        },
      );

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: Date.now().toString(), // simple timestamp-based id
        role: 'assistant',
        content: data.gpt_response || 'Sorry, something went wrong.',
        exercises: data.exercises,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
        const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Error: ' + err.message,
        timestamp: Date.now(),
        }
      setMessages(prev => [...prev, 
        errorMessage
      ]);
    } finally {
      setLoading(false);
    }
  };

   return (
    <ChatContext.Provider value={{messages, loading, sendMessage}}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
};