import React, { useState, useCallback, useEffect } from 'react';
import { Youtube} from 'lucide-react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { resourceStore } from './Resources';
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface RoadmapProps {}

interface SidePanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onGenerateSubtree: () => void;
  nodeDetails: string;
  loadingDetails: boolean;
}

interface SubtreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtreeData: {
    title: string;
    nodes: Node[];
    edges: Edge[];
    context?: string;
  } | null;
  loading: boolean;
  onSubtreeNodeClick: NodeMouseHandler;
}

interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

const COHERE_API_KEY = import.meta.env.VITE_COHERE_API_KEY;

async function fetchRoadmap(topic: string, time: number, unit: string): Promise<string> {
  const prompt = `
Create a beginner-friendly learning roadmap for the topic: "${topic}" within a time span of ${time} ${unit}.

Format the output as a tree using vertical bars "|" to indicate depth/level:
- | = Main Topics
- || = Subtopics
- ||| = More Subtopics

Rules:
- 2 to 4 Main Topics
- 1 to 2 Subtopics each
- few more Subtopics
- Short, clear names only
- No preface or explanation, only the roadmap tree

Do not add bullets, dashes, indentation or explanation text.
`;

  const res = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      prompt,
      max_tokens: 300,
      temperature: 0.6,
    }),
  });

  const data = await res.json();
  return data.generations[0].text;
}

async function fetchSubtree(nodeLabel: string, topic: string, mainRoadmapText: string): Promise<string> {
  const prompt = `
Create a detailed learning roadmap for the concept: "${nodeLabel}" in the context of the topic: "${topic}".

Assume the learner already saw this in the main roadmap:

${mainRoadmapText}

Now break down "${nodeLabel}" in depth.

Use this format:
| Category
|| Concept
||| SubTopic

Rules:
- 2–3 Main Categories
- 2–3 Concepts per category
- Keep names short
- Only return the tree

Do not add bullets, dashes, indentation or explanation text.
`;

  const res = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      prompt,
      max_tokens: 400,
      temperature: 0.6,
    }),
  });

  const data = await res.json();
  return data.generations[0].text;
}

async function fetchNodeDetails(nodeLabel: string, topic: string, context: string): Promise<string> {
  const prompt = `
Provide a detailed explanation about "${nodeLabel}" in the context of learning "${topic}".

Include:
- What it is
- Why it's important
- Key concepts to understand 
- Learning tips

make it all very short like 15 to 20 words

Keep it educational and beginner-friendly and use the html structure for the format like make all under a <p> tag, dont use markdown language like *s, #s , just use <b> and tags for these stuffs
`;

  const res = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      prompt,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await res.json();
  return data.generations[0].text;
}

function cleanRoadmapText(text: string): string {
  return text
    .split('\n')
    .map(line => {
      return line.replace(/^-/, '').trim();
    })
    .filter(line => line.startsWith('|'))
    .join('\n');
}

function parseTreeToFlow(
  text: string,
  parentId: string | null = null,
  startX: number = 0,
  startY: number = 0,
  levelGap: number = 200,
  idPrefix: string = ''
): { nodes: Node[]; edges: Edge[] } {
  const lines = text.split('\n').filter(Boolean);
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stack: string[] = [];
  const mainCategoryNodes: string[] = [];

  lines.forEach((line, index) => {
    const levelMatch = line.match(/^\|+/);
    if (!levelMatch) return;

    const level = levelMatch[0].length;
    const label = line.replace(/^\|+/, '').trim();
    const id = `${idPrefix}-${index}-${label.slice(0, 8).replace(/\s/g, '')}`;

    // Special positioning for main roadmap (level 1 nodes flow sequentially)
    let nodeX: number, nodeY: number;
    if (idPrefix === 'root' && level === 1) {
      // Main categories flow vertically in sequence
      nodeX = startX + 100;
      nodeY = startY + mainCategoryNodes.length * 120;
      mainCategoryNodes.push(id);
    } else {
      // Regular tree positioning for subtrees and deeper levels
      nodeX = startX + level * levelGap;
      nodeY = startY + index * 70;
    }

    const node: Node = {
      id,
      data: { label, level },
      position: {
        x: nodeX,
        y: nodeY,
      },
      style: {
        borderRadius: level === 1 ? 12 : 8,
        padding: level === 1 ? 16 : 10,
        background: level === 1 ? '#4f46e5' : level === 2 ? '#06b6d4' : '#10b981',
        color: 'white',
        border: 'none',
        fontSize: level === 1 ? '14px' : '12px',
        fontWeight: level === 1 ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        minWidth: level === 1 ? '160px' : 'auto',
        textAlign: 'center',
      },
    };
    nodes.push(node);

    // Special connection logic for main roadmap
    if (idPrefix === 'root' && level === 1) {
      // Connect main categories sequentially
      const prevMainCategory = mainCategoryNodes[mainCategoryNodes.length - 2];
      if (prevMainCategory) {
        edges.push({
          id: `e-${prevMainCategory}-${id}`,
          source: prevMainCategory,
          target: id,
          style: { stroke: '#4f46e5', strokeWidth: 3 },
          type: 'smoothstep',
        });
      }
    } else {
      // Regular parent-child connections
      const parent = level > 0 ? stack[level - 1] : null;
      if (parent) {
        edges.push({
          id: `e-${parent}-${id}`,
          source: parent,
          target: id,
          style: { stroke: '#64748b', strokeWidth: 2 },
        });
      }
    }

    stack[level] = id;
  });

  return { nodes, edges };
}

