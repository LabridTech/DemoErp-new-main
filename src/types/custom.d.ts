// Type declarations for modules without type definitions
declare module '@/components/ui/scroll-area' {
  import * as React from 'react';
  
  export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children: React.ReactNode;
  }
  
  export const ScrollArea: React.ForwardRefExoticComponent<
    ScrollAreaProps & React.RefAttributes<HTMLDivElement>
  >;
  
  export const ScrollBar: React.FC<React.HTMLAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/use-toast' {
  import { ToastActionElement } from "@/components/ui/toast";
  
  type ToastProps = {
    id: string;
    title?: string;
    description?: string;
    action?: ToastActionElement;
    variant?: "default" | "destructive" | "success" | "warning" | "info";
    duration?: number;
  };
  
  type Toast = (props: Omit<ToastProps, 'id'>) => {
    id: string;
    dismiss: () => void;
    update: (props: ToastProps) => void;
  };
  
  export const useToast: () => {
    toast: Toast;
    dismiss: (toastId?: string) => void;
    toasts: ToastProps[];
  };
}

// Add any other missing type declarations here
