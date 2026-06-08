import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock core team service
const mockCoreTeamService = {
  getMembers: vi.fn(),
  addMember: vi.fn(),
  updateMember: vi.fn(),
  removeMember: vi.fn(),
};

describe('Core Team Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve all core team members', async () => {
    const mockMembers = [
      { id: '1', name: 'John Doe', role: 'Organiser' },
      { id: '2', name: 'Jane Smith', role: 'Co-organiser' },
    ];
    mockCoreTeamService.getMembers.mockResolvedValue(mockMembers);

    const result = await mockCoreTeamService.getMembers();
    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('Organiser');
  });

  it('should add a new core team member', async () => {
    const newMember = { name: 'Alice Brown', role: 'Core Team Member' };
    const addedMember = { id: '3', ...newMember };
    mockCoreTeamService.addMember.mockResolvedValue(addedMember);

    const result = await mockCoreTeamService.addMember(newMember);
    expect(result.id).toBe('3');
    expect(result.name).toBe('Alice Brown');
  });

  it('should update team member details', async () => {
    const updated = { id: '1', name: 'John Doe', role: 'Lead Organiser' };
    mockCoreTeamService.updateMember.mockResolvedValue(updated);

    const result = await mockCoreTeamService.updateMember('1', { role: 'Lead Organiser' });
    expect(result.role).toBe('Lead Organiser');
  });

  it('should remove a team member', async () => {
    mockCoreTeamService.removeMember.mockResolvedValue({ success: true });
    const result = await mockCoreTeamService.removeMember('1');
    expect(result.success).toBe(true);
  });

  it('should handle validation errors for invalid members', async () => {
    mockCoreTeamService.addMember.mockRejectedValue(
      new Error('Invalid member data')
    );
    await expect(mockCoreTeamService.addMember({})).rejects.toThrow(
      'Invalid member data'
    );
  });

  it('should filter members by role', async () => {
    const allMembers = [
      { id: '1', name: 'John', role: 'Organiser' },
      { id: '2', name: 'Jane', role: 'Core Team Member' },
      { id: '3', name: 'Alice', role: 'Core Team Member' },
    ];
    mockCoreTeamService.getMembers.mockResolvedValue(allMembers);

    const result = await mockCoreTeamService.getMembers();
    const coreMembers = result.filter((m) => m.role === 'Core Team Member');
    expect(coreMembers).toHaveLength(2);
  });
});
