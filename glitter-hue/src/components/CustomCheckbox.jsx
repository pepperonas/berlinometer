import React from 'react';

/**
 * CustomCheckbox Komponente für einheitliches Styling in der App
 *
 * @param {Object} props - Komponenten-Props
 * @param {string} props.id - Eindeutige ID für die Checkbox
 * @param {string} props.label - Anzeigtext
 * @param {boolean} props.checked - Checked-Status
 * @param {function} props.onChange - Change-Event Handler
 * @param {string} props.className - Optionale zusätzliche CSS-Klasse
 * @returns {JSX.Element} - Styled Checkbox
 */
const CustomCheckbox = ({ id, label, checked, onChange, className = '' }) => {
    return (
        <label htmlFor={id} className={`custom-checkbox ${className}`}>
            {label}
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={onChange}
            />
            <span className="checkmark"></span>
        </label>
    );
};

export default CustomCheckbox;