import { useState } from 'react';
import { wikiData } from '../wikiData';
import { BookOpen } from 'lucide-react';

const WikiTooltip = ({ text, wikiId }) => {
  const [isHovered, setIsHovered] = useState(false);
  const data = wikiData[wikiId];

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-yellow-400 font-bold border-b border-dashed border-yellow-400/50 cursor-help hover:bg-yellow-400/10 transition-colors px-1 rounded">
        {text}
      </span>
      
      {isHovered && data && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 bg-gray-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="bg-yellow-400/10 p-3 border-b border-white/10 flex items-center gap-2">
            <BookOpen size={16} className="text-yellow-400" />
            <h4 className="font-heading font-bold text-yellow-400 text-sm">{data.title}</h4>
          </div>
          <div className="p-4 text-sm text-white/90 leading-relaxed font-body font-normal text-left">
            {data.content}
          </div>
        </div>
      )}
    </span>
  );
};

export default WikiTooltip;
