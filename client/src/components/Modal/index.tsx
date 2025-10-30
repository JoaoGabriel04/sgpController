import { ArrowLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
  size: "sm" | "md" | "lg" | "xl";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  onBack,
  children,
  size,
}: ModalProps) {
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="modal" // importante para o AnimatePresence saber o que sai
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }} // <- aqui entra a animação de saída
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`relative w-full ${sizeClasses[size]} transform rounded-lg bg-white shadow-xl`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  {onBack && (
                    <button
                      onClick={onBack}
                      className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4">{children}</div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
