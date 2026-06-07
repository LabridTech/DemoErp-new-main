"use client";

import * as React from 'react';

export const TOAST_DURATION = 5000;

type ToastVariant = 'default' | 'destructive';

interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  open?: boolean;
  action?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

type ToastState = {
  toasts: ToastProps[];
};

type ToastAction =
  | { type: 'ADD_TOAST'; toast: ToastProps }
  | { type: 'UPDATE_TOAST'; toast: ToastProps }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId: string };

interface ToastContextType {
  toasts: ToastProps[];
  toast: (props: Omit<ToastProps, 'id' | 'open' | 'onOpenChange'>) => { 
    id: string; 
    dismiss: () => void; 
    update: (props: Omit<ToastProps, 'id'>) => void;
  };
  dismiss: (toastId?: string) => void;
}

const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  toast: () => ({
    id: '',
    dismiss: () => {},
    update: () => {}
  }),
  dismiss: () => {}
});

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, action.toast],
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          !action.toastId || t.id === action.toastId
            ? { ...t, open: false }
            : t
        ),
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  const toast = React.useCallback((props: Omit<ToastProps, 'id' | 'open' | 'onOpenChange'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const update = (toastProps: Omit<ToastProps, 'id'>) =>
      dispatch({
        type: 'UPDATE_TOAST',
        toast: { ...toastProps, id },
      });
    const remove = () => dispatch({ type: 'REMOVE_TOAST', toastId: id });

    dispatch({
      type: 'ADD_TOAST',
      toast: {
        ...props,
        id,
        open: true,
        onOpenChange: (open: boolean) => {
          if (!open) remove();
        },
      },
    });

    return {
      id,
      dismiss: remove,
      update,
    };
  }, []);

  const dismiss = React.useCallback((toastId?: string) => {
    dispatch({ type: 'DISMISS_TOAST', toastId });
  }, []);

  const contextValue = React.useMemo(() => ({
    toasts: state.toasts,
    toast,
    dismiss,
  }), [state.toasts, toast, dismiss]);

  return React.createElement(
    ToastContext.Provider,
    { value: contextValue },
    children
  );
}

// Custom hook to use toast
function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Action creators
const toast = (props: Omit<ToastProps, 'id' | 'open' | 'onOpenChange'>) => {
  const id = Math.random().toString(36).substr(2, 9);
  const update = (toastProps: Omit<ToastProps, 'id'>) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...toastProps, id },
    });
  const remove = () => dispatch({ type: 'REMOVE_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) remove();
      },
    },
  });

  return {
    id,
    dismiss: remove,
    update,
  };
};

// Export all necessary components and hooks
export { ToastProvider, useToast, toast };
