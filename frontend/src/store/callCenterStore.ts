import { create } from 'zustand';
import type { Call, Agent, DashboardStats } from '../types';

interface CallCenterState {
  activeCalls: Call[];
  agents: Agent[];
  stats: DashboardStats | null;
  
  setActiveCalls: (calls: Call[]) => void;
  addCall: (call: Call) => void;
  updateCall: (callId: string, updates: Partial<Call>) => void;
  removeCall: (callId: string) => void;
  
  setAgents: (agents: Agent[]) => void;
  updateAgent: (agentId: number, updates: Partial<Agent>) => void;
  
  setStats: (stats: DashboardStats) => void;
}

export const useCallCenterStore = create<CallCenterState>((set) => ({
  activeCalls: [],
  agents: [],
  stats: null,

  setActiveCalls: (calls) => set({ activeCalls: calls }),
  
  addCall: (call) => set((state) => ({ 
    activeCalls: [...state.activeCalls, call] 
  })),
  
  updateCall: (callId, updates) => set((state) => ({
    activeCalls: state.activeCalls.map(call =>
      call.id === callId ? { ...call, ...updates } : call
    )
  })),
  
  removeCall: (callId) => set((state) => ({
    activeCalls: state.activeCalls.filter(call => call.id !== callId)
  })),
  
  setAgents: (agents) => set({ agents }),
  
  updateAgent: (agentId, updates) => set((state) => ({
    agents: state.agents.map(agent =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    )
  })),
  
  setStats: (stats) => set({ stats }),
}));
