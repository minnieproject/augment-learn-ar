interface ARLabelProps {
  text: string;
  position: { x: string; y: string };
  linePosition?: 'top' | 'bottom' | 'left' | 'right';
}

export const ARLabel = ({ text, position, linePosition = 'bottom' }: ARLabelProps) => {
  return (
    <div
      className="absolute z-20 pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Pointer Line */}
      <div className="relative">
        {linePosition === 'bottom' && (
          <div className="absolute left-1/2 top-full w-0.5 h-12 bg-white transform -translate-x-1/2" />
        )}
        {linePosition === 'top' && (
          <div className="absolute left-1/2 bottom-full w-0.5 h-12 bg-white transform -translate-x-1/2" />
        )}
        {linePosition === 'left' && (
          <div className="absolute right-full top-1/2 h-0.5 w-12 bg-white transform -translate-y-1/2" />
        )}
        {linePosition === 'right' && (
          <div className="absolute left-full top-1/2 h-0.5 w-12 bg-white transform -translate-y-1/2" />
        )}
        
        {/* Label Box */}
        <div className="bg-black/90 text-white px-4 py-2 rounded border border-white/40 whitespace-nowrap shadow-lg">
          <span className="text-sm font-medium">{text}</span>
        </div>
      </div>
    </div>
  );
};
