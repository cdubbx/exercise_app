import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {API_URL, apiFetch, readResponse} from '../services/api';
import {useUserContext} from '../hooks/auth';
import {CalendarWorkoutAction, ChatMessage} from '../interfaces/interfaces';

interface ChatError {message: string; unavailable: boolean}
interface ChatContextValue {
  messages: ChatMessage[];
  loading: boolean;
  error: ChatError | null;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: () => Promise<void>;
  addWorkoutToCalendar: (messageId: string) => Promise<void>;
  clearConversation: () => void;
}
const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const sequence = useRef(0);
  const failedQuery = useRef('');
  const calendarAdds = useRef(new Set<string>());
  const {user} = useUserContext();
  const clearConversation = () => {
    generation.current++;
    busy.current = false;
    failedQuery.current = '';
    setMessages([]); setError(null); setLoading(false);
  };
  useEffect(() => {
    const activeGeneration = generation;
    activeGeneration.current++;
    busy.current = false;
    failedQuery.current = '';
    setMessages([]); setError(null); setLoading(false);
    return () => { activeGeneration.current++; };
  }, [user?.id]);

  const send = async (content: string, appendUser: boolean) => {
    const query = content.trim();
    if (busy.current || !query) { return; }
    busy.current = true;
    const version = generation.current;
    setError(null); setLoading(true); failedQuery.current = '';
    if (appendUser) {
      setMessages(previous => [...previous, {id: `user-${++sequence.current}`, role: 'user', content: query, timestamp: Date.now()}]);
    }
    const priorMessages = !appendUser && messages[messages.length - 1]?.role === 'user' && messages[messages.length - 1]?.content === query
      ? messages.slice(0, -1)
      : messages;
    const conversation = priorMessages.slice(-12).map(message => ({role: message.role, content: message.content}));
    let unavailable = false;
    try {
      const response = await apiFetch(`${API_URL}/gpt-chat/`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query, conversation}),
      });
      unavailable = response.status === 503;
      const data = await readResponse(response);
      if (version !== generation.current) { return; }
      if (typeof data.gpt_response !== 'string' || !data.gpt_response.trim()) {
        throw new Error('No reply came through. Please try again.');
      }
      setMessages(previous => [...previous, {
        id: `assistant-${++sequence.current}`, role: 'assistant', content: data.gpt_response,
        exercises: Array.isArray(data.exercises) ? data.exercises : [],
        calendarAction: isCalendarWorkoutAction(data.calendar_action) ? data.calendar_action : undefined,
        calendarActionStatus: isCalendarWorkoutAction(data.calendar_action) ? 'idle' : undefined,
        timestamp: Date.now(),
      }]);
    } catch (failure) {
      if (version !== generation.current) { return; }
      failedQuery.current = query;
      setError({message: failure instanceof Error ? failure.message : 'Could not send your question. Please try again.', unavailable});
    } finally {
      if (version === generation.current) { busy.current = false; setLoading(false); }
    }
  };
  const addWorkoutToCalendar = async (messageId: string) => {
    const message = messages.find(item => item.id === messageId);
    const action = message?.calendarAction;
    if (!action || calendarAdds.current.has(messageId) || message?.calendarActionStatus === 'added') return;
    calendarAdds.current.add(messageId);
    setMessages(previous => previous.map(item => item.id === messageId ? {...item, calendarActionStatus: 'saving'} : item));
    try {
      await readResponse(await apiFetch(`${API_URL}/plannedWorkouts/`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({workouts: action.workouts.map(item => ({exercise: item.exercise, day: action.day, reps: item.reps, sets: item.sets}))}),
      }));
      setMessages(previous => previous.map(item => item.id === messageId ? {...item, calendarActionStatus: 'added'} : item));
    } catch {
      setMessages(previous => previous.map(item => item.id === messageId ? {...item, calendarActionStatus: 'error'} : item));
    } finally {
      calendarAdds.current.delete(messageId);
    }
  };
  return <ChatContext.Provider value={{messages, loading, error, sendMessage: content => send(content, true), retryMessage: () => send(failedQuery.current, false), addWorkoutToCalendar, clearConversation}}>
    {children}
  </ChatContext.Provider>;
};

function isCalendarWorkoutAction(value: unknown): value is CalendarWorkoutAction {
  if (!value || typeof value !== 'object') return false;
  const action = value as CalendarWorkoutAction;
  return typeof action.day === 'string' && Array.isArray(action.workouts) && action.workouts.length > 0
    && action.workouts.every(item => typeof item.exercise?.id === 'string' && typeof item.exercise?.name === 'string'
      && Number.isInteger(item.reps) && Number.isInteger(item.sets));
}
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) { throw new Error('useChat must be used inside ChatProvider'); }
  return context;
};
