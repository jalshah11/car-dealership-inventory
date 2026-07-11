import { Link } from 'react-router-dom';
import { Vehicle } from '@/types/api';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const isOutOfStock = vehicle.quantity === 0;

  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md"
    >
      {/* Header strip: make/model as the headline, category as an eyebrow --
          mirrors how a window sticker leads with the vehicle identity before
          any figures. */}
      <div className="border-b border-border bg-navy px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-light">
          {vehicle.category}
        </p>
        <h3 className="font-display text-lg font-semibold text-white">
          {vehicle.make} {vehicle.model}
        </h3>
      </div>

      {/* Spec block: price and stock rendered as tabular monospace figures,
          the way an actual Monroney label lists numbers -- this is the
          page's signature detail, used consistently everywhere a vehicle's
          price/quantity appears. */}
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">Price</p>
          <p className="spec-figure text-xl font-medium text-ink">
            {currencyFormatter.format(vehicle.price)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-ink-soft">In stock</p>
          <p
            className={`spec-figure text-xl font-medium ${isOutOfStock ? 'text-danger' : 'text-success'}`}
          >
            {isOutOfStock ? 'Sold out' : vehicle.quantity}
          </p>
        </div>
      </div>
    </Link>
  );
}
