import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

const ToastContext = createContext<(message: string) => void>(() => {});
const ToastMessageContext = createContext('');
export function ToastOverlay() {
  const message = useContext(ToastMessageContext);
  return message ? <View pointerEvents="none" style={styles.toast}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.text}>{message}</Text>
  </View> : null;
}
export const useToast = () => useContext(ToastContext);

// Keep feedback outside the navigator so it survives a successful password reset.
export function ToastProvider({children}: {children: React.ReactNode}) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const showToast = useCallback((text: string) => {
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={showToast}>
      <ToastMessageContext.Provider value={message}>
        <View style={styles.container}>
          {children}
          <ToastOverlay />
        </View>
      </ToastMessageContext.Provider>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  toast: {position: 'absolute', bottom: 80, left: 20, right: 20, backgroundColor: '#222', padding: 14, borderRadius: 8},
  text: {color: 'white', textAlign: 'center'},
});
