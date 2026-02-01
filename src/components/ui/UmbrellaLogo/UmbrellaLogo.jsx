import React, { useId } from 'react';

/**
 * Umbrella Corporation logo (Resident Evil) — SVG with radial gradients.
 */
const UmbrellaLogo = ({ size = 120, className = '' }) => {
  const id = useId().replace(/:/g, '-');
  const redId = `umbrella-red-${id}`;
  const whiteId = `umbrella-white-${id}`;
  const groupBId = `umbrella-b-${id}`;
  const groupAId = `umbrella-a-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 300 300"
      width={size}
      height={size}
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id={redId} cx="150" cy="150" r="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c00" offset=".3" />
          <stop stopColor="#a11" offset=".7" />
        </radialGradient>
        <radialGradient id={whiteId} cx="150" cy="150" r="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ddd" offset=".3" />
          <stop stopColor="#fff" offset=".6" />
          <stop stopColor="#ddd" offset=".9" />
        </radialGradient>
      </defs>
      <g id={groupAId}>
        <g id={groupBId}>
          <path
            d="m206 5s-28 14-56 14-56-14-56-14l56 135z"
            fill={`url(#${redId})`}
            stroke="#870200"
          />
          <path
            d="m87 8s-10 30-30 50c-19 19-49 29-49 29l135 56z"
            fill={`url(#${whiteId})`}
            stroke="#bdbdbd"
          />
        </g>
        <use transform="rotate(90,150,150)" xlinkHref={`#${groupBId}`} />
      </g>
      <use transform="rotate(180,150,150)" xlinkHref={`#${groupAId}`} />
    </svg>
  );
};

export default UmbrellaLogo;
