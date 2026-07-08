import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Handle,
  Position,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- CUSTOM NODE COMPONENTS ---

// 1. Module Node (For main platform modules)
const ModuleNode = ({ data }: any) => {
  return (
    <div className="px-6 py-4 shadow-xl rounded-md bg-[#FDFDFD] border-t-4 border-[#802334] min-w-[200px] text-center">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-[#802334]" />
      <div className="font-mono text-[9px] uppercase tracking-widest text-[#802334] font-bold mb-1">
        Module
      </div>
      <div className="font-serif text-2xl font-light text-stone-900 leading-tight">
        {data.label}
      </div>
      <div className="font-mono text-[10px] text-stone-400 mt-2">{data.file}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-[#802334]" />
    </div>
  );
};

// 2. Component Node (For UI views)
const ComponentNode = ({ data }: any) => {
  return (
    <div className="px-5 py-3 shadow-md rounded-md bg-white border border-stone-200 min-w-[180px] text-center">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-stone-400" />
      <div className="font-mono text-[8px] uppercase tracking-wider text-stone-500 mb-1">
        UI Component
      </div>
      <div className="font-serif text-lg text-stone-850">
        {data.label}
      </div>
      <div className="font-mono text-[9px] text-stone-400 mt-1">{data.file}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-stone-400" />
    </div>
  );
};

// 3. Database Node (For DB Entities)
const DbNode = ({ data }: any) => {
  return (
    <div className="px-5 py-3 shadow-lg rounded-md bg-stone-900 border border-stone-700 min-w-[180px] text-center text-[#FDFDFD]">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-stone-500" />
      <div className="font-mono text-[8px] uppercase tracking-wider text-stone-400 mb-1">
        Database Entity
      </div>
      <div className="font-mono text-sm font-bold text-stone-100">
        {data.label}
      </div>
      <div className="font-mono text-[9px] text-stone-500 mt-1">{data.table}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-stone-500" />
    </div>
  );
};

const nodeTypes = {
  moduleNode: ModuleNode,
  componentNode: ComponentNode,
  dbNode: DbNode,
};

// --- STATIC GRAPH DATA ---

const initialNodes: Node[] = [
  // Core Coordinator
  { id: 'app', type: 'moduleNode', position: { x: 500, y: 50 }, data: { label: 'App Coordinator', file: 'src/App.tsx' } },
  
  // Modules / Views (Level 1)
  { id: 'landing', type: 'componentNode', position: { x: 100, y: 250 }, data: { label: 'Landing View', file: 'src/components/LandingView.tsx' } },
  { id: 'frontpage', type: 'componentNode', position: { x: 350, y: 250 }, data: { label: 'Frontpage View', file: 'src/components/FrontpageView.tsx' } },
  { id: 'folio', type: 'componentNode', position: { x: 600, y: 250 }, data: { label: 'Folio View', file: 'src/components/FolioView.tsx' } },
  { id: 'identity', type: 'componentNode', position: { x: 850, y: 250 }, data: { label: 'Identity Studio', file: 'src/components/IdentityStudio.tsx' } },

  // Internal Modules (Level 2)
  { id: 'desk', type: 'componentNode', position: { x: 350, y: 400 }, data: { label: 'Writing Desk', file: 'src/components/WritingDesk.tsx' } },
  { id: 'editorium', type: 'componentNode', position: { x: 600, y: 400 }, data: { label: 'Editorium', file: 'src/components/Editorium.tsx' } },

  // Database Access Layer
  { id: 'mockDb', type: 'moduleNode', position: { x: 500, y: 550 }, data: { label: 'Mock Database API', file: 'src/db/mockDb.ts' } },

  // Database Entities
  { id: 'db-users', type: 'dbNode', position: { x: 300, y: 750 }, data: { label: 'User Record', table: 'Table: users' } },
  { id: 'db-entries', type: 'dbNode', position: { x: 500, y: 750 }, data: { label: 'Entry Document', table: 'Table: entries' } },
  { id: 'db-reviews', type: 'dbNode', position: { x: 700, y: 750 }, data: { label: 'Editorial Review', table: 'Table: reviews' } },
];

const initialEdges: Edge[] = [
  // App to Components
  { id: 'e-app-landing', source: 'app', target: 'landing', animated: true, style: { stroke: '#802334', strokeWidth: 2 } },
  { id: 'e-app-frontpage', source: 'app', target: 'frontpage', animated: true, style: { stroke: '#802334', strokeWidth: 2 } },
  { id: 'e-app-folio', source: 'app', target: 'folio', animated: true, style: { stroke: '#802334', strokeWidth: 2 } },
  { id: 'e-app-identity', source: 'app', target: 'identity', animated: true, style: { stroke: '#802334', strokeWidth: 2 } },

  // Identity to internal
  { id: 'e-identity-desk', source: 'identity', target: 'desk', style: { stroke: '#d6d3d1' } },
  { id: 'e-identity-editorium', source: 'identity', target: 'editorium', style: { stroke: '#d6d3d1' } },

  // Components to mockDb
  { id: 'e-frontpage-db', source: 'frontpage', target: 'mockDb', style: { stroke: '#a8a29e' } },
  { id: 'e-folio-db', source: 'folio', target: 'mockDb', style: { stroke: '#a8a29e' } },
  { id: 'e-desk-db', source: 'desk', target: 'mockDb', style: { stroke: '#a8a29e' } },
  { id: 'e-editorium-db', source: 'editorium', target: 'mockDb', style: { stroke: '#a8a29e' } },
  { id: 'e-identity-db', source: 'identity', target: 'mockDb', style: { stroke: '#a8a29e' } },

  // mockDb to Entities
  { id: 'e-db-users', source: 'mockDb', target: 'db-users', animated: true, style: { stroke: '#44403c', strokeWidth: 2 } },
  { id: 'e-db-entries', source: 'mockDb', target: 'db-entries', animated: true, style: { stroke: '#44403c', strokeWidth: 2 } },
  { id: 'e-db-reviews', source: 'mockDb', target: 'db-reviews', animated: true, style: { stroke: '#44403c', strokeWidth: 2 } },
];

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 border border-red-200">
          <h2 className="text-xl font-bold mb-4">Architecture Studio Crashed</h2>
          <pre className="text-xs font-mono bg-white p-4 overflow-auto border border-red-100">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.error && this.state.error.stack}
          </pre>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

export const ArchitectureStudio: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <ErrorBoundary>
      <div className="w-full h-[85vh] border border-stone-200 rounded-md shadow-inner bg-stone-50 overflow-hidden relative">
        <div className="absolute top-4 left-4 z-10 p-4 bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm rounded max-w-sm">
          <h2 className="font-serif text-xl font-medium text-stone-900">Architecture Studio</h2>
          <p className="font-serif text-sm text-stone-500 italic mt-1">Read-Only Digital Twin Prototype</p>
          <p className="font-sans text-xs text-stone-600 mt-3 leading-relaxed">
            This interactive map represents the high-level system architecture of the Adjung platform. It visualizes the relationships between the main application coordinator, modular view components, and the underlying database entities.
          </p>
        </div>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-right"
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d6d3d1" />
          <Controls className="bg-white border-stone-200 shadow-sm" />
        </ReactFlow>
      </div>
    </ErrorBoundary>
  );
};
