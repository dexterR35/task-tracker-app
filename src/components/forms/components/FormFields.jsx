import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { format, startOfMonth, endOfMonth, addDays, startOfWeek } from 'date-fns';
import Badge from '@/components/ui/Badge/Badge';
import { Icons } from '@/components/icons';
import { showSuccess } from '@/utils/toast';

// Shared layout: wrapper, optional label, control slot, error
function FieldLayout({ field, error, children, skipLabel = false }) {
  const id = field.name;
  const labelEl = !skipLabel && field.label ? (
    <label htmlFor={id} className="field-label">
      {field.label}
      {field.required && <span className="required-indicator" aria-hidden>*</span>}
    </label>
  ) : null;
  return (
    <div className="field-wrapper">
      {labelEl}
      {children}
      {error && (
        <div id={`${id}-error`} className="error-message" role="alert">
          {error.message}
        </div>
      )}
    </div>
  );
}

const inputClass = (error, readOnly) =>
  `form-input ${readOnly ? 'readonly' : ''} ${error ? 'error' : ''}`;

// Text
export function TextField({ field, register, errors, watch, setValue }) {
  const error = errors[field.name];
  const value = watch?.(field.name) ?? '';
  const showBadge = value && field.name === 'jiraLink';
  const clear = useCallback(() => setValue?.(field.name, ''), [field.name, setValue]);
  return (
    <FieldLayout field={field} error={error}>
      <input
        {...register(field.name)}
        id={field.name}
        name={field.name}
        type={field.type ?? 'text'}
        placeholder={field.placeholder}
        autoComplete={field.autoComplete ?? 'off'}
        readOnly={field.readOnly ?? false}
        disabled={field.disabled ?? false}
        className={inputClass(error, field.readOnly)}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
      />
      {showBadge && (
        <div className="mt-2">
          <Badge variant="select_badge" size="sm" className="inline-flex items-center gap-1">
            <span className="text-inherit">{value}</span>
            <button type="button" onClick={clear} className="ml-1 hover:opacity-75 text-inherit" aria-label="Clear">×</button>
          </Badge>
        </div>
      )}
    </FieldLayout>
  );
}

// Password
export function PasswordField({ field, register, errors }) {
  const error = errors[field.name];
  return (
    <FieldLayout field={field} error={error}>
      <input
        {...register(field.name)}
        id={field.name}
        name={field.name}
        type="password"
        placeholder={field.placeholder}
        autoComplete={field.autoComplete ?? 'current-password'}
        readOnly={field.readOnly ?? false}
        disabled={field.disabled ?? false}
        className={inputClass(error, field.readOnly)}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
      />
    </FieldLayout>
  );
}

// URL (with Jira toast on blur)
const JIRA_BROWSE = /\/browse\/([A-Z]+-\d+)/i;
export function UrlField({ field, register, errors }) {
  const error = errors[field.name];
  const onBlur = useCallback(
    (e) => {
      if (field.name !== 'jiraLink' || !e.target.value?.trim()) return;
      const m = e.target.value.trim().match(JIRA_BROWSE);
      if (m) showSuccess(`✅ Task number extracted: ${m[1].toUpperCase()}`);
    },
    [field.name]
  );
  return (
    <FieldLayout field={field} error={error}>
      <input
        {...register(field.name)}
        id={field.name}
        name={field.name}
        type="url"
        placeholder={field.placeholder}
        autoComplete={field.autoComplete}
        readOnly={field.readOnly ?? false}
        disabled={field.disabled ?? false}
        onBlur={onBlur}
        className={inputClass(error, field.readOnly)}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
      />
    </FieldLayout>
  );
}

// Textarea
export function TextareaField({ field, register, errors }) {
  const error = errors[field.name];
  return (
    <FieldLayout field={field} error={error}>
      <textarea
        {...register(field.name)}
        id={field.name}
        name={field.name}
        placeholder={field.placeholder}
        rows={field.rows ?? 4}
        maxLength={field.maxLength}
        readOnly={field.readOnly ?? false}
        disabled={field.disabled ?? false}
        className={inputClass(error, field.readOnly)}
        style={{ resize: 'vertical', minHeight: '80px' }}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
      />
    </FieldLayout>
  );
}

// Number (controlled + blur clamp to min)
export function NumberField({ field, register, errors, setValue, watch }) {
  const error = errors[field.name];
  const raw = watch?.(field.name) ?? field.defaultValue ?? '';
  const value = raw === '' || raw == null ? '' : String(raw);
  const onChange = useCallback((e) => setValue?.(field.name, e.target.value), [field.name, setValue]);
  const onBlur = useCallback(
    (e) => {
      const min = field.min;
      if (min != null) {
        const n = Number(e.target.value);
        if (e.target.value !== '' && (Number.isNaN(n) || n < min)) {
          setValue?.(field.name, String(min), { shouldValidate: true });
          return;
        }
      }
      setValue?.(field.name, e.target.value, { shouldValidate: true });
    },
    [field.name, field.min, setValue]
  );
  return (
    <FieldLayout field={field} error={error}>
      <input
        {...register(field.name, { onChange })}
        id={field.name}
        name={field.name}
        type="number"
        step={field.step ?? 0.5}
        min={field.min ?? 0}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={field.placeholder}
        readOnly={field.readOnly ?? false}
        disabled={field.disabled ?? false}
        className={`${inputClass(error, field.readOnly)} number-input-left`}
        style={{ textAlign: 'left', paddingLeft: 12, paddingRight: 8 }}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
      />
    </FieldLayout>
  );
}

