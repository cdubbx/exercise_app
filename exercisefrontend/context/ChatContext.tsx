import {API_URL, apiFetch, readResponse} from '../services/api';
import { View, Text } from 'react-native'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import {useUserContext} from '../hooks/auth';
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

    const busy = useRef(false);
    const account = useRef(0);
    const {user} = useUserContext();
    useEffect(() => { account.current++; setMessages([]); setLoading(false); busy.current = false; }, [user?.id]);
    const sendMessage = async (userInput: string) => {
    if (busy.current || !userInput.trim()) return;
    busy.current = true;
    const version = account.current;
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
      const response = await apiFetch(
        `${API_URL}/gpt-chat/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({query: userInput}),
        },
      );

      const data = await readResponse(response);
      if (version !== account.current) return;
      const assistantMsg: ChatMessage = {
        id: Date.now().toString(), // simple timestamp-based id
        role: 'assistant',
        content: data.gpt_response || 'Sorry, something went wrong.',
        exercises: data.exercises,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
        if (version !== account.current) return;
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
      if (version === account.current) { busy.current = false; setLoading(false); }
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