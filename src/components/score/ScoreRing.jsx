import { motion } from "framer-motion";

export default function ScoreRing({ score }) {
  const radius = 80;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f97316";
  const label = score >= 75 ? "Highly Aligned" : score >= 50 ? "Building Alignment" : "Gap to Close";

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative score-ring">
        <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
          {/* Background circle */}
          <circle stroke="hsl(220 15% 18%)" fill="transparent" strokeWidth={stroke}
            r={normalizedRadius} cx={radius} cy={radius} />
          {/* Score circle */}
          <motion.circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="font-playfair text-4xl font-bold"
            style={{ color }}>
            {score}
          </motion.span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">/100</span>
        </div>
      </div>
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="mt-2 px-4 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: `${color}20`, color }}>
        {label}
      </motion.div>
    </div>
  );
}