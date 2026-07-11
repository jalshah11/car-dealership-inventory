import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';

export function RestockControl({
  onRestock,
  isSubmitting,
}: {
  onRestock: (amount: number) => void;
  isSubmitting?: boolean;
}) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return;
    }
    onRestock(parsed);
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        type="number"
        min={1}
        step={1}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Qty"
        aria-label="Restock amount"
        className="w-16 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-amber focus:ring-1 focus:ring-amber"
      />
      <Button type="submit" variant="secondary" isLoading={isSubmitting} className="px-2 py-1 text-xs">
        Restock
      </Button>
    </form>
  );
}
