import React, { useEffect, useState } from 'react';
import { workflowApi } from '../../workflowApi';

const CheckerDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await workflowApi.getCheckerQueue();
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error fetching checker queue', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (taskId: number, loanId: number, action: 'approve' | 'reject' | 'return') => {
    try {
      if (action === 'approve') {
        await workflowApi.approveTask(loanId, taskId);
      } else if (action === 'reject') {
        await workflowApi.rejectTask(loanId, taskId, remarks);
      } else {
        await workflowApi.returnTask(loanId, taskId, remarks);
      }
      setRemarks('');
      setActioning(null);
      fetchTasks();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checker Queue</h1>

      {tasks.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">No pending tasks found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Task #{task.id} — Application #{task.applicationId}</h3>
                  <p className="text-sm text-gray-500 mt-1">Tier: <span className="font-semibold">{task.tier}</span> | Role: <span className="font-semibold">{task.assignedRole}</span></p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">PENDING</span>
              </div>

              {actioning === task.id ? (
                <div className="mt-4 space-y-4">
                  <textarea
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="Enter remarks (min 20 characters for reject/return)..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={3}
                  />
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleAction(task.id, task.applicationId, 'approve')}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Confirm Approval
                    </button>
                    <button 
                      onClick={() => handleAction(task.id, task.applicationId, 'reject')}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(task.id, task.applicationId, 'return')}
                      className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium"
                    >
                      Return to Maker
                    </button>
                    <button 
                      onClick={() => { setActioning(null); setRemarks(''); }}
                      className="px-6 py-2 text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setActioning(task.id)}
                  className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Take Action
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckerDashboard;
