import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

export type StageStatus = 'locked' | 'pending' | 'approved' | 'rejected';

export interface WorkflowStage {
  id: number;
  name: string;
  status: StageStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  makerComment?: string;
}

interface WorkflowContextType {
  stages: WorkflowStage[];
  loading: boolean;
  error: string | null;
  fetchStages: (applicationId: string) => Promise<void>;
  approveStage: (applicationId: string, stageId: number, comment?: string) => Promise<void>;
  rejectStage: (applicationId: string, stageId: number, reason: string, comment?: string) => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const INITIAL_STAGES: WorkflowStage[] = [
  { id: 1, name: 'Application Initiated', status: 'pending' },
  { id: 2, name: 'Document Verification', status: 'locked' },
  { id: 3, name: 'Credit Assessment', status: 'locked' },
  { id: 4, name: 'Risk Evaluation', status: 'locked' },
  { id: 5, name: 'Sanctioning', status: 'locked' },
  { id: 6, name: 'Disbursement', status: 'locked' },
];

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stages, setStages] = useState<WorkflowStage[]>(INITIAL_STAGES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStages = useCallback(async (applicationId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/workflow/applications/${applicationId}`);
      const appData = response.data.data;
      
      // Map backend data to our 6 stages
      // Assuming appData.allowedStage is the current stage ID (1-6)
      // and we might need additional fields from backend for approvedBy, etc.
      const allowedStage = appData.allowedStage || 1;
      
      const updatedStages = INITIAL_STAGES.map(stage => {
        let status: StageStatus = 'locked';
        if (stage.id < allowedStage) status = 'approved';
        else if (stage.id === allowedStage) status = 'pending';
        
        // In a real app, we'd fetch specific approval data per stage from a history endpoint
        return { ...stage, status };
      });
      
      setStages(updatedStages);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch workflow stages');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveStage = async (applicationId: string, stageId: number, comment?: string) => {
    setLoading(true);
    try {
      const nextStage = stageId + 1;
      await api.post(`/maker-checker/loans/${applicationId}/update-permission?allowedStage=${nextStage}`);
      
      // Update local state
      setStages(prev => prev.map(stage => {
        if (stage.id === stageId) return { ...stage, status: 'approved', makerComment: comment, approvedAt: new Date().toISOString() };
        if (stage.id === nextStage) return { ...stage, status: 'pending' };
        return stage;
      }));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve stage');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectStage = async (applicationId: string, stageId: number, reason: string, comment?: string) => {
    setLoading(true);
    try {
      // Assuming a reject endpoint exists or using update-permission with a specific status
      // For now, let's simulate with a business logic error or a specific endpoint if it exists
      // await api.post(`/maker-checker/loans/${applicationId}/reject`, { stageId, reason, comment });
      
      setStages(prev => prev.map(stage => {
        if (stage.id === stageId) return { ...stage, status: 'rejected', rejectionReason: reason, makerComment: comment };
        return stage;
      }));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject stage');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkflowContext.Provider value={{ stages, loading, error, fetchStages, approveStage, rejectStage }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error('useWorkflow must be used within WorkflowProvider');
  return context;
};
