import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function RefreshSpinner({ isRefreshing }) {
  if (!isRefreshing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center justify-center py-4 sticky top-0 z-10 bg-gradient-to-b from-background to-transparent"
    >
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground font-medium">Refreshing...</span>
      </div>
    </motion.div>
  );
}