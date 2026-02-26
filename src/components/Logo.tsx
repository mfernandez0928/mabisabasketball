import React, { useState } from 'react';
import { ASSETS } from '../constants/assets';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  const [imgSrc, setImgSrc] = useState(ASSETS.LOGO);

  return (
    <div className={`bg-white rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      <img 
        src={imgSrc} 
        alt="Mabisa Logo" 
        className="w-full h-full object-cover"
        onError={() => setImgSrc(ASSETS.LOGO_FALLBACK)}
      />
    </div>
  );
};
