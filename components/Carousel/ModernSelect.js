import React from 'react';

const ModernSelect = ({ 
  label, 
  value, 
  onChange, 
  options, 
  valueKey,
  labelKey,
  placeholder = "Select an option...",
  disabled = false
}) => {
  return (
    <div>
      <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #d1d5db',
          fontSize: 13,
          background: disabled ? '#f5f5f5' : '#f9fafb',
          color: '#333',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px top 50%',
          backgroundSize: '10px auto',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option, index) => {
          const isObject = typeof option === 'object' && option !== null;
          
          const optionValue = isObject 
            ? (valueKey ? option[valueKey] : option.value) 
            : option;
          const optionLabel = isObject 
            ? (labelKey ? option[labelKey] : option.label) 
            : option;

          return (
            <option key={index} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default ModernSelect; 