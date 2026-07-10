import { VehicleService } from '@services/vehicle.service';
import { VehicleRepository } from '@repositories/vehicle.repository';
import { NotFoundError, OutOfStockError } from '@utils/app-error';

jest.mock('@repositories/vehicle.repository');

const MockedVehicleRepository = VehicleRepository as jest.MockedClass<typeof VehicleRepository>;

// A reusable sample row, shaped like what Prisma would return.
function sampleVehicle(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'vehicle-1',
    make: 'Toyota',
    model: 'Camry',
    category: 'Sedan',
    price: 28500 as unknown as number,
    quantity: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('VehicleService', () => {
  let vehicleService: VehicleService;
  let mockRepo: jest.Mocked<VehicleRepository>;

  beforeEach(() => {
    MockedVehicleRepository.mockClear();
    mockRepo = new MockedVehicleRepository() as jest.Mocked<VehicleRepository>;
    vehicleService = new VehicleService(mockRepo);
  });

  describe('createVehicle', () => {
    it('delegates to the repository and returns the created vehicle', async () => {
      const created = sampleVehicle();
      mockRepo.create.mockResolvedValue(created as never);

      const result = await vehicleService.createVehicle({
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 28500,
        quantity: 3,
      });

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith({
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 28500,
        quantity: 3,
      });
    });
  });

  describe('getVehicleById', () => {
    it('returns the vehicle when found', async () => {
      const vehicle = sampleVehicle();
      mockRepo.findById.mockResolvedValue(vehicle as never);

      const result = await vehicleService.getVehicleById('vehicle-1');

      expect(result).toEqual(vehicle);
    });

    it('throws NotFoundError when the vehicle does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(vehicleService.getVehicleById('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateVehicle', () => {
    it('updates and returns the vehicle when it exists', async () => {
      const existing = sampleVehicle();
      const updated = sampleVehicle({ price: 30000 });
      mockRepo.findById.mockResolvedValue(existing as never);
      mockRepo.update.mockResolvedValue(updated as never);

      const result = await vehicleService.updateVehicle('vehicle-1', { price: 30000 });

      expect(result.price).toBe(30000);
    });

    it('throws NotFoundError instead of calling update when the vehicle does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(vehicleService.updateVehicle('missing-id', { price: 1 })).rejects.toThrow(
        NotFoundError,
      );
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteVehicle', () => {
    it('deletes the vehicle when it exists', async () => {
      mockRepo.findById.mockResolvedValue(sampleVehicle() as never);
      mockRepo.delete.mockResolvedValue(sampleVehicle() as never);

      await vehicleService.deleteVehicle('vehicle-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('vehicle-1');
    });

    it('throws NotFoundError instead of calling delete when the vehicle does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(vehicleService.deleteVehicle('missing-id')).rejects.toThrow(NotFoundError);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('searchVehicles', () => {
    it('passes filters through to the repository', async () => {
      mockRepo.search.mockResolvedValue([sampleVehicle()] as never);

      const result = await vehicleService.searchVehicles({ make: 'Toyota', minPrice: 20000 });

      expect(mockRepo.search).toHaveBeenCalledWith({ make: 'Toyota', minPrice: 20000 });
      expect(result).toHaveLength(1);
    });
  });

  describe('purchaseVehicle', () => {
    it('decrements stock and returns the updated vehicle when in stock', async () => {
      mockRepo.decrementQuantityIfAvailable.mockResolvedValue(1);
      mockRepo.findById.mockResolvedValue(sampleVehicle({ quantity: 2 }) as never);

      const result = await vehicleService.purchaseVehicle('vehicle-1');

      expect(mockRepo.decrementQuantityIfAvailable).toHaveBeenCalledWith('vehicle-1');
      expect(result.quantity).toBe(2);
    });

    it('throws OutOfStockError when the vehicle exists but has 0 quantity', async () => {
      mockRepo.decrementQuantityIfAvailable.mockResolvedValue(0);
      mockRepo.findById.mockResolvedValue(sampleVehicle({ quantity: 0 }) as never);

      await expect(vehicleService.purchaseVehicle('vehicle-1')).rejects.toThrow(OutOfStockError);
    });

    it('throws NotFoundError when the vehicle does not exist at all', async () => {
      mockRepo.decrementQuantityIfAvailable.mockResolvedValue(0);
      mockRepo.findById.mockResolvedValue(null);

      await expect(vehicleService.purchaseVehicle('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('restockVehicle', () => {
    it('increases quantity and returns the updated vehicle', async () => {
      mockRepo.findById.mockResolvedValue(sampleVehicle({ quantity: 3 }) as never);
      mockRepo.incrementQuantity.mockResolvedValue(sampleVehicle({ quantity: 8 }) as never);

      const result = await vehicleService.restockVehicle('vehicle-1', 5);

      expect(mockRepo.incrementQuantity).toHaveBeenCalledWith('vehicle-1', 5);
      expect(result.quantity).toBe(8);
    });

    it('throws NotFoundError when the vehicle does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(vehicleService.restockVehicle('missing-id', 5)).rejects.toThrow(NotFoundError);
      expect(mockRepo.incrementQuantity).not.toHaveBeenCalled();
    });
  });
});
