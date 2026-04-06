import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function MobileSelect({ value, onChange, options, label, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(opt => opt.value === value)?.label || placeholder;

  return (
    <div>
      {label && <label className="text-sm font-semibold text-foreground block mb-2">{label}</label>}
      
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground text-sm font-medium flex items-center justify-between active:bg-card/50 transition-colors min-h-12"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/50"
              aria-hidden="true"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto glass-card rounded-t-3xl border border-border border-b-0"
            >
              <div className="px-5 py-4">
                <div className="h-1 w-12 bg-border rounded-full mx-auto mb-4" />
                <p className="text-sm font-semibold text-foreground mb-4">{label || 'Select an option'}</p>
                <div role="listbox" aria-label={label || 'Select an option'} className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {options.map(opt => (
                    <button
                      key={opt.value}
                      role="option"
                      aria-selected={value === opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-4 rounded-lg text-left font-medium transition-colors min-h-12 ${
                        value === opt.value
                          ? 'bg-primary text-background'
                          : 'bg-card text-foreground active:bg-card/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}