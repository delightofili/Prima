import { createContext, useContext } from "react";

export type ToastTone = "ok" | "error";
export type PushToast = (text: string, tone?: ToastTone) => void;

export const ToastContext = createContext<PushToast>(() => {});

export const useToast = () => useContext(ToastContext);
