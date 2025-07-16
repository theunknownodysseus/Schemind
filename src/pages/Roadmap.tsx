import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Loader, X, Youtube, FileText, LinkIcon, ArrowRight } from "lucide-react";
import Resources, { Resource } from "./Resources";
import { useNavigate } from "react-router-dom";
import NotificationPreferencesModal from '../components/auth/NotificationPreferencesModal';
import { useUser } from '../context/UserContext';

type RoadmapNode = {
  name: string;
  children: RoadmapNode[];
  isReference?: boolean;
  videoLink?: string;
  description?: string;
};

type SidePanelData = {
  name: string;
  videoLink?: string;
  description?: string;
} | null;

// Global resources state with a callback for updates
let globalResources: Resource[] = [];
const resourceUpdateCallbacks: ((resources: Resource[]) => void)[] = [];

function updateGlobalResources(newResources: Resource[]) {
  globalResources = [...new Map([...globalResources, ...newResources].map(r => [r.link, r])).values()];
  resourceUpdateCallbacks.forEach(callback => callback(globalResources));
}

// Export for use in other components
export function subscribeToResourceUpdates(callback: (resources: Resource[]) => void) {
  resourceUpdateCallbacks.push(callback);
  return () => {
    const index = resourceUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      resourceUpdateCallbacks.splice(index, 1);
    }
  };
}

export function getGlobalResources() {
  return globalResources;
}

// Add this type for resource navigation
export type ResourceNavigation = {
  resourceId: string;
  scrollToResource: boolean;
};

// Update RoadmapTreeProps
type RoadmapTreeProps = {
  node: RoadmapNode;
  onAddResources: (node: RoadmapNode) => Promise<void>;
  onGenerateSubRoadmap?: (node: RoadmapNode) => Promise<RoadmapNode | undefined>;
  depth?: number;
};

