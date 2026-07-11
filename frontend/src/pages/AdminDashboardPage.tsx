import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useRestockVehicleMutation,
} from '@/hooks/useVehicles';
import type { Vehicle } from '@/types/api';
import { VehicleForm, type VehicleFormValues } from '@/components/VehicleForm';
import { RestockControl } from '@/components/RestockControl';
import { Button } from '@/components/Button';
import { PageLoadingState } from '@/components/Spinner';
import { getErrorMessage } from '@/utils/get-error-message';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

type FormMode = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; vehicle: Vehicle };

export function AdminDashboardPage() {
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });
  const { data: vehicles, isLoading } = useVehiclesQuery({});

  const createMutation = useCreateVehicleMutation();
  const updateMutation = useUpdateVehicleMutation();
  const deleteMutation = useDeleteVehicleMutation();
  const restockMutation = useRestockVehicleMutation();

  const handleCreate = (values: VehicleFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success('Vehicle created');
        setFormMode({ kind: 'closed' });
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const handleUpdate = (id: string, values: VehicleFormValues) => {
    updateMutation.mutate(
      { id, input: values },
      {
        onSuccess: () => {
          toast.success('Vehicle updated');
          setFormMode({ kind: 'closed' });
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  const handleDelete = (vehicle: Vehicle) => {
    // A native confirm() is a deliberately simple choice for a destructive
    // action -- deleting a vehicle from inventory isn't reversible through
    // the UI, and this project doesn't have a custom modal system built
    // yet. Worth upgrading to a styled confirmation dialog later.
    if (!window.confirm(`Delete ${vehicle.make} ${vehicle.model}? This cannot be undone.`)) {
      return;
    }
    deleteMutation.mutate(vehicle.id, {
      onSuccess: () => toast.success('Vehicle deleted'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  const handleRestock = (id: string, amount: number) => {
    restockMutation.mutate(
      { id, amount },
      {
        onSuccess: () => toast.success(`Restocked ${amount} unit${amount === 1 ? '' : 's'}`),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy">Manage inventory</h1>
        {formMode.kind === 'closed' && (
          <Button onClick={() => setFormMode({ kind: 'create' })}>+ Add vehicle</Button>
        )}
      </div>

      {formMode.kind === 'create' && (
        <div className="mb-6">
          <VehicleForm
            onSubmit={handleCreate}
            onCancel={() => setFormMode({ kind: 'closed' })}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {formMode.kind === 'edit' && (
        <div className="mb-6">
          <VehicleForm
            initialValues={formMode.vehicle}
            onSubmit={(values) => handleUpdate(formMode.vehicle.id, values)}
            onCancel={() => setFormMode({ kind: 'closed' })}
            isSubmitting={updateMutation.isPending}
          />
        </div>
      )}

      {isLoading && <PageLoadingState />}

      {vehicles && (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-cream text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {vehicle.make} {vehicle.model}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{vehicle.category}</td>
                  <td className="spec-figure px-4 py-3">{currencyFormatter.format(vehicle.price)}</td>
                  <td
                    className={`spec-figure px-4 py-3 ${vehicle.quantity === 0 ? 'text-danger' : ''}`}
                  >
                    {vehicle.quantity}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => setFormMode({ kind: 'edit', vehicle })}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => handleDelete(vehicle)}
                        isLoading={deleteMutation.isPending && deleteMutation.variables === vehicle.id}
                      >
                        Delete
                      </Button>
                      <RestockControl
                        onRestock={(amount) => handleRestock(vehicle.id, amount)}
                        isSubmitting={
                          restockMutation.isPending && restockMutation.variables?.id === vehicle.id
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
