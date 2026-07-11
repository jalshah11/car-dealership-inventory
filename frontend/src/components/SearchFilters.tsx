import { useForm } from 'react-hook-form';
import type { SearchFilters as SearchFiltersType } from '@/types/api';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';

interface SearchFiltersFormValues {
  make: string;
  model: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

const EMPTY_VALUES: SearchFiltersFormValues = {
  make: '',
  model: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

export function SearchFilters({ onSearch }: { onSearch: (filters: SearchFiltersType) => void }) {
  const { register, handleSubmit, reset } = useForm<SearchFiltersFormValues>({
    defaultValues: EMPTY_VALUES,
  });

  const onSubmit = (values: SearchFiltersFormValues) => {
    // Convert the form's all-strings shape into the typed filters the API
    // expects, dropping any field the user left blank rather than sending
    // an empty string (an empty "make=" would filter for vehicles whose
    // make literally IS an empty string, matching nothing).
    const filters: SearchFiltersType = {};
    if (values.make.trim()) filters.make = values.make.trim();
    if (values.model.trim()) filters.model = values.model.trim();
    if (values.category.trim()) filters.category = values.category.trim();
    if (values.minPrice) filters.minPrice = Number(values.minPrice);
    if (values.maxPrice) filters.maxPrice = Number(values.maxPrice);
    onSearch(filters);
  };

  const handleClear = () => {
    reset(EMPTY_VALUES);
    onSearch({});
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-border bg-white p-4 sm:grid-cols-3 md:grid-cols-5"
    >
      <Input label="Make" placeholder="Toyota" {...register('make')} />
      <Input label="Model" placeholder="Camry" {...register('model')} />
      <Input label="Category" placeholder="SUV" {...register('category')} />
      <Input label="Min price" type="number" min={0} placeholder="0" {...register('minPrice')} />
      <Input label="Max price" type="number" min={0} placeholder="100000" {...register('maxPrice')} />

      <div className="col-span-2 flex items-end gap-2 sm:col-span-3 md:col-span-5">
        <Button type="submit">Search</Button>
        <Button type="button" variant="secondary" onClick={handleClear}>
          Clear
        </Button>
      </div>
    </form>
  );
}
