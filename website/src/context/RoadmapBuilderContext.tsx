import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface ResourceLink {
  title: string;
  url: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Stuck';
  notes: string;
  resources: ResourceLink[];
  prerequisites: string[];
}

export interface RoadmapBuilderContextType {
  nodes: RoadmapNode[];
  roadmapTitle: string;
  roadmapDescription: string;
  selectedNodeId: string | null;
  activeNodeId: string | null;
  addNode: (node: Omit<RoadmapNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<RoadmapNode>) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: RoadmapNode[]) => void;
  setRoadmapTitle: (title: string) => void;
  setRoadmapDescription: (desc: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveNodeId: (id: string | null) => void;
  loadRoadmap: (title: string, description: string, nodes: RoadmapNode[]) => void;
  resetRoadmap: () => void;
}

export const RoadmapBuilderContext = createContext<RoadmapBuilderContextType | undefined>(
  undefined
);

const LOCAL_STORAGE_KEY = 'ns-interactive-roadmap-workspace';

export const RoadmapBuilderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [nodes, setNodesState] = useState<RoadmapNode[]>([]);
  const [roadmapTitle, setRoadmapTitleState] = useState<string>('My Custom Path');
  const [roadmapDescription, setRoadmapDescriptionState] = useState<string>(
    'Build and track your interactive personalized learning roadmap.'
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Restore workspace automatically from localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          setNodesState(parsed.nodes);
        }
        if (parsed.title) {
          setRoadmapTitleState(parsed.title);
        }
        if (parsed.description) {
          setRoadmapDescriptionState(parsed.description);
        }
      } else {
        // Load a default node if canvas is empty on first load
        const defaultNodes: RoadmapNode[] = [
          {
            id: 'node-1',
            title: 'Getting Started',
            description:
              'This is your first learning node. Drag me around, double click or click "Edit" to configure!',
            x: 200,
            y: 150,
            status: 'Not Started',
            notes: '- Learn the basics\n- Customize this node',
            resources: [{ title: 'NexaSphere Home', url: 'https://nexasphere.gl' }],
            prerequisites: [],
          },
        ];
        setNodesState(defaultNodes);
      }
    } catch (e) {
      console.error('Failed to load roadmap from localStorage:', e);
    }
  }, []);

  // Autosave roadmap state using localStorage on every change
  useEffect(() => {
    // Skip empty initial state saving to prevent overwriting
    if (nodes.length === 0 && roadmapTitle === 'My Custom Path') return;

    const stateToSave = {
      title: roadmapTitle,
      description: roadmapDescription,
      nodes,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [nodes, roadmapTitle, roadmapDescription]);

  const addNode = useCallback((nodeData: Omit<RoadmapNode, 'id'>) => {
    const id = `node-${Date.now()}`;
    const newNode: RoadmapNode = {
      ...nodeData,
      id,
    };
    setNodesState((prev) => [...prev, newNode]);
    setActiveNodeId(id);
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<RoadmapNode>) => {
    setNodesState((prev) => prev.map((node) => (node.id === id ? { ...node, ...updates } : node)));
  }, []);

  const deleteNode = useCallback(
    (id: string) => {
      setNodesState((prev) => {
        // 1. Remove the node
        const filtered = prev.filter((node) => node.id !== id);
        // 2. Remove any prerequisite references to this deleted node to prevent deadlocks
        return filtered.map((node) => {
          if (node.prerequisites.includes(id)) {
            return {
              ...node,
              prerequisites: node.prerequisites.filter((pid) => pid !== id),
            };
          }
          return node;
        });
      });
      if (selectedNodeId === id) setSelectedNodeId(null);
      if (activeNodeId === id) setActiveNodeId(null);
    },
    [selectedNodeId, activeNodeId]
  );

  const setNodes = useCallback((newNodes: RoadmapNode[]) => {
    setNodesState(newNodes);
  }, []);

  const setRoadmapTitle = useCallback((title: string) => {
    setRoadmapTitleState(title);
  }, []);

  const setRoadmapDescription = useCallback((desc: string) => {
    setRoadmapDescriptionState(desc);
  }, []);

  const loadRoadmap = useCallback((title: string, description: string, newNodes: RoadmapNode[]) => {
    setRoadmapTitleState(title);
    setRoadmapDescriptionState(description);
    setNodesState(newNodes);
    setSelectedNodeId(null);
    setActiveNodeId(null);
  }, []);

  const resetRoadmap = useCallback(() => {
    setRoadmapTitleState('New Learning Path');
    setRoadmapDescriptionState('Custom learning flow created on NexaSphere.');
    setNodesState([]);
    setSelectedNodeId(null);
    setActiveNodeId(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return (
    <RoadmapBuilderContext.Provider
      value={{
        nodes,
        roadmapTitle,
        roadmapDescription,
        selectedNodeId,
        activeNodeId,
        addNode,
        updateNode,
        deleteNode,
        setNodes,
        setRoadmapTitle,
        setRoadmapDescription,
        setSelectedNodeId,
        setActiveNodeId,
        loadRoadmap,
        resetRoadmap,
      }}
    >
      {children}
    </RoadmapBuilderContext.Provider>
  );
};