// Checkbox (label after input, skip FieldLayout label so we render our own)
export function CheckboxField({ field, register, errors, setValue }) {
  const error = errors[field.name];
  const id = field.name;
  return (
    <FieldLayout field={field} error={error} skipLabel>
      <div className="checkbox-field space-x-2 flex justify-start items-center">
        <input
          {...register(field.name)}
          id={id}
          type="checkbox"
          className={`form-checkbox ${error ? 'error' : ''}`}
          onChange={(e) => setValue(field.name, e.target.checked, { shouldValidate: true })}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label htmlFor={id} className="m-0">
          {field.label}
          {field.required && <span className="required-indicator" aria-hidden>*</span>}
        </label>
      </div>
    </FieldLayout>
  );
}

// Select (native) + optional clear badge
export function SelectField({ field, register, errors, watch, setValue }) {
  const error = errors[field.name];
  const value = watch?.(field.name) ?? '';
  const selected = field.options?.find((o) => o.value === value);
  const placeholder = field.placeholder || `Select ${(field.label || '').toLowerCase()}`;
  const clear = useCallback(() => setValue?.(field.name, ''), [field.name, setValue]);
  return (
    <FieldLayout field={field} error={error}>
      <select
        {...register(field.name)}
        id={field.name}
        name={field.name}
        className={`form-input ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.name}-error` : undefined}
      >
        <option value="">{placeholder}</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {value && selected && (
        <div className="mt-2">
          <Badge variant="amber" size="sm" className="inline-flex items-center gap-1">
            <span className="text-inherit">{selected.label}</span>
            <button type="button" onClick={clear} className="ml-1 hover:opacity-75 text-inherit" aria-label={`Clear ${selected.label}`}>×</button>
          </Badge>
        </div>
      )}
    </FieldLayout>
  );
}

// Multi-select (setValue/watch only)
export function MultiSelectField({ field, setValue, watch, errors }) {
  const error = errors[field.name];
  const value = watch(field.name);
  const selected = Array.isArray(value) ? value : [];
  const options = field.options ?? [];
  const available = options.filter((o) => !selected.includes(o.value));
  useEffect(() => {
    if (value !== undefined && !Array.isArray(value)) setValue(field.name, [], { shouldValidate: false });
  }, [field.name, value, setValue]);
  const add = useCallback((v) => {
    if (!v || selected.includes(v)) return;
    setValue(field.name, [...selected, v], { shouldValidate: true });
  }, [field.name, selected, setValue]);
  const remove = useCallback((i) => {
    setValue(field.name, selected.filter((_, j) => j !== i), { shouldValidate: true });
  }, [field.name, selected, setValue]);
  return (
    <FieldLayout field={field} error={error}>
      <div className="multi-select-container">
        <select
          id={field.name}
          name={field.name}
          value=""
          className={`form-input ${error ? 'error' : ''}`}
          onChange={(e) => add(e.target.value)}
          aria-label={field.label || field.name}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.name}-error` : undefined}
        >
          <option value="">{field.placeholder || 'Select options'}</option>
          {available.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {selected.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2 list-none p-0 m-0" aria-live="polite">
            {selected.map((val, i) => {
              const o = options.find((x) => x.value === val);
              const label = o?.label ?? val;
              return (
                <li key={`${val}-${i}`}>
                  <Badge variant="green" size="sm" className="inline-flex items-center gap-1">
                    <span className="text-inherit">{label}</span>
                    <button type="button" onClick={() => remove(i)} className="ml-1 hover:opacity-75 text-inherit" aria-label={`Remove ${label}`}>×</button>
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FieldLayout>
  );
}

// Searchable single-select (setValue/watch only)
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MIN_DATE = new Date(2020, 0, 1);
const MAX_DATE = new Date(2030, 11, 31);
const getOptionLabel = (o) => o?.label ?? o?.name ?? '';

export const SearchableSelectField = memo(function SearchableSelectField({
  field,
  errors = {},
  setValue,
  watch,
  noOptionsMessage = 'No options found',
  disabled = false,
}) {
  const error = errors[field.name];
  const id = field.name;
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(field.options || []);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const currentValue = watch(field.name);
  const selectedOption = field.options?.find((o) => o.value === currentValue);

  useEffect(() => {
    if (disabled) {
      setFilteredOptions([]);
      setIsOpen(false);
      return;
    }
    const opts = field.options || [];
    setFilteredOptions(
      !searchTerm.trim() ? opts : opts.filter((o) => getOptionLabel(o).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, field.options, disabled]);

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const onInputChange = useCallback((e) => {
    if (disabled) return;
    setSearchTerm(e.target.value);
    setIsOpen(true);
  }, [disabled]);

  const onSelect = useCallback((option) => {
    if (disabled) return;
    setValue(field.name, option.value, { shouldValidate: true });
    setSearchTerm('');
    setIsOpen(false);
  }, [disabled, field.name, setValue]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      return;
    }
    if (e.key === 'Enter' && isOpen) {
      e.preventDefault();
      if (filteredOptions[0]) onSelect(filteredOptions[0]);
      return;
    }
    if (e.key === 'Backspace' && !searchTerm && currentValue) setValue(field.name, '', { shouldValidate: true });
  };

  const clear = useCallback(() => {
    setValue(field.name, '', { shouldValidate: true });
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [field.name, setValue]);

  const displayValue = isOpen ? searchTerm : (selectedOption ? getOptionLabel(selectedOption) : '');

  return (
    <FieldLayout field={field} error={error}>
      <div className="relative z-10 searchable-select-wrap" ref={dropdownRef}>
        <input
          ref={inputRef}
          id={id}
          name={id}
          type="text"
          value={displayValue}
          onChange={onInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={field.placeholder || `Search ${field.label?.toLowerCase() || '...'}...`}
          disabled={disabled}
          readOnly={disabled}
          className={`form-input w-full pr-9 ${error ? 'error' : ''} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-expanded={isOpen}
          autoComplete="off"
        />
        <span className="searchable-select-arrow" aria-hidden>
          <Icons.buttons.chevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
        {displayValue && !isOpen && (
          <button
            type="button"
            onClick={clear}
            disabled={disabled}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 disabled:opacity-50"
            title="Clear selection"
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
        {isOpen && (
          <div className="absolute card p-0 z-[9999] w-full mt-1 max-h-60 overflow-auto shadow-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, i) => (
                <div
                  key={`${option.value}-${i}`}
                  onClick={() => onSelect(option)}
                  className={`px-4 py-2 cursor-pointer hover:bg-blue-900 transition-colors ${option.value === currentValue ? 'bg-blue-900' : ''}`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-300 dark:text-gray-200 truncate">{getOptionLabel(option)}</span>
                    {option.email && <span className="text-[11px] text-gray-400 lowercase truncate">{option.email}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{noOptionsMessage}</div>
            )}
          </div>
        )}
      </div>
    </FieldLayout>
  );
}, (prev, next) =>
  prev.field.name === next.field.name &&
  prev.field.options === next.field.options &&
  prev.disabled === next.disabled &&
  prev.errors === next.errors &&
  prev.watch(prev.field.name) === next.watch(next.field.name)
);

