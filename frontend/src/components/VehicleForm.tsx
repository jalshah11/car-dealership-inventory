import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import type { Vehicle } from '@/types/api';

// Mirrors backend/src/validators/vehicle.validator.ts's createVehicleSchema
// closely enough for real-time UX feedback -- the backend independently
// re-validates everything, same principle as the auth forms.
const vehicleFormSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  quantity: z.coerce.number().int('Must be a whole number').min(0, 'Cannot be negative'),
});

export type VehicleFormValues = z.output<typeof vehicleFormSchema>;
// The FORM's raw input type differs from its validated OUTPUT type here
// specifically because of z.coerce: price/quantity accept whatever the
// <input type="number"> gives us (effectively unknown pre-validation) but
// are guaranteed numbers once Zod has run. react-hook-form's useForm
// takes a third generic for exactly this input-vs-output split -- without
// it, TypeScript sees the resolver's input type (unknown) as incompatible
// with defaultValues' output type (number) and the whole form fails to
// type-check.
type VehicleFormInput = z.input<typeof vehicleFormSchema>;

interface VehicleFormProps {
  initialValues?: Vehicle;
  onSubmit: (values: VehicleFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function VehicleForm({ initialValues, onSubmit, onCancel, isSubmitting }: VehicleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormInput, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: initialValues
      ? {
          make: initialValues.make,
          model: initialValues.model,
          category: initialValues.category,
          price: initialValues.price,
          quantity: initialValues.quantity,
        }
      : { make: '', model: '', category: '', price: 0, quantity: 0 },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-white p-4"
      noValidate
    >
      <Input label="Make" error={errors.make?.message} {...register('make')} />
      <Input label="Model" error={errors.model?.message} {...register('model')} />
      <Input label="Category" error={errors.category?.message} {...register('category')} />
      <Input
        label="Price"
        type="number"
        step="0.01"
        min={0}
        error={errors.price?.message}
        {...register('price')}
      />
      <Input
        label="Quantity"
        type="number"
        min={0}
        error={errors.quantity?.message}
        {...register('quantity')}
      />

      <div className="col-span-2 flex gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues ? 'Save changes' : 'Create vehicle'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
