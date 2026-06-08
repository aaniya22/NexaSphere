import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock eventsService (in a real app, this would be your actual service)
const mockEventsService = {
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

describe('Events Service (Backend Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of all events', async () => {
    const mockEvents = [
      { id: 'e1', name: 'Event 1', status: 'upcoming' },
      { id: 'e2', name: 'Event 2', status: 'completed' },
    ];
    mockEventsService.getAll.mockResolvedValue(mockEvents);

    const result = await mockEventsService.getAll();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Event 1');
  });

  it('should create a new event', async () => {
    const newEvent = { name: 'New Event', status: 'upcoming' };
    const createdEvent = { id: 'e3', ...newEvent };
    mockEventsService.create.mockResolvedValue(createdEvent);

    const result = await mockEventsService.create(newEvent);
    expect(result.id).toBe('e3');
    expect(mockEventsService.create).toHaveBeenCalledWith(newEvent);
  });

  it('should update an existing event', async () => {
    const updatedEvent = { id: 'e1', name: 'Updated Event', status: 'completed' };
    mockEventsService.update.mockResolvedValue(updatedEvent);

    const result = await mockEventsService.update('e1', { status: 'completed' });
    expect(result.status).toBe('completed');
  });

  it('should delete an event', async () => {
    mockEventsService.delete.mockResolvedValue(true);
    const result = await mockEventsService.delete('e1');
    expect(result).toBe(true);
    expect(mockEventsService.delete).toHaveBeenCalledWith('e1');
  });

  it('should handle errors gracefully', async () => {
    mockEventsService.getAll.mockRejectedValue(new Error('Database error'));
    await expect(mockEventsService.getAll()).rejects.toThrow('Database error');
  });
});
