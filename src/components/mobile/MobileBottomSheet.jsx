import { motion, AnimatePresence } from 'framer-motion';

export function MobileBottomSheet({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto glass-card rounded-t-3xl border border-b-0 border-border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="px-5 py-4">
              {/* Drag handle */}
              <div className="flex justify-center mb-4">
                <div className="h-1 w-12 bg-border rounded-full" />
              </div>
              
              {/* Title */}
              {title && (
                <h2 className="text-lg font-semibold text-foreground mb-4">{title}</h2>
              )}
              
              {/* Content */}
              <div className="max-h-[70vh] overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}