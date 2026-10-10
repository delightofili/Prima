import { createContext, useContext } from "react";

export type ToastTone = "ok" | "error";
export interface ToastAction {
  label: string;
  onClick: () => void;
}
export type PushToast = (
  text: string,
  tone?: ToastTone,
  action?: ToastAction,
) => void;

export const ToastContext = createContext<PushToast>(() => {});

export const useToast = () => useContext(ToastContext);
