import { describe, it, expect } from 'vitest';
import { parseStaticRoadmap } from '../utils/roadmapParser';
import { validateRoadmapJSON } from '../utils/exportRoadmap';
import { RoadmapNode } from '../context/RoadmapBuilderContext';

describe('Roadmap Utility Tests', () => {
  describe('parseStaticRoadmap Parser', () => {
    it('converts static roadmap structure and generates coordinates', () => {
      const mockStaticRoadmap = {
        title: 'React Track',
        description: 'Learn React concepts.',
        nodes: [
          {
            id: 'react-basics',
            label: 'React Basics',
            description: 'Introduction to JSX.',
            concepts: ['JSX', 'Props'],
            docs: 'https://react.dev',
          },
          {
            id: 'react-hooks',
            label: 'Hooks',
            description: 'Learn state hooks.',
            concepts: ['useState', 'useEffect'],
          },
        ],
      };

      const result = parseStaticRoadmap('react-track', mockStaticRoadmap);

      expect(result.title).toBe('React Track');
      expect(result.description).toBe('Learn React concepts.');
      expect(result.nodes.length).toBe(2);

      // Verify coordinate generation flow
      expect(result.nodes[0].x).toBe(400); // first is centered
      expect(result.nodes[0].y).toBe(80);
      expect(result.nodes[1].x).toBe(250); // second defaults to alternate offset
      expect(result.nodes[1].y).toBe(260); // 80 + 180 = 260

      // Verify prerequisite chains
      expect(result.nodes[0].prerequisites.length).toBe(0);
      expect(result.nodes[1].prerequisites).toEqual(['react-basics']);

      // Verify resources mapping
      expect(result.nodes[0].resources[0]).toEqual({
        title: 'Official Documentation',
        url: 'https://react.dev',
      });

      // Verify personal notes mapping
      expect(result.nodes[0].notes).toContain('JSX');
      expect(result.nodes[0].notes).toContain('- [ ] Props');
    });
  });

  describe('validateRoadmapJSON JSON Validator', () => {
    it('allows valid roadmap JSON structures', () => {
      const mockValidJSON = {
        title: 'Web Design Masterclass',
        description: 'Learn modern visuals.',
        nodes: [
          {
            id: 'html',
            title: 'HTML Essentials',
            description: 'Build layouts.',
            x: 200,
            y: 100,
            status: 'Completed',
            notes: 'Completed notes',
            resources: [{ title: 'MDN', url: 'https://developer.mozilla.org' }],
            prerequisites: [],
          },
          {
            id: 'css',
            title: 'CSS Grid',
            description: 'Grid layout styles.',
            x: 350,
            y: 250,
            status: 'In Progress',
            notes: 'Grid notes',
            resources: [],
            prerequisites: ['html'],
          },
        ],
      };

      const result = validateRoadmapJSON(mockValidJSON);
      expect(result.title).toBe('Web Design Masterclass');
      expect(result.nodes.length).toBe(2);
      expect(result.nodes[1].prerequisites).toEqual(['html']);
    });

    it('raises validation error for malformed parameters', () => {
      const mockBadJSON = {
        title: 'Bad Structure',
        nodes: [
          {
            id: 'html',
            // title parameter missing
            x: 200,
            y: 100,
          },
        ],
      };

      expect(() => validateRoadmapJSON(mockBadJSON)).toThrow(/title.*missing/i);
    });

    it('raises validation error for cyclic prerequisite loops', () => {
      const mockCircularJSON = {
        title: 'Circular Map',
        description: 'Creates infinite dependencies.',
        nodes: [
          {
            id: 'node-a',
            title: 'Node A',
            description: 'Requires B.',
            x: 200,
            y: 100,
            status: 'Not Started',
            prerequisites: ['node-b'],
          },
          {
            id: 'node-b',
            title: 'Node B',
            description: 'Requires A.',
            x: 350,
            y: 250,
            status: 'Not Started',
            prerequisites: ['node-a'],
          },
        ],
      };

      expect(() => validateRoadmapJSON(mockCircularJSON)).toThrow(/circular prerequisite/i);
    });
  });
});