const SidePanel: React.FC<SidePanelProps> = ({ selectedNode, onClose, onGenerateSubtree, nodeDetails, loadingDetails }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (selectedNode?.data?.label) {
      setLoadingVideos(true);
      fetchYouTubeVideos(selectedNode.data.label)
        .then(videos => {
          setVideos(videos);
          videos.forEach(video => {
            resourceStore.addResource({
              type: 'Video',
              title: video.snippet.title,
              description: `Tutorial about ${selectedNode.data.label}`,
              icon: Youtube,
              link: `https://www.youtube.com/watch?v=${video.id.videoId}`
            });
          });
        })
        .catch(() => setVideos([]))
        .finally(() => setLoadingVideos(false));
    } else {
      setVideos([]);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  return (
    <div style={{
      width: '350px',
      height: '100%',
      backgroundColor: '#1e1e2d',
      borderLeft: '1px solid #2d2d3d',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #2d2d3d',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'white'
        }}>{selectedNode.data.label}</h3>
        <button 
          onClick={onClose} 
          style={{
            background: 'none',
            border: 'none',
            color: '#a1a1aa',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem',
            lineHeight: 1
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'white'}
          onMouseOut={(e) => e.currentTarget.style.color = '#a1a1aa'}
        >
          ×
        </button>
      </div>
      
      <div style={{
        flex: 1,
        padding: '1rem',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        {/* Node Details Section */}
        <div>
          <h4 style={{
            color: 'white',
            fontWeight: 500,
            marginBottom: '0.5rem',
            fontSize: '1rem'
          }}>About</h4>
          {loadingDetails ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1rem',
              color: '#a1a1aa'
            }}>
              <div style={{
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                borderTop: '3px solid #4f46e5',
                width: '24px',
                height: '24px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p>Loading details...</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#2d2d3d',
              borderRadius: '0.5rem',
              padding: '1rem',
              color: '#e2e2e2',
              fontSize: '0.9rem',
              lineHeight: 1.5
            }}>
              <div dangerouslySetInnerHTML={{ __html: nodeDetails }} />
            </div>
          )}
        </div>

        {/* YouTube Videos Section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <h4 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'white'
          }}>Recommended Videos</h4>
          {loadingVideos ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '1rem',
              color: '#a1a1aa'
            }}>
              <div style={{
                border: '3px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                borderTop: '3px solid #4f46e5',
                width: '24px',
                height: '24px',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p>Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <p style={{
              color: '#a1a1aa',
              fontSize: '0.875rem'
            }}>No videos found for this topic.</p>
          ) : (
            <ul style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              {videos.map(video => (
                <li 
                  key={video.id.videoId} 
                  style={{
                    backgroundColor: '#2d2d3d',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = ''}
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    <img
                      src={video.snippet.thumbnails.medium.url}
                      alt={video.snippet.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '16/9',
                        objectFit: 'cover'
                      }}
                    />
                    <span style={{
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      color: '#e2e2e2',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {video.snippet.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Button */}
        <div style={{
          marginTop: 'auto',
          paddingTop: '1rem'
        }}>
          <button
            onClick={onGenerateSubtree}
            disabled={loadingDetails || loadingVideos}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loadingDetails || loadingVideos ? '#4f46e580' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 500,
              cursor: loadingDetails || loadingVideos ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loadingDetails && !loadingVideos) {
                e.currentTarget.style.backgroundColor = '#4338ca';
              }
            }}
            onMouseOut={(e) => {
              if (!loadingDetails && !loadingVideos) {
                e.currentTarget.style.backgroundColor = '#4f46e5';
              }
            }}
          >
            Generate Detailed Roadmap
          </button>
        </div>
      </div>

      {/* Add the spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const SubtreeModal: React.FC<SubtreeModalProps> = ({ isOpen, onClose, subtreeData, loading, onSubtreeNodeClick }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detailed Roadmap: {subtreeData?.title}</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading-modal">
              <div className="spinner"></div>
              <p>Generating detailed roadmap...</p>
            </div>
          ) : (
            <div className="subtree-container">
              <ReactFlow
                nodes={subtreeData?.nodes || []}
                edges={subtreeData?.edges || []}
                onNodeClick={onSubtreeNodeClick}
                fitView
                fitViewOptions={{ padding: 0.1, minZoom: 0.8, maxZoom: 1.5 }}
                defaultZoom={1}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

async function fetchYouTubeVideos(query: string): Promise<YouTubeVideo[]> {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=4&q=${encodeURIComponent(query + " tutorial")}&key=${API_KEY}`
  );
  const data = await res.json();
  return data.items || [];
}

const Roadmap: React.FC<RoadmapProps> = () => {
  const [topic, setTopic] = useState<string>('Web Development');
  const [time, setTime] = useState<number>(2);
  const [unit, setUnit] = useState<string>('months');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [mainRoadmapText, setMainRoadmapText] = useState<string>('');

  // Side panel state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeDetails, setNodeDetails] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Modal state
  const [showSubtreeModal, setShowSubtreeModal] = useState<boolean>(false);
  const [subtreeData, setSubtreeData] = useState<{
    title: string;
    nodes: Node[];
    edges: Edge[];
    context?: string;
  } | null>(null);
  const [loadingSubtree, setLoadingSubtree] = useState<boolean>(false);
  
  // Nested subtree state
  const [showNestedSubtreeModal, setShowNestedSubtreeModal] = useState<boolean>(false);
  const [nestedSubtreeData, setNestedSubtreeData] = useState<{
    title: string;
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [loadingNestedSubtree, setLoadingNestedSubtree] = useState<boolean>(false);
  const [nestedSelectedNode, setNestedSelectedNode] = useState<Node | null>(null);
  const [nestedNodeDetails, setNestedNodeDetails] = useState<string>('');
  const [loadingNestedDetails, setLoadingNestedDetails] = useState<boolean>(false);

  const loadRoadmap = async () => {
    setLoading(true);
    setSelectedNode(null);
    const text = await fetchRoadmap(topic, time, unit);
    const cleaned = cleanRoadmapText(text);

    setMainRoadmapText(text);
    const { nodes: newNodes, edges: newEdges } = parseTreeToFlow(cleaned, null, 50, 50, 200, 'root');
    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  };

  const onNodeClick = useCallback<NodeMouseHandler>(async (_, node) => {
    setSelectedNode(node);
    setLoadingDetails(true);
    
    try {
      const details = await fetchNodeDetails(node.data.label, topic, mainRoadmapText);
      setNodeDetails(details);
    } catch (error) {
      setNodeDetails('Failed to load details for this topic.');
    }
    
    setLoadingDetails(false);
  }, [mainRoadmapText, topic]);

  const handleGenerateSubtree = async () => {
    if (!selectedNode) return;
    
    setLoadingSubtree(true);
    setShowSubtreeModal(true);
    
    try {
      const subtreeText = await fetchSubtree(selectedNode.data.label, topic, mainRoadmapText);
      const cleaned = cleanRoadmapText(subtreeText);
      const { nodes: subNodes, edges: subEdges } = parseTreeToFlow(cleaned, null, 50, 50, 180, 'subtree');
      
      setSubtreeData({
        title: selectedNode.data.label,
        nodes: subNodes,
        edges: subEdges,
        context: mainRoadmapText
      });
    } catch (error) {
      console.error('Error generating subtree:', error);
    }
    
    setLoadingSubtree(false);
  };

  const handleNestedSubtreeNodeClick = useCallback<NodeMouseHandler>(async (_, node) => {
    setNestedSelectedNode(node);
    setLoadingNestedDetails(true);
    
    try {
      const details = await fetchNodeDetails(node.data.label, topic, subtreeData?.context || mainRoadmapText);
      setNestedNodeDetails(details);
    } catch (error) {
      setNestedNodeDetails('Failed to load details for this topic.');
    }
    
    setLoadingNestedDetails(false);
  }, [subtreeData, mainRoadmapText, topic]);

  const handleGenerateNestedSubtree = async () => {
    if (!nestedSelectedNode) return;
    
    setLoadingNestedSubtree(true);
    setShowNestedSubtreeModal(true);
    
    try {
      const subtreeText = await fetchSubtree(nestedSelectedNode.data.label, topic, subtreeData?.context || mainRoadmapText);
      const cleaned = cleanRoadmapText(subtreeText);
      const { nodes: subNodes, edges: subEdges } = parseTreeToFlow(cleaned, null, 50, 50, 180, 'nested-subtree');
      
      setNestedSubtreeData({
        title: nestedSelectedNode.data.label,
        nodes: subNodes,
        edges: subEdges
      });
    } catch (error) {
      console.error('Error generating nested subtree:', error);
    }
    
    setLoadingNestedSubtree(false);
  };

  const closeSidePanel = () => {
    setSelectedNode(null);
    setNodeDetails('');
  };

  const closeSubtreeModal = () => {
    setShowSubtreeModal(false);
    setSubtreeData(null);
    setNestedSelectedNode(null);
    setNestedNodeDetails('');
  };

  const closeNestedSubtreeModal = () => {
    setShowNestedSubtreeModal(false);
    setNestedSubtreeData(null);
  };

  const closeNestedSidePanel = () => {
    setNestedSelectedNode(null);
    setNestedNodeDetails('');
  };
  const downloadPng = async () => {
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    try {
      const dataUrl = await toPng(flowElement as HTMLElement);
      const link = document.createElement('a');
      link.download = `${topic}-roadmap.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading PNG:', error);
    }
  };

  const downloadPdf = async () => {
    const flowElement = document.querySelector('.react-flow');
    if (!flowElement) return;

    try {
      const dataUrl = await toPng(flowElement as HTMLElement);
      const pdf = new jsPDF('landscape');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${topic}-roadmap.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Your Learning Roadmap</h1>
      </div>

      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <input 
          type="text" 
          value={topic} 
          onChange={(e) => setTopic(e.target.value)} 
          placeholder="Enter topic" 
          className="p-2 rounded bg-gray-800 text-white outline-none min-w-[200px]"
        />
        <input 
          type="number" 
          value={time} 
          onChange={(e) => setTime(Number(e.target.value))} 
          placeholder="Time" 
          className="p-2 rounded bg-gray-800 text-white outline-none w-20"
        />
        <select 
          value={unit} 
          onChange={(e) => setUnit(e.target.value)} 
          className="p-2 rounded bg-gray-800 text-white outline-none"
        >
          <option value="hours">hours</option>
          <option value="days">days</option>
          <option value="weeks">weeks</option>
          <option value="months">months</option>
        </select>
        <button 
          onClick={loadRoadmap} 
          className="p-2 bg-blue-600 rounded min-w-[100px] hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
        {nodes.length > 0 && (
          <>
            <button 
              onClick={downloadPng}
              className="p-2 bg-green-600 rounded min-w-[100px] hover:bg-green-700 transition-colors"
            >
              Download PNG
            </button>
            <button 
              onClick={downloadPdf}
              className="p-2 bg-red-600 rounded min-w-[100px] hover:bg-red-700 transition-colors"
            >
              Download PDF
            </button>
          </>
        )}
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
          />
        </div>
        
        <SidePanel
          selectedNode={selectedNode}
          onClose={closeSidePanel}
          onGenerateSubtree={handleGenerateSubtree}
          nodeDetails={nodeDetails}
          loadingDetails={loadingDetails}
        />
      </div>

      <SubtreeModal
        isOpen={showSubtreeModal}
        onClose={closeSubtreeModal}
        subtreeData={subtreeData}
        loading={loadingSubtree}
        onSubtreeNodeClick={handleNestedSubtreeNodeClick}
      />

      <SubtreeModal
        isOpen={showNestedSubtreeModal}
        onClose={closeNestedSubtreeModal}
        subtreeData={nestedSubtreeData}
        loading={loadingNestedSubtree}
        onSubtreeNodeClick={handleGenerateNestedSubtree}
      />
    </div>
  );
};

export default Roadmap;