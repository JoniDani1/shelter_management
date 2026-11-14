"use client";

import { motion } from "framer-motion";

// Spectrum UI Animated SVG Chart; paths now derive from the labeled prototype data.
export const Chart = ({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) => {
  const max = Math.max(...values, 1);
  const points = values.map(
    (v, i) =>
      `${24 + (i * 600) / Math.max(values.length - 1, 1)},${190 - (v / max) * 160}`,
  );
  const line = "M" + points.join(" L");
  return (
    <div className={"availability-chart"}>
      <div
        className={
          "dark:bg-neutral-950 bg-white dark:bg-grid-neutral-700 bg-grid-neutral-200"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 650 225"
          role="img"
          aria-label="Demonstration available beds by shelter"
        >
          <motion.path
            transition={{ delay: 0.3 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, d: line + " L624,215 L24,215 Z" }}
            d={line + " L624,215 L24,215 Z"}
            className={"chart-area"}
          />
          <motion.path
            transition={{ duration: 0.4 }}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, d: line }}
            d={line}
            fill="none"
            className={"chart-line"}
            strokeWidth="4"
          />
          {values.map((v, i) => (
            <g key={labels[i]}>
              <circle
                cx={24 + (i * 600) / Math.max(values.length - 1, 1)}
                cy={190 - (v / max) * 160}
                r="4"
                fill="#a74d32"
              />
              <text
                x={24 + (i * 600) / Math.max(values.length - 1, 1)}
                y="218"
                textAnchor="middle"
                fontSize="12"
                fill="#686a60"
              >
                {labels[i]}
              </text>
              <text
                x={24 + (i * 600) / Math.max(values.length - 1, 1)}
                y={175 - (v / max) * 160}
                textAnchor="middle"
                fontSize="13"
                fill="#343e32"
              >
                {v}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
