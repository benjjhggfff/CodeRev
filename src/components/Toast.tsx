import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#1a242d',
        color: '#86efac',
        padding: '10px 20px',
        borderRadius: 8,
        border: '1px solid #3a5068',
        zIndex: 9999,
        fontSize: 16,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    >
      {message}
    </div>
  );
}