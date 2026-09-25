// Fictional offshore route map for chapter 04. Locations are abstract
// (Node A1, Node B3 …) and do not correspond to any real well or platform.
// x / z are map coordinates in world units; the SVG fallback uses the same.

export const BASE = { id: 'base', label: 'Supply base', x: -12, z: 7 };

export const NODES = [
  { id: 'a1', label: 'Node A1', crew: 'a', x: -7, z: -3, focus: 'Routine preventive maintenance' },
  { id: 'a2', label: 'Node A2', crew: 'a', x: -2.5, z: -8, focus: 'Valve servicing and greasing' },
  { id: 'a3', label: 'Node A3', crew: 'a', x: 4, z: -9, focus: 'Troubleshooting a hard-to-operate valve' },
  { id: 'a4', label: 'Node A4', crew: 'a', x: 1.5, z: -3.5, focus: 'Pressure mapping and leak test' },
  { id: 'b1', label: 'Node B1', crew: 'b', x: -5, z: 4, focus: 'Routine preventive maintenance' },
  { id: 'b2', label: 'Node B2', crew: 'b', x: 2, z: 5.5, focus: 'Corrective maintenance follow-up' },
  { id: 'b3', label: 'Node B3', crew: 'b', x: 8.5, z: 3, focus: 'Gauge replacement and pressure verification' },
  { id: 'b4', label: 'Node B4', crew: 'b', x: 9, z: -2.5, focus: 'Annulus valve test' },
];

export const ROUTES = [
  {
    id: 'a',
    label: 'Crew A · Vessel 1',
    stops: ['a1', 'a2', 'a3', 'a4'],
    sequence: ['Mobilize from supply base', 'Pre-job briefing and PTW on board', 'Inspect → test → maintain at each node', 'Report findings the same day', 'Return and demobilize'],
  },
  {
    id: 'b',
    label: 'Crew B · Vessel 2',
    stops: ['b1', 'b2', 'b3', 'b4'],
    sequence: ['Mobilize from supply base', 'Pre-job briefing and PTW on board', 'Carry corrective items from previous visits', 'Report findings the same day', 'Return and demobilize'],
  },
];

// The five steps opened by selecting a node. Text is generic and sanitized.
export const WORK_STEPS = [
  ['Inspection', 'Visual check of the wellhead and X-mas tree: leaks, corrosion, studs and nuts, gauge condition.'],
  ['Testing', 'Valve function and pressure observation recorded on the Final Inspection form.'],
  ['Maintenance', 'Greasing and servicing of the valves in scope; outcome recorded per valve position.'],
  ['Troubleshooting', 'Any valve that does not operate as expected is diagnosed on site or logged for corrective work.'],
  ['Reporting', 'The Final Inspection report is submitted and enters WIMS for validation and follow-up.'],
];

export const nodeById = Object.fromEntries([BASE, ...NODES].map((n) => [n.id, n]));
