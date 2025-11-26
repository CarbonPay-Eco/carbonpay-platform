declare module "sonner" {
  export interface ToastOptions {
    description?: string;
    duration?: number;
  }

  // `toast` is callable and also has helper methods like toast.success, toast.error
  export function toast(message: string, options?: ToastOptions): void;

  export namespace toast {
    function success(message: string, options?: ToastOptions): void;
    function error(message: string, options?: ToastOptions): void;
  }
}



