export interface ComponentDetail {
  id: string;
  name: string;
  role: string;
  analogy: string;
  internals: string[];
  flow: string;
  scaleNote: string;
  failure: {
    symptom: string;
    impact: string;
    check: string;
    recovery: string;
  };
  yamlFields: string[];
}

export interface FlowStep {
  id: number;
  label: string;
  active: string[];
  description: string;
}

export interface SchedulerStep {
  label: string;
  count: number;
  description: string;
  detail: string;
}

export interface IngressStep {
  id: number;
  label: string;
  description: string;
}

export interface TroubleshootingScenario {
  id: string;
  title: string;
  category: "scheduling" | "runtime" | "storage" | "resources" | "networking";
  symptom: string;
  causes: Array<{ cause: string; check: string; fix: string }>;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

export interface YamlFieldMapping {
  component: string;
  desc: string;
}

export interface NetworkType {
  name: string;
  description: string;
  color: string;
}

export interface ServiceType {
  name: string;
  description: string;
  details: string;
}

export interface CniPlugin {
  name: string;
  description: string;
  features: string[];
}
