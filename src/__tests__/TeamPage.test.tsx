import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import TeamPage from '../pages/team/TeamPage';

const mockTeamMembers = [
  { id: 1, name: 'Lead Developer', role: 'Organiser', branch: 'CSE', year: '4th Year' },
  { id: 2, name: 'Co-Lead', role: 'Co-organiser', branch: 'CS', year: '3rd Year' }
];

describe('TeamPage Component', () => {
  const mockOnBack = vi.fn();
  const mockOnApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ members: mockTeamMembers }),
      })
    );
  });

  it('renders team page with title', async () => {
    await act(async () => {
      render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    });
    expect(screen.getAllByText(/Core Team/i).length).toBeGreaterThan(0);
  });

  it('displays leadership section', async () => {
    await act(async () => {
      render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    });
    expect(screen.getByText(/Leadership/i)).toBeInTheDocument();
  });

  it('displays core members section', async () => {
    await act(async () => {
      render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    });
    expect(screen.getByText(/Core Members/i)).toBeInTheDocument();
  });

  it('renders apply card with call to action', async () => {
    await act(async () => {
      render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    });
    expect(screen.getByText(/Want to Join NexaSphere/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Here/i)).toBeInTheDocument();
  });

  it('renders back button', async () => {
    await act(async () => {
      render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    });
    const backBtn = screen.getByText(/← Back/);
    expect(backBtn).toBeInTheDocument();
  });

  it('displays at least one team member card', async () => {
    await act(async () => {
      render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    });
    expect(screen.getByText('Lead Developer')).toBeInTheDocument();
  });

  it('renders call to action title', async () => {
    await act(async () => {
      render(<TeamPage onBack={mockOnBack} onApply={mockOnApply} />);
    });
    expect(screen.getByText(/Want to Join NexaSphere/i)).toBeInTheDocument();
  });
});
