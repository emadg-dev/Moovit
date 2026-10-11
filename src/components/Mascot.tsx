import React, { useState } from 'react';
import { MascotState } from '../types';

interface MascotProps {
  state: MascotState;
  size?: number;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

const MASCOT_FILES: Record<MascotState, string> = {
  idle: '/mascot-idle.svg',
  stretch: '/mascot-stretch.svg',
  walking: '/mascot-walking.svg',
  sleepy: '/mascot-sleepy.svg',
  celebrate: '/mascot-celebrate.svg',
  resting: '/mascot-resting.svg',
};

const MASCOT_ANIMATIONS: Record<MascotState, string> = {
  idle: 'animate-mascot-float',
  stretch: 'animate-mascot-stretch',
  walking: 'animate-mascot-float',
  sleepy: '',
  celebrate: 'animate-mascot-bounce',
  resting: '',
};

const MASCOT_LABELS: Record<MascotState, string> = {
  idle: 'تکونی آماده و سرحال',
  stretch: 'تکونی در حال کشش',
  walking: 'تکونی در حال قدم زدن',
  sleepy: 'تکونی در حال استراحت ملایم',
  celebrate: 'تکونی در حال جشن گرفتن',
  resting: 'تکونی در حال ریلکس کردن',
};

export const Mascot: React.FC<MascotProps> = ({
  state,
  size = 140,
  className = '',
  onClick,
  interactive = true,
}) => {
  const [bounced, setBounced] = useState(false);

  const handleClick = () => {
    if (interactive) {
      setBounced(true);
      setTimeout(() => setBounced(false), 500);
    }
    if (onClick) {
      onClick();
    }
  };

  const svgSrc = MASCOT_FILES[state] || MASCOT_FILES.idle;
  const animationClass = MASCOT_ANIMATIONS[state] || '';

  return (
    <div
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center transition-transform select-none ${
        interactive ? 'cursor-pointer active:scale-95' : ''
      } ${bounced ? 'scale-110 -translate-y-2' : ''} ${className}`}
      style={{ width: size, height: size }}
      title={MASCOT_LABELS[state]}
      role="img"
      aria-label={MASCOT_LABELS[state]}
    >
      <img
        src={svgSrc}
        alt={MASCOT_LABELS[state]}
        className={`w-full h-full object-contain ${animationClass}`}
        draggable={false}
      />
    </div>
  );
};
