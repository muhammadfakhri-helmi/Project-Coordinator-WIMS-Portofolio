// Fictional report register used by the Report Dictionary demonstration.
// No real file names, wells, platforms or dates.

export const REPORTS = [
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-B #28.xlsx', well: 'WELL-B28', platform: 'Platform B', status: 'Non active', date: '2026-03-18', scope: 'Active 2026', source: 'Local', anomalies: 6, highest: 'High' },
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-Y #11.xlsx', well: 'WELL-Y11', platform: 'Platform Y', status: 'Non active', date: '2026-03-16', scope: 'Active 2026', source: 'Local', anomalies: 3, highest: 'Medium' },
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-A #07.xlsx', well: 'WELL-A07', platform: 'Platform A', status: 'Active', date: '2026-02-11', scope: 'Active 2026', source: 'Local', anomalies: 4, highest: 'High' },
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-D #05.xlsx', well: 'WELL-D05', platform: 'Platform D', status: 'Active', date: '2026-01-20', scope: 'Active 2026', source: 'Local', anomalies: 2, highest: 'Medium' },
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-C #15.xlsx', well: 'WELL-C15', platform: 'Platform C', status: 'Active', date: '2025-11-04', scope: 'Historical', source: 'Historical archive', anomalies: 2, highest: 'Low' },
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-E #02.xlsx', well: 'WELL-E02', platform: 'Platform E', status: 'Non active', date: '2025-10-06', scope: 'Historical', source: 'Historical archive', anomalies: 0, highest: 'None' },
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-B #22.xlsx', well: 'WELL-B22', platform: 'Platform B', status: 'Active', date: '2025-08-19', scope: 'Historical', source: 'Historical archive', anomalies: 5, highest: 'Medium' },
  { file: 'SAMPLE FINAL INSPECTION PLATFORM-Y #12.xlsx', well: 'WELL-Y12', platform: 'Platform Y', status: 'Active', date: '2024-12-02', scope: 'Historical', source: 'Historical archive', anomalies: 1, highest: 'Low' },
];

export const FILTERS = {
  year: { label: 'All years', values: (r) => r.date.slice(0, 4) },
  well: { label: 'All wells', values: (r) => r.well },
  status: { label: 'All status', values: (r) => r.status },
  source: { label: 'All sources', values: (r) => r.source },
  scope: { label: 'All scopes', values: (r) => r.scope },
  anomaly: {
    label: 'All anomaly status',
    values: (r) => (r.anomalies === 0 ? 'No anomalies' : r.highest === 'High' ? 'High severity' : 'With anomalies'),
    match: (r, v) =>
      v === 'No anomalies' ? r.anomalies === 0 : v === 'High severity' ? r.highest === 'High' : r.anomalies > 0,
    options: ['With anomalies', 'High severity', 'No anomalies'],
  },
};
