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
      { label: 'Duplizieren', action: 'duplicate', icon: '📄' },
      { label: 'Löschen', action: 'delete', icon: '🗑️', danger: true },
    ];

    if (targetType === 'sticky-note') {
      return [
        { label: 'Text bearbeiten', action: 'edit-text', icon: '✏️' },
        { label: 'Farbe ändern', action: 'change-color', icon: '🎨' },
        { label: 'Kleinere Größe', action: 'resize-small', icon: '⬇️' },
        { label: 'Größere Größe', action: 'resize-large', icon: '⬆️' },
        { label: 'In den Vordergrund', action: 'bring-forward', icon: '⬆️' },
        { label: 'In den Hintergrund', action: 'send-backward', icon: '⬇️' },
        ...commonItems,
      ];
    }

    if (['rectangle', 'circle', 'triangle'].includes(targetType || '')) {
      return [
        { label: 'Füllfarbe ändern', action: 'change-fill', icon: '🎨' },
        { label: 'Rahmenfarbe ändern', action: 'change-stroke', icon: '🖊️' },
        { label: 'In den Vordergrund', action: 'bring-forward', icon: '⬆️' },
        { label: 'In den Hintergrund', action: 'send-backward', icon: '⬇️' },
        ...commonItems,
      ];
    }

    if (targetType === 'text') {
      return [
        { label: 'Text bearbeiten', action: 'edit-text', icon: '✏️' },
        { label: 'Schriftgröße +', action: 'font-larger', icon: '🔍' },
        { label: 'Schriftgröße -', action: 'font-smaller', icon: '🔍' },
        { label: 'Textfarbe ändern', action: 'change-color', icon: '🎨' },
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
          className={`context-menu-item ${item.danger ? 'danger' : ''}`}
          onClick={() => onAction(item.action)}
        >
          <span className="menu-icon">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;