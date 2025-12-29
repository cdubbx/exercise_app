import {StyleSheet, Text, View} from 'react-native';
import React, {
  createContext,
  ReactEventHandler,
  SetStateAction,
  useContext,
  useState,
} from 'react';
import { FloatingLayoutService } from '../utils/FloatingLayoutService';

interface FloatingButtonState {
  x: number;
  y: number;
  visible: boolean;
  label: string;
}

interface FloatingButtonActions {
  moveTo: (x: number, y: number) => void;
  show: () => void;
  hide: () => void;
  moveToBottomRight: () => void;
}

interface FloatingButtonContextType {
  state: FloatingButtonState | undefined;
  actions: FloatingButtonActions;
}

interface FloatingButtonProps {
  children: React.ReactNode;
}

/**
 * React context that provides the shared state and actions for a floating button component.
 *
 * The context value is of type `FloatingButtonContextType | undefined` and is initialized with
 * `undefined`. Consumers should account for the possibility of an undefined value (for example,
 * by using a runtime guard or a custom hook that throws a clear error when the context is missing).
 *
 * @remarks
 * The concrete shape of the context is defined by `FloatingButtonContextType`. Typical contents
 * may include visibility flags, position/anchor data, and callbacks to show/hide or update the
 * floating button's state.
 *
 * @example
 * const ctx = useContext(FloatingButtonContext);
 * if (!ctx) {
 *   throw new Error('FloatingButtonContext must be used within a FloatingButtonProvider');
 * }
 *
 * @public
 */
export const FloatingButtonContext = createContext<
  FloatingButtonContextType | undefined
>(undefined);

export const FloatingButtonContextProvider: React.FC<FloatingButtonProps> = ({
  children,
}) => {
  const [floatingButtonState, setFloatingButtonState] = useState<
    FloatingButtonState
  >({
    x: 0,
    y: 0,
    visible: true,
    label: 'Floating Button',
  });


  const moveTo = (x: number, y: number) => {
    setFloatingButtonState(
      prev => prev && {x: x, y: y, visible: prev.visible, label: prev.label},
    );
  };
  const show = () => {
    setFloatingButtonState(
      prev => prev && {x: prev.x, y: prev.y, visible: true, label: prev.label},
    );
  };
  const hide = () => {
    setFloatingButtonState(
      prev => prev && {x: prev.x, y: prev.y, visible: false, label: prev.label},
    );
  };

  const moveToBottomRight = () => {
    const cat = FloatingLayoutService.getDeviceCategory();
    let x = 0;
    let y = 0;
    switch (cat) {
      case 'regular': {
        const pos = FloatingLayoutService.getBottomRightPosition();
        x = pos.x;
        y = pos.y;
        break;
      }
      default:
        const pos = FloatingLayoutService.getBottomRightAdjusted()
        x = pos.x;
        y = pos.y;
    }
    
    moveTo(x, y);
  };

  

  return (
    <FloatingButtonContext.Provider
      value={{state: floatingButtonState, actions: {moveTo:moveTo, show:show, hide:hide, moveToBottomRight: moveToBottomRight} }}>
      {children}
    </FloatingButtonContext.Provider>
  );
};

export const useFloatingButtonActions = () => {
    const ctx = useContext(FloatingButtonContext);
    if(!ctx){
        throw new Error('useFloatingButton actions must be used within a provider');
    } 
    return ctx.actions
}

export const useFloatingButtonState = () => {
    const ctx = useContext(FloatingButtonContext);
    if(!ctx){
        throw new Error('useFloatingButton state must be used within a provider');
    }
    return ctx.state;
}

