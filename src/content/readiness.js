// Chapter 03 readiness matrix. Every row was verified before mobilization.
export const READINESS = [
  { cat: 'people', label: 'Competency and technical understanding', how: 'Each role matched to competency records; technical understanding checked in the pre-mobilization discussion.' },
  { cat: 'permits', label: 'One SIKA and permit readiness', how: 'Entry-permit applications tracked person by person until every crew member was authorized.' },
  { cat: 'people', label: 'BSS / Sea Survival and MCU validity', how: 'Certificate and medical check-up expiry dates checked against the full mobilization window.' },
  { cat: 'equipment', label: 'Calibrated pressure gauges and flowmeters', how: 'Calibration certificates checked for validity before the equipment was packed.' },
  { cat: 'equipment', label: 'Certified lifting equipment and toolboxes', how: 'Lifting-gear certificates and toolbox contents checked against the job list.' },
  { cat: 'equipment', label: 'Consumables, PPE and supporting documents', how: 'Grease, packing, PPE and field forms prepared for the visit programme.' },
  { cat: 'briefing', label: 'Pre-job briefing and task understanding', how: 'Scope, hazards and responsibilities briefed; open questions closed before sailing.' },
];

export const CATEGORY = { people: 'People', permits: 'Permits', equipment: 'Equipment', briefing: 'Briefing' };
