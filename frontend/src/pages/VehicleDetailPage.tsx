import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useVehicleQuery, usePurchaseVehicleMutation } from '@/hooks/useVehicles';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/Button';
import { PageLoadingState } from '@/components/Spinner';
import { getErrorMessage } from '@/utils/get-error-message';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function VehicleDetailPage() {
  // useParams() types every param as `string | undefined` -- Vehicle IDs
  // are always present given how this route is registered (/vehicles/:id),
  // but TypeScript can't know that from the route config alone, so we
  // guard explicitly rather than asserting past it.
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data: vehicle, isLoading, isError } = useVehicleQuery(id ?? '');
  const purchaseMutation = usePurchaseVehicleMutation();

  if (!id) {
    return <p className="text-danger">Missing vehicle id.</p>;
  }

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (isError || !vehicle) {
    return (
      <div>
        <p className="text-danger">Vehicle not found.</p>
        <Link to="/" className="mt-4 inline-block text-amber">
          ← Back to inventory
        </Link>
      </div>
    );
  }

  const isOutOfStock = vehicle.quantity === 0;

  const handlePurchase = () => {
    purchaseMutation.mutate(id, {
      onSuccess: () => toast.success(`Purchased ${vehicle.make} ${vehicle.model}`),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="mb-4 inline-block text-sm text-amber">
        ← Back to inventory
      </Link>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="border-b border-border bg-navy px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-light">
            {vehicle.category}
          </p>
          <h1 className="font-display text-2xl font-semibold text-white">
            {vehicle.make} {vehicle.model}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-6 px-6 py-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">Price</p>
            <p className="spec-figure text-2xl font-medium text-ink">
              {currencyFormatter.format(vehicle.price)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">Availability</p>
            <p className={`spec-figure text-2xl font-medium ${isOutOfStock ? 'text-danger' : 'text-success'}`}>
              {isOutOfStock ? 'Sold out' : `${vehicle.quantity} in stock`}
            </p>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          {isAuthenticated ? (
            <Button
              onClick={handlePurchase}
              disabled={isOutOfStock}
              isLoading={purchaseMutation.isPending}
            >
              {isOutOfStock ? 'Out of stock' : 'Purchase'}
            </Button>
          ) : (
            <p className="text-sm text-ink-soft">
              <Link to="/login" className="font-medium text-amber">
                Log in
              </Link>{' '}
              to purchase this vehicle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
