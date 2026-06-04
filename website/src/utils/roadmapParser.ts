import { RoadmapNode } from '../context/RoadmapBuilderContext';

interface StaticResource {
  title: string;
  url: string;
}

interface StaticNode {
  id: string;
  label: string;
  description: string;
  concepts?: string[];
  docs?: string;
  tutorials?: StaticResource[];
  practice?: StaticResource[];
}

interface StaticRoadmap {
  title: string;
  description: string;
  nodes: StaticNode[];
}

/**
 * Transforms a static NexaSphere roadmap from roadmapData.js into an interactive graph format.
 * Auto-calculates visually appealing zigzag layout positions and establishes linear prerequisite linkages.
 */
export const parseStaticRoadmap = (
  key: string,
  staticRoadmap: StaticRoadmap
): { title: string; description: string; nodes: RoadmapNode[] } => {
  const parsedNodes: RoadmapNode[] = [];
  const nodes = staticRoadmap.nodes || [];

  nodes.forEach((sNode, idx) => {
    // 1. Position calculation: Alternate left and right down a vertical flow.
    // Width of standard canvas will be ~1000px.
    // Node default dimensions: width: ~220px, height: ~90px.
    let x = 400; // Center coordinate
    if (idx > 0) {
      x = idx % 2 === 0 ? 550 : 250;
    }
    const y = 80 + idx * 180; // Increment y to flow down

    // 2. Consolidate different resource categories into a singular resources array
    const resources: { title: string; url: string }[] = [];
    if (sNode.docs) {
      resources.push({
        title: 'Official Documentation',
        url: sNode.docs,
      });
    }
    if (sNode.tutorials && Array.isArray(sNode.tutorials)) {
      sNode.tutorials.forEach((t) => {
        resources.push({ title: t.title, url: t.url });
      });
    }
    if (sNode.practice && Array.isArray(sNode.practice)) {
      sNode.practice.forEach((p) => {
        resources.push({ title: p.title, url: p.url });
      });
    }

    // 3. Compile personal notes from static concepts
    let notes = '';
    if (sNode.concepts && Array.isArray(sNode.concepts) && sNode.concepts.length > 0) {
      notes = `**Key Concepts to Master:**\n` + sNode.concepts.map((c) => `- [ ] ${c}`).join('\n');
    }

    // 4. Default prerequisites: link to the immediate previous node in the sequence to preserve flow
    const prerequisites: string[] = [];
    if (idx > 0 && nodes[idx - 1]) {
      prerequisites.push(nodes[idx - 1].id);
    }

    parsedNodes.push({
      id: sNode.id,
      title: sNode.label,
      description: sNode.description,
      x,
      y,
      status: 'Not Started',
      notes,
      resources,
      prerequisites,
    });
  });

  return {
    title: staticRoadmap.title,
    description: staticRoadmap.description,
    nodes: parsedNodes,
  };
};
