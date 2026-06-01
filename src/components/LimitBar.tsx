import React from 'react';

interface LimitBarProps {
  count: number;
}

export default function LimitBar({ count }: LimitBarProps) {
  const max = 2;
  const remaining = Math.max(0, max - count);
  
  // Calculate percentage for progress bar
  // 2 remaining = 100%, 1 remaining = 50%, 0 remaining = 0%
  const widthPercent = (remaining / max) * 100;

  // State colors
  let barColor = '#10B981'; // Green for 2 remaining
  let pillBg = 'rgba(16, 185, 129, 0.1)';
  let pillColor = '#059669';
  
  if (remaining === 1) {
    barColor = '#F59E0B'; // Amber for 1 remaining
    pillBg = 'rgba(245, 158, 11, 0.1)';
    pillColor = '#B45309';
  } else if (remaining === 0) {
    barColor = '#EF4444'; // Red for 0 remaining
    pillBg = 'rgba(239, 68, 68, 0.1)';
    pillColor = '#B91C1C';
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 animate-fade-rise">
      {/* Info Text Row */}
      <div className="flex items-center justify-between px-1">
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#6B7280', 
          fontFamily: "'Inter', sans-serif",
          margin: 0
        }}>
          {count} used today · Resets at midnight
        </p>
        
        {/* Status Pill */}
        <span style={{
          backgroundColor: pillBg,
          color: pillColor,
          padding: '0.2rem 0.6rem',
          borderRadius: '9999px',
          fontSize: '0.7rem',
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif"
        }}>
          {remaining} of {max} remaining
        </span>
      </div>
      
      {/* Limit Reached Banner */}
      {remaining === 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '0.875rem 1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.25rem' }}>🛑</span>
          <div>
            <p style={{ 
              margin: 0, 
              color: '#B91C1C', 
              fontSize: '0.875rem', 
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif"
            }}>
              Daily limit reached
            </p>
            <p style={{ 
              margin: '0.2rem 0 0 0', 
              color: '#EF4444', 
              fontSize: '0.75rem',
              fontFamily: "'Inter', sans-serif"
            }}>
              You've used both of your free analyses for today. Your limit resets at midnight.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
