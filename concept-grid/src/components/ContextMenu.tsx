import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  onAction: (action: string) => void;
  onClose: () => void;
  targetType: string | null;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onAction, onClose, targetType }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const getMenuItems = () => {
    const commonItems = [
      { label: 'Duplicate', action: 'duplicate' },
      { label: 'Delete', action: 'delete' },
    ];

    if (targetType === 'sticky-note') {
      return [
        { label: 'Change Color', action: 'change-color' },
        { label: 'Resize', action: 'resize' },
        ...commonItems,
      ];
    }

    return commonItems;
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: x,
        top: y,
        position: 'absolute',
        zIndex: 1000,
      }}
    >
      {getMenuItems().map((item, index) => (
        <div
          key={index}
          className="context-menu-item"
          onClick={() => onAction(item.action)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;