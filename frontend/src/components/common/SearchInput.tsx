import React from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  debounceMs?: number;
  style?: React.CSSProperties;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 400,
  style,
}) => {
  const [value, setValue] = React.useState('');
  const debouncedValue = useDebounce(value, debounceMs);

  React.useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <Input
      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      allowClear
      style={{ width: 280, ...style }}
    />
  );
};
