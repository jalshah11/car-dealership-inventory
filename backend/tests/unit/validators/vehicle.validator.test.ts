import {
  createVehicleSchema,
  updateVehicleSchema,
  searchVehicleSchema,
  restockSchema,
} from '@validators/vehicle.validator';

describe('createVehicleSchema', () => {
  const valid = {
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 28500.5,
    quantity: 4,
  };

  it('accepts a valid vehicle payload', () => {
    expect(createVehicleSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a missing make', () => {
    const { make: _make, ...withoutMake } = valid;
    expect(createVehicleSchema.safeParse(withoutMake).success).toBe(false);
  });

  it('rejects a negative price', () => {
    expect(createVehicleSchema.safeParse({ ...valid, price: -100 }).success).toBe(false);
  });

  it('rejects a negative quantity', () => {
    expect(createVehicleSchema.safeParse({ ...valid, quantity: -1 }).success).toBe(false);
  });

  it('rejects a non-integer quantity', () => {
    expect(createVehicleSchema.safeParse({ ...valid, quantity: 2.5 }).success).toBe(false);
  });

  it('defaults quantity to 0 when omitted', () => {
    const { quantity: _quantity, ...withoutQuantity } = valid;
    const result = createVehicleSchema.safeParse(withoutQuantity);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(0);
    }
  });

  it('strips unknown fields (e.g. a spoofed id)', () => {
    const result = createVehicleSchema.safeParse({ ...valid, id: 'attacker-supplied-id' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});

describe('updateVehicleSchema', () => {
  it('accepts a partial payload (only fields being changed)', () => {
    expect(updateVehicleSchema.safeParse({ price: 25000 }).success).toBe(true);
  });

  it('accepts an empty object (no-op update)', () => {
    expect(updateVehicleSchema.safeParse({}).success).toBe(true);
  });

  it('still rejects an invalid value for a field that IS present', () => {
    expect(updateVehicleSchema.safeParse({ price: -1 }).success).toBe(false);
  });
});

describe('searchVehicleSchema', () => {
  it('accepts an empty query (no filters = return everything)', () => {
    expect(searchVehicleSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a combination of filters', () => {
    const result = searchVehicleSchema.safeParse({
      make: 'Toyota',
      minPrice: '20000',
      maxPrice: '40000',
    });
    expect(result.success).toBe(true);
  });

  it('coerces numeric query-string params (minPrice/maxPrice) to numbers', () => {
    // Query string values always arrive as strings (Express doesn't parse
    // ?minPrice=20000 into a number for us) -- the schema must coerce.
    const result = searchVehicleSchema.safeParse({ minPrice: '20000' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.minPrice).toBe(20000);
      expect(typeof result.data.minPrice).toBe('number');
    }
  });

  it('rejects a non-numeric minPrice', () => {
    expect(searchVehicleSchema.safeParse({ minPrice: 'not-a-number' }).success).toBe(false);
  });
});

describe('restockSchema', () => {
  it('accepts a positive integer amount', () => {
    expect(restockSchema.safeParse({ amount: 10 }).success).toBe(true);
  });

  it('rejects zero', () => {
    expect(restockSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it('rejects a negative amount', () => {
    expect(restockSchema.safeParse({ amount: -5 }).success).toBe(false);
  });

  it('rejects a non-integer amount', () => {
    expect(restockSchema.safeParse({ amount: 2.5 }).success).toBe(false);
  });
});
