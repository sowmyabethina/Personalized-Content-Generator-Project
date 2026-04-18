import React from 'react';

/* ========================================
   BUTTON COMPONENT
   ======================================== */

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const widthClass = fullWidth ? 'btn-block' : '';
  
  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="spinner spinner-sm" style={{ marginRight: '8px' }}></span>}
      {children}
    </button>
  );
}

/* ========================================
   CARD COMPONENT
   ======================================== */

export function Card({ 
  children, 
  variant = 'default',
  className = '',
  ...props 
}) {
  const variantClass = variant !== 'default' ? `card-${variant}` : '';
  
  return (
    <div className={`card ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`card-header ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`card-title ${className}`.trim()}>
      {children}
    </h3>
  );
}

export function CardSubtitle({ children, className = '' }) {
  return (
    <p className={`card-subtitle ${className}`.trim()}>
      {children}
    </p>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`card-body ${className}`.trim()}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`card-footer ${className}`.trim()}>
      {children}
    </div>
  );
}

/* ========================================
   INPUT COMPONENTS
   ======================================== */

export function Input({ 
  label, 
  hint, 
  error,
  className = '',
  ...props 
}) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input 
        className={`input ${error ? 'input-error' : ''} ${className}`.trim()} 
        {...props} 
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function Textarea({ 
  label, 
  hint, 
  error,
  className = '',
  ...props 
}) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea 
        className={`textarea ${error ? 'textarea-error' : ''} ${className}`.trim()} 
        {...props} 
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export function Select({ 
  label, 
  hint, 
  error,
  options = [],
  className = '',
  ...props 
}) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select 
        className={`select ${error ? 'select-error' : ''} ${className}`.trim()} 
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

/* ========================================
   BADGE COMPONENT
   ======================================== */

export function Badge({ 
  children, 
  variant = 'neutral',
  className = '' 
}) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}

/* ========================================
   ALERT COMPONENT
   ======================================== */

export function Alert({ 
  children, 
  variant = 'info',
  className = '' 
}) {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()}>
      {children}
    </div>
  );
}

/* ========================================
   EMPTY STATE COMPONENT
   ======================================== */

export function EmptyState({ 
  icon = '📄',
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  action = null,
  className = '' 
}) {
  return (
    <div className={`empty-state ${className}`.trim()}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

/* ========================================
   LOADING SPINNER
   ======================================== */

export function Spinner({ size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';
  return (
    <span className={`spinner ${sizeClass} ${className}`.trim()}></span>
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
        <Spinner size="lg" />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{message}</p>
      </div>
    </div>
  );
}

/* ========================================
   PAGE LAYOUT COMPONENTS
   ======================================== */

export function PageContainer({ children, className = '' }) {
  return (
    <div className={`page-container ${className}`.trim()}>
      {children}
    </div>
  );
}

export function ContentContainer({ 
  children, 
  size = 'lg',
  className = '' 
}) {
  const sizeClass = size === 'sm' ? 'content-container-sm' : size === 'md' ? 'content-container' : size === 'xs' ? 'content-container-xs' : 'content-container';
  return (
    <div className={`${sizeClass} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function Section({ 
  children, 
  title,
  subtitle,
  className = '' 
}) {
  return (
    <section className={`section ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="section-header">
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ========================================
   GRID COMPONENTS
   ======================================== */

export function Grid({ 
  children, 
  columns = 2,
  className = '' 
}) {
  return (
    <div className={`grid grid-${columns} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function Flex({ 
  children, 
  justify = 'start',
  align = 'stretch',
  wrap = false,
  direction = 'row',
  gap = 4,
  className = '' 
}) {
  const justifyClass = justify !== 'start' ? `flex-${justify}` : '';
  const alignClass = align !== 'stretch' ? `items-${align}` : '';
  const wrapClass = wrap ? 'flex-wrap' : '';
  const dirClass = direction !== 'row' ? `flex-${direction}` : '';
  const gapClass = `gap-${gap}`;
  
  return (
    <div 
      className={`flex ${justifyClass} ${alignClass} ${wrapClass} ${dirClass} ${gapClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/* ========================================
   PROGRESS BAR
   ======================================== */

export function ProgressBar({ 
  value = 0, 
  max = 100,
  variant = 'primary',
  showLabel = false,
  size = 'md',
  className = '' 
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={`progress-bar-wrapper ${className}`.trim()}>
      <div 
        style={{
          width: '100%',
          height: size === 'sm' ? '4px' : size === 'lg' ? '12px' : '8px',
          background: 'var(--color-gray-200)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden'
        }}
      >
        <div 
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: variant === 'success' ? 'var(--color-success)' : 
                       variant === 'warning' ? 'var(--color-warning)' : 
                       variant === 'error' ? 'var(--color-error)' : 
                       'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease'
          }}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-secondary" style={{ marginTop: '4px', display: 'block' }}>
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

/* ========================================
   FILE INPUT
   ======================================== */

export function FileInput({ 
  label,
  hint,
  error,
  accept = '.pdf',
  onChange,
  disabled = false,
  className = ''
}) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        className={`input ${className}`.trim()}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      />
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
