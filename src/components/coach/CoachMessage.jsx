import { motion } from "framer-motion";
import { Sparkles, User, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function CoachMessage({ message, index }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8, x: 10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end gap-2.5 items-start"
      >
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/20">
          <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: -10 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2.5 items-start"
    >
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
        message.isSafety ? "bg-amber-500/20 border border-amber-500/30" : "gold-gradient"
      }`}>
        {message.isSafety
          ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          : <Sparkles className="w-3.5 h-3.5 text-background" />
        }
      </div>
      <div className={`max-w-[88%] px-4 py-3 rounded-2xl rounded-tl-sm border ${
        message.isSafety
          ? "glass-card border-amber-500/20 bg-amber-500/5"
          : "glass-card border-border"
      }`}>
        <ReactMarkdown
          className="text-sm text-foreground/90 leading-relaxed prose-sm"
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
            em: ({ children }) => <em className="text-foreground/70 italic">{children}</em>,
            ul: ({ children }) => <ul className="my-1 ml-3 space-y-0.5 list-disc">{children}</ul>,
            ol: ({ children }) => <ol className="my-1 ml-3 space-y-0.5 list-decimal">{children}</ol>,
            li: ({ children }) => <li className="text-sm text-foreground/80">{children}</li>,
            h3: ({ children }) => <h3 className="text-xs uppercase tracking-widest text-primary font-semibold mt-3 mb-1">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-foreground/70 italic">{children}</blockquote>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}