// Date picker (setValue/watch only)
export function SimpleDateField({ field, errors, setValue, watch }) {
  const name = field.name;
  const error = errors[name];
  const value = watch(name) || '';
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value + 'T12:00:00') : new Date()));
  useEffect(() => {
    if (value) setViewMonth(new Date(value + 'T12:00:00'));
  }, [value]);
  const handleSelect = (date) => {
    setValue(name, format(date, 'yyyy-MM-dd'), { shouldValidate: true });
    setIsOpen(false);
  };
  const prevMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1));
  const nextMonth = () => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1));
  const display = value ? format(new Date(value + 'T12:00:00'), 'MMM d, yyyy') : (field.placeholder || 'Select a date');
  const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  return (
    <FieldLayout field={field} error={error}>
      <div className="relative">
        <button
          type="button"
          id={name}
          aria-label={field.label || 'Select date'}
          aria-expanded={isOpen}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full px-4 py-3 border rounded-lg cursor-pointer text-left flex items-center justify-between transition-colors ${error ? 'border-red-500' : 'border-gray-600 bg-transparent hover:border-blue-500'} focus:ring-2 focus:ring-blue-500/20`}
          onClick={() => setIsOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((o) => !o);
            }
          }}
        >
          <span className={value ? 'text-gray-200 font-medium' : 'text-gray-400'}>{display}</span>
          <Icons.generic.calendar className="w-5 h-5 text-gray-400 shrink-0" />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden />
            <div className="absolute z-50 mt-2 left-0 card rounded-xl shadow-xl p-4 w-72">
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-gray-700 rounded">
                  <Icons.buttons.chevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium">{format(viewMonth, 'MMMM yyyy')}</span>
                <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-gray-700 rounded">
                  <Icons.buttons.chevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, i) => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const inMonth = date >= startOfMonth(viewMonth) && date <= endOfMonth(viewMonth);
                  const disabled = date < MIN_DATE || date > MAX_DATE;
                  const selected = value === dateStr;
                  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleSelect(date)}
                      className={`w-9 h-9 text-sm rounded-lg ${disabled ? 'text-gray-600 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-700'} ${inMonth ? 'text-gray-200' : 'text-gray-500'} ${selected ? 'bg-blue-600 text-white' : ''} ${isToday && !selected ? 'ring-1 ring-blue-400' : ''}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </FieldLayout>
  );
}
