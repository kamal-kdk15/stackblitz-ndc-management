'use client';
import { useState } from 'react';

export default function IconActionButton({ icon, label, onClick, disabled, color }) {
  const [hover, setHover] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '32px',
          height: '32px',
          border: '1.5px solid #EDE8E0',
          borderRadius: '7px',
          background: '#fff',
          color: color || '#444',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {icon}
      </button>
      {hover && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1A1A1A',
            color: 'white',
            fontSize: '10px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '5px',
            whiteSpace: 'nowrap',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}