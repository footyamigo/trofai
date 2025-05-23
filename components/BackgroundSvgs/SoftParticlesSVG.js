import React from 'react';

const SoftParticlesSVG = ({ fill, style }) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="particleGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.8 }} />
          <stop offset="70%" style={{ stopColor: fill, stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <g>
        {[...Array(30)].map((_, i) => {
          const cx = Math.random() * 800;
          const cy = Math.random() * 1000;
          const r = Math.random() * 40 + 10; // radius between 10 and 50
          const delay = Math.random() * 5;
          const duration = Math.random() * 10 + 10; // duration between 10s and 20s

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="url(#particleGradient)"
              opacity={Math.random() * 0.3 + 0.2} // opacity between 0.2 and 0.5
            >
              <animate
                attributeName="cx"
                values={`${cx};${cx + (Math.random() - 0.5) * 100};${cx}`}
                dur={`${duration}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values={`${cy};${cy + (Math.random() - 0.5) * 150};${cy}`}
                dur={`${duration + 2}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;${Math.random() * 0.3 + 0.2};0" // Fades in and out
                dur={`${duration / 2}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}
      </g>
    </svg>
  );
};

export default SoftParticlesSVG; 