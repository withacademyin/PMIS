import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function TagInput({ 
  value = [], 
  onChange, 
  placeholder = "Type and press Enter", 
  validate = () => true,
  itemName = "item",
  invalidMessage = "Invalid format."
}) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
      setError('');
    }
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    if (error) setError('');
  };

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    // Check duplicates
    if (value.some(v => v.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      setError('');
      return;
    }

    if (!validate(trimmed)) {
      setError(invalidMessage);
      return;
    }

    onChange([...value, trimmed]);
    setInputValue('');
    setError('');
  };

  const removeTag = (indexToRemove) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex flex-wrap gap-2 p-1.5 min-h-[38px] bg-white border rounded-md transition-shadow ${
        error ? 'border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' : 'border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
      }`}>
        {value.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="flex items-center gap-1 pr-1 pl-2 py-0.5 h-6 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium"
          >
            <span className="text-xs truncate max-w-[200px]">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="w-4 h-4 rounded-full inline-flex items-center justify-center hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label={`Remove ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        
        <div className="flex-1 flex min-w-[140px] items-center">
          <Input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue) addTag();
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="h-6 flex-1 text-xs shadow-none border-transparent focus-visible:ring-0 px-1 py-0 min-w-0 bg-transparent"
          />
        </div>
      </div>
      
      {/* Footer states: Error or Item Count */}
      {error ? (
        <p className="text-[10px] text-red-500 font-medium">{error}</p>
      ) : value.length > 0 ? (
        <p className="text-[10px] text-slate-400">
          {value.length} {value.length === 1 ? itemName : itemName + 's'} configured
        </p>
      ) : null}
    </div>
  );
}
