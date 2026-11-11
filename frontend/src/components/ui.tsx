import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const sheen =
  "relative overflow-hidden before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-700 before:content-[''] hover:before:translate-x-full";

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-accent to-accent2 text-deep shadow-lg shadow-sage/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sage/30',
  secondary: 'border border-pine bg-moss/60 text-mint hover:-translate-y-0.5 hover:border-sage/60 hover:bg-moss',
  danger:
    'bg-gradient-to-br from-expense to-expense2 text-deep shadow-lg shadow-expense/20 hover:-translate-y-0.5',
  ghost: 'text-sage hover:bg-moss/70 hover:text-mint',
};

export function buttonClasses(variant: Variant = 'primary', className = '') {
  return `inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${sheen} ${variants[variant]} ${className}`;
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

const field =
  'w-full rounded-xl border border-pine bg-deep/60 px-3.5 py-2.5 text-mint placeholder:text-sage/50 transition-all duration-200 focus:border-sage focus:bg-deep focus:outline-none focus:ring-2 focus:ring-sage/25 [color-scheme:dark]';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${field} ${className}`} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${field} [&>option]:bg-forest ${className}`} {...props} />;
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`animate-fade-up rounded-2xl border border-pine/60 bg-forest/75 p-4 shadow-xl shadow-black/25 backdrop-blur-md transition-colors duration-300 hover:border-pine ${className}`}
    >
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-sage">{children}</label>;
}

const overlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

const panel = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
  transition: { duration: 0.2, ease: 'easeOut' as const },
};

const overlayClass = 'fixed inset-0 z-50 flex items-end justify-center bg-deep/70 p-4 backdrop-blur-sm sm:items-center';
const panelClass = 'w-full max-w-sm rounded-2xl border border-pine bg-forest p-5 shadow-2xl shadow-black/50';

/** Полноэкранный диалог подтверждения опасных действий. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
  busy,
  children,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  children?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={overlayClass} {...overlay}>
          <motion.div className={panelClass} {...panel}>
            <h3 className="mb-2 text-lg font-semibold text-mint">{title}</h3>
            <p className="mb-5 text-sm text-sage">{message}</p>
            {children}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onCancel} disabled={busy}>
                Отмена
              </Button>
              <Button variant="danger" onClick={onConfirm} disabled={busy}>
                {busy ? 'Удаляем…' : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Диалог с формой (добавление/редактирование). */
export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={overlayClass} {...overlay}>
          <motion.div className={panelClass} {...panel}>
            <h3 className="mb-4 text-lg font-semibold text-mint">{title}</h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
