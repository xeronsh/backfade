import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Dialog = BaseDialog;

export function DialogContent({
  className,
  ...props
}: ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="fixed inset-0 z-40 bg-black/70" />
      <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <BaseDialog.Popup
          className={cn(
            "w-full max-w-md rounded-panel border border-border-strong bg-surface-1 p-6 shadow-popover",
            className,
          )}
          {...props}
        />
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}
