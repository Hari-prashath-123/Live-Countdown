"use client";

import { toast as sonnerToast } from "sonner";

type ToastArgs = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  function toast({ title, description, variant = "default" }: ToastArgs) {
    if (variant === "destructive") {
      sonnerToast.error(title, { description });
      return;
    }

    sonnerToast.success(title, { description });
  }

  return { toast };
}