const RoadmapTree: React.FC<RoadmapTreeProps> = ({ node, onAddResources, onGenerateSubRoadmap, depth = 0 }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isGeneratingSubRoadmap, setIsGeneratingSubRoadmap] = useState(false);
  const [subRoadmap, setSubRoadmap] = useState<RoadmapNode | null>(null);
  const navigate = useNavigate();

  const handleNodeClick = async (node: RoadmapNode) => {
    setSelectedNode(node);
    setIsLoadingResources(true);
    await onAddResources(node);
    setIsLoadingResources(false);
  };

  const handleGenerateSubRoadmap = async () => {
    if (!selectedNode || !onGenerateSubRoadmap) return;
    
    setIsGeneratingSubRoadmap(true);
    try {
      const generatedRoadmap = await onGenerateSubRoadmap(selectedNode);
      if (generatedRoadmap) {
        setSubRoadmap(generatedRoadmap);
      }
    } catch (error) {
      console.error("Error generating sub-roadmap:", error);
    }
    setIsGeneratingSubRoadmap(false);
  };

  const navigateToResource = (resourceLink: string) => {
    const resourceId = btoa(resourceLink); // Create a unique ID from the link
    navigate('/resources', { state: { resourceId, scrollToResource: true } });
  };

  useEffect(() => {
    if (!svgRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    // Adjust margins and size based on depth
    const baseWidth = depth === 0 ? 1200 : 800;
    const baseHeight = depth === 0 ? 800 : 600;
    const margin = { 
      top: 40, 
      right: 120, 
      bottom: 40, 
      left: 120 
    };

    // Create the SVG container with adjusted size
    const svg = d3.select(svgRef.current)
      .attr("width", baseWidth)
      .attr("height", baseHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Creates a horizontal tree layout with improved spacing
    const treeLayout = d3.tree<RoadmapNode>()
      .size([
        baseHeight - margin.top - margin.bottom,
        baseWidth - margin.left - margin.right
      ])
      .separation((a, b) => {
        // Increase separation between nodes
        return a.parent === b.parent ? 2 : 3;
      });

    // Creates the root node and compute the tree layout
    const root = d3.hierarchy(node);
    const treeData = treeLayout(root);

    // Add links with dotted paths and improved curves
    svg.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94A3B8")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("d", (d) => {
        return `M${d.source.y},${d.source.x}
                C${(d.source.y + d.target.y) / 2},${d.source.x}
                 ${(d.source.y + d.target.y) / 2},${d.target.x}
                 ${d.target.y},${d.target.x}`;
      });

    // Add nodes with improved spacing
    const nodes = svg.selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Add node rectangles with modern design and proper spacing
    nodes.append("rect")
      .attr("x", -80)
      .attr("y", -25)
      .attr("width", 160)
      .attr("height", 50)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", d => {
        if (d.depth === 0) return "#FCD34D";
        if (d.depth === 1) return "#FBBF24";
        return "#F59E0B";
      })
      .attr("stroke", d => {
        if (d.depth === 0) return "#F59E0B";
        if (d.depth === 1) return "#D97706";
        return "#B45309";
      })
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        event.stopPropagation();
        handleNodeClick(d.data);
      })
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("filter", "brightness(1.1)");
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("filter", "none");
      });

    // Add node text with improved readability
    nodes.append("text")
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#1F2937")
      .style("font-size", d => d.depth === 0 ? "14px" : "12px")
      .style("font-weight", d => d.depth === 0 ? "600" : "500")
      .style("pointer-events", "none")
      .each(function(d) {
        const words = d.data.name.split(/\s+/);
        const text = d3.select(this);
        
        if (words.length > 2) {
          // Split into two lines if more than 2 words
          const firstLine = words.slice(0, 2).join(" ");
          const secondLine = words.slice(2).join(" ");
          
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", "-0.6em")
            .text(firstLine);
          
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", "1.2em")
            .text(secondLine);
        } else {
          text.text(d.data.name);
        }
      });

  }, [node, depth]);

  return (
    <div className="relative">
      <div className="w-full overflow-auto">
        <div className={`min-w-[${depth === 0 ? '1200px' : '800px'}] min-h-[${depth === 0 ? '800px' : '600px'}]`}>
          <svg ref={svgRef} className="w-full h-full"></svg>
        </div>
      </div>
      
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => {
                setSelectedNode(null);
                setSubRoadmap(null);
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white text-black rounded-lg shadow-xl w-full max-w-5xl max-h-[85vh] overflow-hidden">
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start p-6 border-b">
                    <h3 className="text-2xl font-bold">{selectedNode.name}</h3>
                    <button
                      onClick={() => {
                        setSelectedNode(null);
                        setSubRoadmap(null);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {selectedNode.description && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-700 mb-3">About this topic</h4>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        {selectedNode.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
                    <div className="flex flex-col">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Learning Resources</h4>
                      <div className="flex-1 overflow-auto">
                        {isLoadingResources ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader className="animate-spin mr-2" size={20} />
                            <span>Loading resources...</span>
                          </div>
                        ) : (
                          <>
                            {selectedNode.videoLink && (
                              <a
                                href={selectedNode.videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors w-full justify-center text-lg font-medium mb-4"
                              >
                                <Youtube size={24} />
                                Watch Tutorial
                              </a>
                            )}
                            <button
                              onClick={() => navigateToResource(selectedNode.videoLink || '')}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              View in Resources Page
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h4 className="text-lg font-semibold text-gray-700 mb-4">Detailed Roadmap</h4>
                      <div className="flex-1 overflow-hidden">
                        {isGeneratingSubRoadmap ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader className="animate-spin mr-2" size={20} />
                            <span>Generating detailed roadmap...</span>
                          </div>
                        ) : subRoadmap ? (
                          <div className="border border-gray-200 rounded-lg p-4 h-full overflow-auto">
                            <div className="transform-gpu">
                              <RoadmapTree 
                                node={subRoadmap} 
                                onAddResources={onAddResources}
                                onGenerateSubRoadmap={onGenerateSubRoadmap}
                                depth={depth + 1}
                              />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={handleGenerateSubRoadmap}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full justify-center text-lg font-medium"
                          >
                            Generate Detailed Roadmap
                            <ArrowRight size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const Roadmap: React.FC = () => {
  const [roadmapData, setRoadmapData] = useState<RoadmapNode | null>(() => {
    const saved = localStorage.getItem('roadmapData');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [timeUnit, setTimeUnit] = useState("hours");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [resources, setResources] = useState<Resource[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { user } = useUser();

  const timeUnits = ["minutes", "hours", "days", "months", "years"];

  // Cache for API responses
  const cache = useRef<Record<string, { description: string; videoLink: string }>>({});

  // Save roadmap data whenever it changes
  useEffect(() => {
    if (roadmapData) {
      localStorage.setItem('roadmapData', JSON.stringify(roadmapData));
    }
  }, [roadmapData]);

  // Subscribe to resource updates
  useEffect(() => {
    const unsubscribe = subscribeToResourceUpdates((resources) => {
      setResources(resources);
    });
    return () => unsubscribe();
  }, []);

  async function fetchRoadmap(topic: string, time: string, unit: string) {
    const apiKey = "3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb";
    const endpoint = "https://api.cohere.ai/v1/generate";

    const prompt = `
      Create a learning roadmap for "${topic}" (${time} ${unit}). Format as a tree with | for depth.
      Keep it simple and focused on core concepts.

      Example format:
      | Basics
      || Core Concept 1
      ||| Detail 1
      || Core Concept 2
      | Advanced
      || Topic 1

      Rules:
      - 2-4 main topics (level 1)
      - 1-2 subtopics each (level 2)
      - 1-1 details each (level 3)
      - Keep names short and clear
      - Focus on core concepts
      - Order by learning sequence

      Roadmap:
    `;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "command-r-plus",
          prompt,
          max_tokens: 300,
          temperature: 0.7,
          top_p: 1.0,
          stop_sequences: ["\n\n"],
          num_generations: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      const data = await response.json();
      const text = data?.generations?.[0]?.text?.trim() || "";
      
      if (!text || !text.includes("|")) {
        throw new Error('Invalid roadmap format received');
      }

      return text;
    } catch (error) {
      console.error("Error fetching roadmap:", error);
      throw error;
    }
  }

  function parseRoadmap(text: string, topic: string): RoadmapNode {
    try {
    const lines = text.trim().split("\n");
    const tree: RoadmapNode = { name: topic, children: [] };
    const nodeMap: Record<number, RoadmapNode> = { 0: tree };

    lines.forEach((line) => {
      const level = (line.match(/^\|+/)?.[0]?.length || 1);
        // Remove all | characters and trim whitespace
        const content = line.replace(/\|/g, "").trim();
        
        if (!content) return; // Skip empty lines
        
        const node: RoadmapNode = { name: content, children: [] };

      if (nodeMap[level - 1]) {
        nodeMap[level - 1].children.push(node);
      }
      nodeMap[level] = node;
      });

      return tree;
    } catch (error) {
      console.error("Error parsing roadmap:", error);
      throw new Error('Failed to parse roadmap structure');
    }
  }

  async function fetchYouTubeLink(topic: string): Promise<string> {
    const apiKey = "3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb";
    const endpoint = "https://api.cohere.ai/v1/generate";

    const prompt = `
      Find a relevant YouTube tutorial link for learning "${topic}".
      Format the response as a single line containing only the YouTube video ID.
      Example format: "dQw4w9WgXcQ"
      
      Guidelines:
      - Choose videos from reputable educational channels
      - Prefer comprehensive tutorials
      - Focus on beginner-friendly content
      - Select recent videos when possible
      
      Return only the video ID, nothing else.
    `;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "command-r-plus",
          prompt,
          max_tokens: 100,
          temperature: 0.7,
          top_p: 1.0,
          stop_sequences: ["\n"],
        }),
      });

      const data = await response.json();
      const videoId = data?.generations?.[0]?.text.trim() || "";
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
    } catch (error) {
      console.error("Error fetching YouTube link:", error);
      return "";
    }
  }

  async function fetchNodeDescription(topic: string): Promise<string> {
    const apiKey = "3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb";
    const endpoint = "https://api.cohere.ai/v1/generate";

    const prompt = `
      Write a brief explanation (2-3 sentences) about "${topic}" for a learning roadmap.
      Focus on why this topic is important and what the learner will gain from it.
      Keep it concise and beginner-friendly.
    `;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "command-r-plus",
          prompt,
          max_tokens: 100,
          temperature: 0.7,
          top_p: 1.0,
        }),
      });

      const data = await response.json();
      return data?.generations?.[0]?.text.trim() || "";
    } catch (error) {
      console.error("Error fetching description:", error);
      return "";
    }
  }

  async function batchFetchNodeData(topics: string[]): Promise<Record<string, { description: string; videoLink: string }>> {
    const apiKey = "3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb";
    const endpoint = "https://api.cohere.ai/v1/generate";

    // Simplified prompt for faster processing
    const prompt = `
      For each topic, provide a one-line description and YouTube video ID.
      Format: topic|||description|||videoId

      Topics:
      ${topics.join("\n")}

      Response format example:
      JavaScript|||Learn the basics of web programming|||dQw4w9WgXcQ
    `;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer 3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb`,
        },
        body: JSON.stringify({
          model: "command-r-plus",  // Using command model for faster response
          prompt,
          max_tokens: 300,
          temperature: 0.7,
          top_p: 1.0,
          num_generations: 1,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const results = data?.generations?.[0]?.text?.trim().split("\n") || [];
      
      const processedData: Record<string, { description: string; videoLink: string }> = {};
      
      results.forEach((result: string) => {
        const [topic, description, videoId] = result.split("|||").map(s => s?.trim());
        if (topic && description && videoId) {
          processedData[topic] = {
            description: description,
            videoLink: `https://www.youtube.com/watch?v=${videoId}`
          };
        }
      });

      return processedData;
    } catch (error) {
      console.error("Error in batch fetch:", error);
      return {};
    }
  }

  const fetchDocumentResources = async (topic: string) => {
    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb'
        },
        body: JSON.stringify({
          model: 'command-r-plus',
          prompt: `Generate a list of 3-5 high-quality learning resources for ${topic}. Include:
1. Official documentation
2. Free online courses
3. Video tutorials
4. Practice exercises
5. Community resources

Format each resource as:
Title: [Resource Name]
URL: [Valid URL]
Description: [Brief description]

Only include resources from reputable sources like:
- Official documentation sites
- GitHub repositories
- Educational platforms (Coursera, edX, Udemy)
- YouTube channels with verified creators
- Academic websites
- Professional blogs

Here are the resources for ${topic}:`,
          max_tokens: 500,
          temperature: 0.7,
        })
      });

      const data = await response.json();
      const resources = data.generations[0].text.trim();
      
      // Parse resources into structured format
      const resourceList = resources.split('\n\n').map((resource: string) => {
        const lines = resource.split('\n');
        const title = lines[0].replace('Title:', '').trim();
        const url = lines[1].replace('URL:', '').trim();
        const description = lines[2].replace('Description:', '').trim();
        
        // Validate URL
        let validUrl = url;
        try {
          new URL(url);
        } catch {
          // If URL is invalid, try to make it valid
          if (url.startsWith('www.')) {
            validUrl = 'https://' + url;
          } else if (!url.startsWith('http')) {
            validUrl = 'https://' + url;
          }
        }

        return {
          title,
          url: validUrl,
          description
        };
      });

      return resourceList;
    } catch (error) {
      console.error('Error fetching document resources:', error);
      return [];
    }
  };

  async function processNodesInBatches(nodes: RoadmapNode[], batchSize: number = 8): Promise<void> {
    const getAllNodes = (node: RoadmapNode): RoadmapNode[] => {
      let nodes = [node];
      if (node.children) {
        nodes = nodes.concat(...node.children.map(child => getAllNodes(child)));
      }
      return nodes;
    };

    const allNodes = getAllNodes(nodes[0]);
    const totalNodes = allNodes.length;
    const nodesToProcess = allNodes.filter(node => !cache.current[node.name]);

    try {
      for (let i = 0; i < nodesToProcess.length; i += batchSize) {
        const batch = nodesToProcess.slice(i, i + batchSize);
        const batchTopics = batch.map(node => node.name);
        
        // Fetch both video and document resources
        const [videoData, documentData] = await Promise.all([
          batchFetchNodeData(batchTopics),
          Promise.all(batchTopics.map(topic => fetchDocumentResources(topic)))
        ]);
        
        // Update cache with video data
        Object.assign(cache.current, videoData);
        
        // Update global resources
        const newResources: Resource[] = [];
        
        // Add video resources
        Object.entries(videoData).forEach(([topic, data]) => {
          if (data.description && data.videoLink) {
            newResources.push({
              type: 'Video',
              title: topic,
              description: data.description,
              icon: Youtube,
              link: data.videoLink
            });
          }
        });
        
        // Add document resources
        documentData.forEach((docs: Resource[], index: number) => {
          docs.forEach((doc: Resource) => {
            if (doc.title && doc.description && doc.url) {
              newResources.push({
                type: 'Document',
                title: doc.title,
                description: doc.description,
                icon: FileText,
                link: doc.url
              });
            }
          });
        });
        
        updateGlobalResources(newResources);
        setLoadingProgress(Math.round(((i + batch.length) / totalNodes) * 100));
      }
    } catch (error) {
      console.error("Error processing nodes:", error);
      throw error;
    }
  }

  async function addDataToNodes(node: RoadmapNode): Promise<RoadmapNode> {
    const nodeWithData = { ...node };
    if (cache.current[node.name]) {
      nodeWithData.description = cache.current[node.name].description;
      nodeWithData.videoLink = cache.current[node.name].videoLink;
    }
    
    if (node.children) {
      nodeWithData.children = await Promise.all(
        node.children.map(child => addDataToNodes(child))
      );
    }
    
    return nodeWithData;
  }

  async function handleGenerate() {
    if (!topic || !timeValue) {
      alert('Please enter both topic and time');
      return;
    }
    
    setLoading(true);
    setLoadingProgress(0);
    setResources([]); // Clear previous resources
    
    try {
      // Store the current topic in localStorage
      localStorage.setItem('currentTopic', topic);

      // Step 1: Generate initial roadmap
      setLoadingProgress(10);
    const roadmapText = await fetchRoadmap(topic, timeValue, timeUnit);
      
      if (!roadmapText) {
        throw new Error('Failed to generate roadmap');
      }

      // Step 2: Parse the roadmap
      setLoadingProgress(30);
      const initialRoadmap = parseRoadmap(roadmapText, topic);

      if (!initialRoadmap.children || initialRoadmap.children.length === 0) {
        throw new Error('Invalid roadmap structure');
      }

      // Step 3: Process nodes in batches
      await processNodesInBatches([initialRoadmap]);
      setLoadingProgress(80);

      // Step 4: Add the cached data to the nodes
      const roadmapWithData = await addDataToNodes(initialRoadmap);
      setLoadingProgress(100);
      
      setRoadmapData(roadmapWithData);

      // Show notification preferences modal if user is logged in and hasn't set preferences
      if (user && !user.notificationPreferences?.enabled) {
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error("Error generating roadmap:", error);
      alert(error instanceof Error ? error.message : 'Failed to generate roadmap. Please try again.');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
    }
  }

  async function downloadRoadmap() {
    const element = document.querySelector(".roadmap-container") as HTMLElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#1F2937", // Match the background color
        scale: 2, // Higher quality
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // Create download link
        const link = document.createElement("a");
      link.download = `${topic}-roadmap.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (error) {
      console.error("Error downloading roadmap:", error);
      alert("Failed to download roadmap. Please try again.");
    }
  }

  // Function to add resources for a specific node
  async function addNodeResources(node: RoadmapNode) {
    try {
      const [videoData, documentData] = await Promise.all([
        batchFetchNodeData([node.name]),
        fetchDocumentResources(node.name)
      ]);

      const newResources: Resource[] = [];

      if (videoData[node.name]?.videoLink) {
        newResources.push({
          type: 'Video',
          title: node.name,
          description: videoData[node.name].description,
          icon: Youtube,
          link: videoData[node.name].videoLink
        });
      }

      documentData.forEach((doc: Resource) => {
        if (doc.title && doc.description && doc.url) {
          newResources.push({
            type: 'Document',
            title: doc.title,
            description: doc.description,
            icon: FileText,
            link: doc.url
          });
        }
      });

      updateGlobalResources(newResources);
    } catch (error) {
      console.error("Error adding node resources:", error);
    }
  }

  async function generateSubRoadmap(node: RoadmapNode): Promise<RoadmapNode> {
    const apiKey = "3W85slWByAIgHZnnkaFDRfMgUbGEpDp6XAbJqMkb";
    const endpoint = "https://api.cohere.ai/v1/generate";

    const prompt = `
      Create a detailed learning roadmap for "${node.name}". Format as a tree with | for depth.
      Break down the topic into specific concepts and implementation details.

      Example format:
      | Fundamentals
      || Basic Concept 1
      ||| Key Point 1
      ||| Key Point 2
      || Basic Concept 2
      | Advanced Topics
      || Advanced Concept 1
      ||| Implementation Detail 1
      ||| Implementation Detail 2

      Rules:
      - Start with fundamentals
      - Include 2-3 main categories
      - Each category should have 2-3 key concepts
      - Each concept should have 2-3 specific points
      - Use clear, concise names
      - Focus on practical, actionable items
      - Order from basic to advanced
      - Keep it focused on "${node.name}" specifically

      Roadmap:
    `.trim();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "command-r-plus",
          prompt,
          max_tokens: 500,
          temperature: 0.8,
          top_p: 1.0,
          stop_sequences: ["\n\n"],
          num_generations: 1,
          truncate: "END"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API request failed');
      }

      const data = await response.json();
      const text = data?.generations?.[0]?.text?.trim() || "";
      
      if (!text) {
        throw new Error('No response received from the API');
      }

      if (!text.includes("|")) {
        throw new Error('Invalid roadmap format: Missing tree structure');
      }

      // Parse and validate the sub-roadmap
      const subRoadmap = parseRoadmap(text, node.name);
      
      if (!subRoadmap.children || subRoadmap.children.length === 0) {
        throw new Error('Generated roadmap has no valid content');
      }

      if (subRoadmap.children.length < 2) {
        throw new Error('Generated roadmap is too small');
      }

      // Process the nodes to add resources
      await processNodesInBatches([subRoadmap]);
      const roadmapWithData = await addDataToNodes(subRoadmap);
      
      return roadmapWithData;
    } catch (error) {
      console.error("Error generating sub-roadmap:", error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate detailed roadmap');
    }
  }

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Your Learning Roadmap</h1>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <input 
          type="text" 
          value={topic} 
          onChange={(e) => setTopic(e.target.value)} 
          placeholder="Enter topic" 
          className="p-2 rounded bg-gray-800 text-white outline-none min-w-[200px]"
        />
        <input 
          type="number" 
          value={timeValue} 
          onChange={(e) => setTimeValue(e.target.value)} 
          placeholder="Time" 
          className="p-2 rounded bg-gray-800 text-white outline-none w-20"
        />
        <select 
          value={timeUnit} 
          onChange={(e) => setTimeUnit(e.target.value)} 
          className="p-2 rounded bg-gray-800 text-white outline-none"
        >
          {timeUnits.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
        <button 
          onClick={handleGenerate} 
          className="p-2 bg-blue-600 rounded min-w-[100px] flex items-center justify-center hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader className="animate-spin" size={16} />
              <span>{loadingProgress}%</span>
            </div>
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {loading && (
        <div className="mt-10 flex flex-col items-center justify-center p-8">
          <Loader className="animate-spin mb-4" size={32} />
          <p className="text-lg">Generating your roadmap... {loadingProgress}%</p>
          <p className="text-sm text-gray-400 mt-2">This may take a few minutes</p>
        </div>
      )}

      {roadmapData && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Learning Roadmap</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  localStorage.removeItem('roadmapData');
                  setRoadmapData(null);
                  updateGlobalResources([]); // Clear resources when clearing roadmap
                }}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition-colors"
              >
                Clear Roadmap
              </button>
              <button 
                onClick={downloadRoadmap} 
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
          <div className="border border-gray-700 rounded-lg overflow-hidden roadmap-container">
            <RoadmapTree 
              node={roadmapData} 
              onAddResources={addNodeResources}
              onGenerateSubRoadmap={async (node) => {
                try {
                  const subRoadmap = await generateSubRoadmap(node);
                  return subRoadmap;
                } catch (error) {
                  console.error("Error in sub-roadmap generation:", error);
                  alert("Failed to generate detailed roadmap. Please try again.");
                }
              }}
            />
          </div>
      </div>
      )}

      <NotificationPreferencesModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        currentTopic={topic}
      />
    </div>
  );
};

export default Roadmap;
