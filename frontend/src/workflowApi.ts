import api from './api';

export const workflowApi = {
  submitApplication: (data: any) => api.post('/maker-checker/loans', data),
  approveTask: (loanId: number, taskId: number) => 
    api.post(`/maker-checker/loans/${loanId}/approve?taskId=${taskId}`),
  rejectTask: (loanId: number, taskId: number, remarks: string) => 
    api.post(`/maker-checker/loans/${loanId}/reject?taskId=${taskId}`, { remarks }),
  returnTask: (loanId: number, taskId: number, remarks: string) => 
    api.post(`/maker-checker/loans/${loanId}/return?taskId=${taskId}`, { remarks }),
  resubmitApplication: (loanId: number) => 
    api.post(`/maker-checker/loans/${loanId}/resubmit`),
  getAuditTrail: (loanId: number) => api.get(`/maker-checker/loans/${loanId}/audit`),
  getMakerQueue: () => api.get('/maker-checker/dashboard/maker'),
  getCheckerQueue: () => api.get('/maker-checker/dashboard/checker'),
};
