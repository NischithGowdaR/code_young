import React from 'react';

export interface AntiGravityIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export const AntiGravityIcon: React.FC<AntiGravityIconProps> = ({
  size = 24,
  className = '',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Levitating Sphere */}
      <circle cx="12" cy="7" r="4" />

      {/* Base Platform */}
      <line x1="4" y1="20" x2="20" y2="20" />

      {/* Upward Levitation Arrows */}
      <path d="M7 16V13M5.5 14.5L7 13l1.5 1.5" />
      <path d="M12 16V13M10.5 14.5L12 13l1.5 1.5" />
      <path d="M17 16V13M15.5 14.5L17 13l1.5 1.5" />
    </svg>
  );
};
