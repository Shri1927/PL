import React, { useEffect, useState } from 'react';
import { workflowApi } from '../../workflowApi';

interface AuditTrailModalProps {
  loanId: number;
  onClose: () => void;
}

const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ loanId, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const response = await workflowApi.getAuditTrail(loanId);
        setLogs(response.data.data);
      } catch (error) {
        console.error('Error fetching audit trail', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [loanId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Immutable Audit Trail — Application #{loanId}</h2>
            <p className="text-sm text-gray-500 mt-1">Tamper-evident logs with SHA-256 hash chaining</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No logs found for this application.</div>
          ) : (
            <div className="space-y-6">
              {logs.map((log, index) => (
                <div key={log.id} className="relative pl-8 border-l-2 border-indigo-100 pb-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-sm" />
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{log.action}</span>
                      <h4 className="text-sm font-semibold text-gray-900 mt-1">
                        By Actor ID: {log.actorId} ({log.actorRole})
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-mono">
                        {log.currentHash.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-400 block mb-1">Previous Status</span>
                      <span className="font-medium text-gray-700">{log.previousStatus || 'N/A'}</span>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg">
                      <span className="text-indigo-400 block mb-1">New Status</span>
                      <span className="font-medium text-indigo-700">{log.newStatus}</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-900 text-[10px] p-2 rounded-lg font-mono text-gray-400 overflow-x-auto whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">PREV:</span>
                      <span>{log.previousHash}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-blue-500">CURR:</span>
                      <span>{log.currentHash}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition font-medium"
          >
            Close Trail
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;
