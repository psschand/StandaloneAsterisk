import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Phone, GitBranch, MessageSquare, ArrowRight, Globe, Users, Hash, PhoneOutgoing, PhoneIncoming } from 'lucide-react';
import apiClient from '../lib/api';

interface FlowNode {
  id: string;
  type: 'did' | 'queue' | 'extension' | 'ivr' | 'webhook' | 'voicemail' | 'external' | 'trunk' | 'outbound_rule';
  label: string;
  data: any;
  connections: string[];
  metadata?: any;
}

interface DID {
  id: number;
  number: string;
  friendly_name?: string | null;
  route_type: 'queue' | 'endpoint' | 'ivr' | 'webhook' | 'external' | 'voicemail' | '';
  route_target?: string | null;
}

interface Queue {
  id: number;
  name: string;
  display_name?: string;
  strategy: string;
  members?: Array<{ user_id: number; extension?: string }>;
}

interface IVRMenu {
  id: number;
  name: string;
  display_name: string;
  options: Array<{
    digit: string;
    action_type: string;
    action_target: string;
    description?: string;
  }>;
}

interface Extension {
  id: string;
  display_name?: string;
}



export default function DialplanVisualizer() {
  const queryClient = useQueryClient();
  const [flowMode, setFlowMode] = useState<'inbound' | 'outbound'>('inbound');
  const [inboundFlows, setInboundFlows] = useState<Map<string, FlowNode[]>>(new Map());
  const [outboundFlows, setOutboundFlows] = useState<FlowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedDID, setSelectedDID] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<FlowNode | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const { data: didsData, refetch: refetchDIDs } = useQuery({
    queryKey: ['dids'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/dids');
      return response.data;
    },
  });

  const { data: queuesData, refetch: refetchQueues } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/queues');
      return response.data;
    },
  });

  const { data: ivrsData, refetch: refetchIVRs } = useQuery({
    queryKey: ['ivr-menus'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/ivr-menus');
      return response.data;
    },
  });

  const { data: extensionsData, refetch: refetchExtensions } = useQuery({
    queryKey: ['extensions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/extensions');
      return response.data;
    },
  });

  const { data: trunksData } = useQuery({
    queryKey: ['trunks'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/trunks');
      return response.data;
    },
  });

  const { data: outboundRoutesData } = useQuery({
    queryKey: ['outbound-routes'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/v1/outbound-routes');
        console.log('Outbound routes response:', response.data);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch outbound routes:', error);
        throw error;
      }
    },
  });

  // Mutations for editing
  const updateDIDMutation = useMutation({
    mutationFn: async (data: { id: number; route_type: string; route_target: string }) => {
      const response = await apiClient.put(`/api/v1/dids/${data.id}`, {
        route_type: data.route_type,
        route_target: data.route_target,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dids'] });
      setEditingNode(null);
    },
  });

  const updateQueueMutation = useMutation({
    mutationFn: async (data: { id: number; strategy?: string; max_wait_time?: number }) => {
      const response = await apiClient.put(`/api/v1/queues/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      setEditingNode(null);
    },
  });

  const updateIVRMutation = useMutation({
    mutationFn: async (data: { id: number; timeout?: number; timeout_destination?: string }) => {
      const response = await apiClient.put(`/api/v1/ivr-menus/${data.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ivr-menus'] });
      setEditingNode(null);
    },
  });

  useEffect(() => {
    if (didsData && queuesData && ivrsData) {
      generateInboundFlows();
    }
    if (outboundRoutesData && trunksData && extensionsData) {
      generateOutboundFlows();
    }
  }, [didsData, queuesData, ivrsData, outboundRoutesData, trunksData, extensionsData]);

  const generateInboundFlows = () => {
    const dids = didsData?.data || [];
    const queues = queuesData?.data || [];
    const ivrs = ivrsData?.data || [];
    const extensions = extensionsData?.data || [];
    const flowsMap = new Map<string, FlowNode[]>();

    // Generate a flow for each DID
    dids.forEach((did: DID) => {
      const flow: FlowNode[] = [];
      
      // Step 1: Incoming DID
      const didNode: FlowNode = {
        id: `did-${did.id}`,
        type: 'did',
        label: did.number,
        data: did,
        connections: [],
        metadata: { friendly_name: did.friendly_name }
      };
      flow.push(didNode);

      // Step 2: Route destination
      const target = did.route_target || '';
      
      if (did.route_type === 'ivr' && target) {
        const ivr = ivrs.find((i: IVRMenu) => i.name === target);
        if (ivr) {
          const ivrNode: FlowNode = {
            id: `ivr-${ivr.name}`,
            type: 'ivr',
            label: ivr.display_name || ivr.name,
            data: ivr,
            connections: [],
            metadata: { options: ivr.options }
          };
          didNode.connections.push(ivrNode.id);
          flow.push(ivrNode);

          // Step 3: IVR options lead to queues/extensions
          ivr.options?.forEach((opt: any) => {
            if (opt.action_type === 'queue') {
              const queue = queues.find((q: Queue) => q.name === opt.action_target);
              if (queue && !flow.find(n => n.id === `queue-${queue.name}`)) {
                const queueNode: FlowNode = {
                  id: `queue-${queue.name}`,
                  type: 'queue',
                  label: queue.display_name || queue.name,
                  data: queue,
                  connections: [],
                  metadata: { strategy: queue.strategy, members: queue.members }
                };
                ivrNode.connections.push(queueNode.id);
                flow.push(queueNode);

                // Step 4: Queue members (extensions)
                queue.members?.forEach((member: any) => {
                  const ext = extensions.find((e: Extension) => e.id === member.extension?.toString());
                  if (ext && !flow.find(n => n.id === `ext-${ext.id}`)) {
                    const extNode: FlowNode = {
                      id: `ext-${ext.id}`,
                      type: 'extension',
                      label: ext.display_name || ext.id,
                      data: ext,
                      connections: [],
                      metadata: { extension: ext.id }
                    };
                    queueNode.connections.push(extNode.id);
                    flow.push(extNode);
                  }
                });
              }
            } else if (opt.action_type === 'extension') {
              const ext = extensions.find((e: Extension) => e.id === opt.action_target);
              if (ext && !flow.find(n => n.id === `ext-${ext.id}`)) {
                const extNode: FlowNode = {
                  id: `ext-${ext.id}`,
                  type: 'extension',
                  label: ext.display_name || ext.id,
                  data: ext,
                  connections: [],
                  metadata: { extension: ext.id }
                };
                ivrNode.connections.push(extNode.id);
                flow.push(extNode);
              }
            }
          });
        }
      } else if (did.route_type === 'queue' && target) {
        const queue = queues.find((q: Queue) => q.name === target);
        if (queue) {
          const queueNode: FlowNode = {
            id: `queue-${queue.name}`,
            type: 'queue',
            label: queue.display_name || queue.name,
            data: queue,
            connections: [],
            metadata: { strategy: queue.strategy, members: queue.members || [] }
          };
          didNode.connections.push(queueNode.id);
          flow.push(queueNode);

          // Queue members - if members exist, show them; otherwise show first 2 extensions
          const queueMembers = queue.members || [];
          if (queueMembers.length > 0) {
            queueMembers.forEach((member: any) => {
              const ext = extensions.find((e: Extension) => e.id === member.extension?.toString());
              if (ext && !flow.find(n => n.id === `ext-${ext.id}`)) {
                const extNode: FlowNode = {
                  id: `ext-${ext.id}`,
                  type: 'extension',
                  label: ext.display_name || ext.id,
                  data: ext,
                  connections: [],
                  metadata: { extension: ext.id }
                };
                queueNode.connections.push(extNode.id);
                flow.push(extNode);
              }
            });
          } else {
            // Show sample extensions for visualization
            extensions.slice(0, 2).forEach((ext: Extension) => {
              if (!flow.find(n => n.id === `ext-${ext.id}`)) {
                const extNode: FlowNode = {
                  id: `ext-${ext.id}`,
                  type: 'extension',
                  label: ext.display_name || ext.id,
                  data: ext,
                  connections: [],
                  metadata: { extension: ext.id }
                };
                queueNode.connections.push(extNode.id);
                flow.push(extNode);
              }
            });
          }
        }
      } else if (did.route_type === 'endpoint' && target) {
        const ext = extensions.find((e: Extension) => e.id === target);
        if (ext) {
          const extNode: FlowNode = {
            id: `ext-${ext.id}`,
            type: 'extension',
            label: ext.display_name || ext.id,
            data: ext,
            connections: [],
            metadata: { extension: ext.id }
          };
          didNode.connections.push(extNode.id);
          flow.push(extNode);
        }
      }

      flowsMap.set(`did-${did.id}`, flow);
    });

    setInboundFlows(flowsMap);
    if (flowsMap.size > 0) {
      setSelectedDID(Array.from(flowsMap.keys())[0]);
    }
  };

  const generateOutboundFlows = () => {
    const trunks = trunksData?.data || [];
    const routes = outboundRoutesData?.data || [];
    const flows: FlowNode[] = [];

    console.log('Generating outbound flows, routes:', routes);

    // Use real outbound routes from database
    if (routes.length === 0) {
      // No routes configured
      setOutboundFlows(flows);
      return;
    }

    // Sort routes by priority and create a simple flow for each
    const enabledRoutes = routes
      .filter((r: any) => r.enabled)
      .sort((a: any, b: any) => a.priority - b.priority);

    enabledRoutes.forEach((route: any) => {
      // Rule node
      const ruleNode: FlowNode = {
        id: `rule-${route.id}`,
        type: 'outbound_rule',
        label: route.name,
        data: route,
        connections: [],
        metadata: { 
          pattern: route.pattern, 
          description: route.description,
          priority: route.priority
        }
      };
      flows.push(ruleNode);

      // Find the trunk
      const trunk = trunks.find((t: any) => t.id === route.trunk_id);
      if (trunk) {
        const trunkId = `trunk-${trunk.id}-${route.id}`;
        const trunkNode: FlowNode = {
          id: trunkId,
          type: 'trunk',
          label: trunk.name || trunk.id,
          data: trunk,
          connections: [`external-${route.id}`],
          metadata: { host: trunk.host }
        };
        flows.push(trunkNode);
        ruleNode.connections.push(trunkId);

        // External PSTN node
        const externalNode: FlowNode = {
          id: `external-${route.id}`,
          type: 'external',
          label: 'PSTN',
          data: {},
          connections: [],
          metadata: {}
        };
        flows.push(externalNode);
      }
    });

    console.log('Generated outbound flows:', flows);
    setOutboundFlows(flows);
  };

  const handleRefresh = () => {
    refetchDIDs();
    refetchQueues();
    refetchIVRs();
    refetchExtensions();
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'did':
        return 'bg-blue-50 border-blue-400 text-blue-900';
      case 'queue':
        return 'bg-green-50 border-green-400 text-green-900';
      case 'ivr':
        return 'bg-purple-50 border-purple-400 text-purple-900';
      case 'extension':
        return 'bg-yellow-50 border-yellow-400 text-yellow-900';
      case 'trunk':
        return 'bg-orange-50 border-orange-400 text-orange-900';
      case 'outbound_rule':
        return 'bg-pink-50 border-pink-400 text-pink-900';
      case 'external':
        return 'bg-gray-50 border-gray-400 text-gray-900';
      default:
        return 'bg-gray-50 border-gray-300 text-gray-900';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'did':
        return <PhoneIncoming className="w-5 h-5" />;
      case 'queue':
        return <Users className="w-5 h-5" />;
      case 'ivr':
        return <MessageSquare className="w-5 h-5" />;
      case 'extension':
        return <Hash className="w-5 h-5" />;
      case 'trunk':
        return <GitBranch className="w-5 h-5" />;
      case 'outbound_rule':
        return <PhoneOutgoing className="w-5 h-5" />;
      case 'external':
        return <Globe className="w-5 h-5" />;
      default:
        return <Phone className="w-5 h-5" />;
    }
  };

  const handleNodeEdit = (node: FlowNode) => {
    console.log('Editing node:', node);
    setEditingNode(node);
    setEditFormData(node.data);
  };

  const renderFlowNode = (node: FlowNode, isLast: boolean = false) => (
    <div key={node.id} className="flex items-center">
      <div
        className={`border-2 rounded-lg p-3 min-w-[180px] cursor-pointer transition-all hover:shadow-lg group relative ${
          selectedNode === node.id ? 'ring-2 ring-blue-500 shadow-lg scale-105' : ''
        } ${getNodeColor(node.type)}`}
        onClick={() => setSelectedNode(node.id)}
        onDoubleClick={() => {
          console.log('Double-clicked node:', node.type, node.id);
          if (['did', 'queue', 'ivr'].includes(node.type)) {
            handleNodeEdit(node);
          }
        }}
      >
        {['did', 'queue', 'ivr'].includes(node.type) && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
              Double-click to edit
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-1">
          {getNodeIcon(node.type)}
          <span className="font-semibold text-sm">{node.label}</span>
        </div>
        <div className="text-xs opacity-75 capitalize">{node.type.replace('_', ' ')}</div>
        {node.metadata && (
          <div className="text-xs mt-2 space-y-1">
            {node.metadata.friendly_name && (
              <div className="truncate">📋 {node.metadata.friendly_name}</div>
            )}
            {node.metadata.strategy && (
              <div>⚡ {node.metadata.strategy}</div>
            )}
            {node.metadata.pattern && (
              <div className="truncate font-mono">🔍 {node.metadata.pattern}</div>
            )}
            {node.metadata.options && (
              <div>🔢 {node.metadata.options.length} options</div>
            )}
            {node.metadata.members && (
              <div>👥 {node.metadata.members.length} agents</div>
            )}
          </div>
        )}
      </div>
      {!isLast && node.connections.length > 0 && (
        <ArrowRight className="w-8 h-8 text-gray-400 mx-2 flex-shrink-0" />
      )}
    </div>
  );

  const currentFlow = flowMode === 'inbound' 
    ? (selectedDID ? inboundFlows.get(selectedDID) || [] : [])
    : outboundFlows;

  const totalInboundFlows = inboundFlows.size;
  const totalOutboundRules = outboundFlows.filter(n => n.type === 'outbound_rule').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dialplan Visualizer</h1>
          <p className="text-gray-600 mt-1">End-to-end call routing flows for inbound and outbound calls</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="btn bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <PhoneIncoming className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inbound Routes</p>
              <p className="text-2xl font-bold text-gray-900">{totalInboundFlows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <PhoneOutgoing className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outbound Rules</p>
              <p className="text-2xl font-bold text-gray-900">{totalOutboundRules}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">IVR Menus</p>
              <p className="text-2xl font-bold text-gray-900">{ivrsData?.data?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Call Queues</p>
              <p className="text-2xl font-bold text-gray-900">{queuesData?.data?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFlowMode('inbound')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              flowMode === 'inbound'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PhoneIncoming className="w-5 h-5 inline mr-2" />
            Inbound Call Flows
          </button>
          <button
            onClick={() => setFlowMode('outbound')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              flowMode === 'outbound'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PhoneOutgoing className="w-5 h-5 inline mr-2" />
            Outbound Call Routing
          </button>
        </div>
      </div>

      {/* Inbound DID Selector */}
      {flowMode === 'inbound' && inboundFlows.size > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Inbound DID to visualize:
          </label>
          <select
            value={selectedDID || ''}
            onChange={(e) => setSelectedDID(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {Array.from(inboundFlows.entries()).map(([key, flow]) => {
              const didNode = flow[0];
              return (
                <option key={key} value={key}>
                  {didNode.label} - {didNode.metadata?.friendly_name || 'No description'}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Flow Visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          {flowMode === 'inbound' ? (
            <>
              <PhoneIncoming className="w-6 h-6 text-blue-600" />
              Inbound Call Flow - End to End
            </>
          ) : (
            <>
              <PhoneOutgoing className="w-6 h-6 text-orange-600" />
              Outbound Call Routing by Country
            </>
          )}
        </h3>
        
        {flowMode === 'inbound' && (
          <p className="text-sm text-gray-600 mb-4">
            Shows how incoming calls flow from DID → IVR/Queue → Extensions
          </p>
        )}
        {flowMode === 'outbound' && (
          <p className="text-sm text-gray-600 mb-4">
            Shows how outbound calls route from Extension → Dial Rules → SIP Trunk → PSTN
          </p>
        )}

        <div className="overflow-x-auto pb-4">
          {currentFlow.length > 0 ? (
            <div className="space-y-6">
              {flowMode === 'inbound' ? (
                <div className="flex items-center flex-wrap gap-2">
                  {currentFlow.map((node, idx) => renderFlowNode(node, idx === currentFlow.length - 1))}
                </div>
              ) : (
                // Outbound: Show each route as a separate flow
                (() => {
                  const ruleNodes = currentFlow.filter(n => n.type === 'outbound_rule');
                  return ruleNodes.map((ruleNode) => {
                    const flowNodes = [ruleNode];
                    
                    // Find connected trunk
                    const trunkId = ruleNode.connections[0];
                    const trunkNode = currentFlow.find(n => n.id === trunkId);
                    if (trunkNode) {
                      flowNodes.push(trunkNode);
                      
                      // Find external
                      const externalId = trunkNode.connections[0];
                      const externalNode = currentFlow.find(n => n.id === externalId);
                      if (externalNode) {
                        flowNodes.push(externalNode);
                      }
                    }
                    
                    return (
                      <div key={ruleNode.id} className="flex items-center flex-wrap gap-2 pb-4 border-b border-gray-200 last:border-b-0">
                        {flowNodes.map((node, idx) => renderFlowNode(node, idx === flowNodes.length - 1))}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No routing configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                {flowMode === 'inbound' 
                  ? 'Configure DIDs, IVRs, and queues to see inbound call flows.'
                  : 'Configure SIP trunks and outbound rules to see outbound routing.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-400"></div>
            <span className="text-sm text-gray-600">Inbound DID</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-400"></div>
            <span className="text-sm text-gray-600">IVR Menu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-400"></div>
            <span className="text-sm text-gray-600">Call Queue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            <span className="text-sm text-gray-600">Extension</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-400"></div>
            <span className="text-sm text-gray-600">SIP Trunk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pink-400"></div>
            <span className="text-sm text-gray-600">Outbound Rule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400"></div>
            <span className="text-sm text-gray-600">External/PSTN</span>
          </div>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Details</h3>
          {(() => {
            const node = currentFlow.find(n => n.id === selectedNode);
            if (!node) return null;

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Type:</span>
                    <span className="ml-2 text-sm text-gray-900 capitalize">{node.type.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Label:</span>
                    <span className="ml-2 text-sm text-gray-900">{node.label}</span>
                  </div>
                </div>
                {node.metadata && Object.keys(node.metadata).length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 block mb-2">Metadata:</span>
                    <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                      {Object.entries(node.metadata).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span>{' '}
                          <span className="text-gray-700">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-600">Connections:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {node.connections.length === 0 ? 'Terminal node' : `Connects to ${node.connections.length} node(s)`}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Edit Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit {editingNode.type.charAt(0).toUpperCase() + editingNode.type.slice(1)} - {editingNode.label}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* DID Editing */}
              {editingNode.type === 'did' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Route Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editFormData.route_type || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, route_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="queue">Queue</option>
                      <option value="endpoint">Extension</option>
                      <option value="ivr">IVR Menu</option>
                      <option value="webhook">Webhook</option>
                      <option value="external">External Number</option>
                      <option value="voicemail">Voicemail</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Route Target <span className="text-red-500">*</span>
                    </label>
                    {editFormData.route_type === 'queue' && (
                      <select
                        value={editFormData.route_target || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, route_target: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select queue</option>
                        {queuesData?.data?.map((q: any) => (
                          <option key={q.id} value={q.name}>{q.display_name || q.name}</option>
                        ))}
                      </select>
                    )}
                    {editFormData.route_type === 'ivr' && (
                      <select
                        value={editFormData.route_target || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, route_target: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select IVR</option>
                        {ivrsData?.data?.map((ivr: any) => (
                          <option key={ivr.id} value={ivr.name}>{ivr.display_name || ivr.name}</option>
                        ))}
                      </select>
                    )}
                    {editFormData.route_type === 'endpoint' && (
                      <input
                        type="text"
                        value={editFormData.route_target || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, route_target: e.target.value })}
                        placeholder="Extension number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    {!['queue', 'ivr', 'endpoint'].includes(editFormData.route_type) && (
                      <input
                        type="text"
                        value={editFormData.route_target || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, route_target: e.target.value })}
                        placeholder="Target value"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Queue Editing */}
              {editingNode.type === 'queue' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ring Strategy
                    </label>
                    <select
                      value={editFormData.strategy || 'ringall'}
                      onChange={(e) => setEditFormData({ ...editFormData, strategy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ringall">Ring All</option>
                      <option value="leastrecent">Least Recent</option>
                      <option value="fewestcalls">Fewest Calls</option>
                      <option value="random">Random</option>
                      <option value="rrmemory">Round Robin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Wait Time (seconds)
                    </label>
                    <input
                      type="number"
                      value={editFormData.max_wait_time || 300}
                      onChange={(e) => setEditFormData({ ...editFormData, max_wait_time: parseInt(e.target.value) })}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* IVR Editing */}
              {editingNode.type === 'ivr' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout (seconds)
                    </label>
                    <input
                      type="number"
                      value={editFormData.timeout || 10}
                      onChange={(e) => setEditFormData({ ...editFormData, timeout: parseInt(e.target.value) })}
                      min="1"
                      max="60"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout Destination
                    </label>
                    <input
                      type="text"
                      value={editFormData.timeout_destination || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, timeout_destination: e.target.value })}
                      placeholder="e.g., queue:support"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: type:target (e.g., queue:support, extension:1001)
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <button
                onClick={() => setEditingNode(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editingNode.type === 'did') {
                    updateDIDMutation.mutate({
                      id: editFormData.id,
                      route_type: editFormData.route_type,
                      route_target: editFormData.route_target,
                    });
                  } else if (editingNode.type === 'queue') {
                    updateQueueMutation.mutate({
                      id: editFormData.id,
                      strategy: editFormData.strategy,
                      max_wait_time: editFormData.max_wait_time,
                    });
                  } else if (editingNode.type === 'ivr') {
                    updateIVRMutation.mutate({
                      id: editFormData.id,
                      timeout: editFormData.timeout,
                      timeout_destination: editFormData.timeout_destination,
                    });
                  }
                }}
                disabled={updateDIDMutation.isPending || updateQueueMutation.isPending || updateIVRMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {(updateDIDMutation.isPending || updateQueueMutation.isPending || updateIVRMutation.isPending) 
                  ? 'Saving...' 
                  : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
