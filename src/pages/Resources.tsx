import React, { useState, useEffect, useRef } from 'react';
import { Youtube, FileText } from 'lucide-react';
import { subscribeToResourceUpdates, getGlobalResources, ResourceNavigation } from './Roadmap';
import { useLocation } from 'react-router-dom';

export type Resource = {
  type: 'Video' | 'Document';
  title: string;
  description: string;
  icon: any;
  link: string;
};

const Resources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>(getGlobalResources());
  const location = useLocation();
  const resourceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Subscribe to resource updates
    const unsubscribe = subscribeToResourceUpdates((updatedResources) => {
      setResources(updatedResources);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Handle navigation to specific resource
    const state = location.state as ResourceNavigation;
    if (state?.resourceId && state?.scrollToResource) {
      const resourceElement = resourceRefs.current[state.resourceId];
      if (resourceElement) {
        resourceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        resourceElement.classList.add('highlight-resource');
        setTimeout(() => {
          resourceElement.classList.remove('highlight-resource');
        }, 2000);
      }
    }
  }, [location.state, resources]);

  if (resources.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Learning Resources</h1>
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400">
              No resources available yet. Click on nodes in the roadmap to add resources.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Learning Resources</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <div
              key={`${resource.link}-${index}`}
              ref={el => resourceRefs.current[btoa(resource.link)] = el}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  resource.type === 'Video' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                }`}>
                  {resource.type === 'Video' ? <Youtube size={24} /> : <FileText size={24} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{resource.description}</p>
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 text-sm font-medium ${
                      resource.type === 'Video' ? 'text-red-400 hover:text-red-300' : 'text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    {resource.type === 'Video' ? 'Watch Video' : 'View Document'}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Resources;