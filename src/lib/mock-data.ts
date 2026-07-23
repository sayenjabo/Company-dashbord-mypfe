export interface Company {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  employeeCount: number;
  sessionsPlayed: number;
  assignedTrainings: number;
  lastActivity: string;
  passRate: number;
}

export interface Training {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  avgScore: number;
  playCount: number;
  passRate: number;
  active: boolean;
}

export interface Session {
  id: string;
  companyName: string;
  trainingTitle: string;
  playerName: string;
  score: number;
  passed: boolean;
  duration: string;
  date: string;
  criteria: { name: string; score: number; maxScore: number }[];
}

export const companies: Company[] = [
  { id: "1", name: "Acme Corp", email: "admin@acme.com", status: "active", employeeCount: 250, sessionsPlayed: 1420, assignedTrainings: 8, lastActivity: "2026-03-31", passRate: 78 },
  { id: "2", name: "TechVision", email: "hr@techvision.io", status: "active", employeeCount: 120, sessionsPlayed: 890, assignedTrainings: 5, lastActivity: "2026-03-30", passRate: 82 },
  { id: "3", name: "BuildRight", email: "ops@buildright.com", status: "active", employeeCount: 80, sessionsPlayed: 540, assignedTrainings: 6, lastActivity: "2026-03-28", passRate: 71 },
  { id: "4", name: "SafetyFirst Ltd", email: "info@safetyfirst.co", status: "inactive", employeeCount: 45, sessionsPlayed: 210, assignedTrainings: 3, lastActivity: "2026-02-15", passRate: 65 },
  { id: "5", name: "GreenEnergy", email: "training@greenenergy.com", status: "active", employeeCount: 300, sessionsPlayed: 2100, assignedTrainings: 10, lastActivity: "2026-03-31", passRate: 85 },
  { id: "6", name: "MediCare Plus", email: "admin@medicareplus.org", status: "active", employeeCount: 180, sessionsPlayed: 950, assignedTrainings: 7, lastActivity: "2026-03-29", passRate: 79 },
];

export const trainings: Training[] = [
  { id: "1", title: "Fire Evacuation", category: "Safety", description: "Simulates fire emergency evacuation procedures", thumbnail: "", avgScore: 76, playCount: 1850, passRate: 74, active: true },
  { id: "2", title: "Chemical Handling", category: "Safety", description: "Proper handling of hazardous chemicals in lab", thumbnail: "", avgScore: 82, playCount: 1200, passRate: 80, active: true },
  { id: "3", title: "Crane Operation", category: "Equipment", description: "Virtual crane operation training for construction", thumbnail: "", avgScore: 69, playCount: 890, passRate: 65, active: true },
  { id: "4", title: "Customer Service VR", category: "Soft Skills", description: "Handle difficult customer interactions", thumbnail: "", avgScore: 88, playCount: 2200, passRate: 90, active: true },
  { id: "5", title: "Electrical Safety", category: "Safety", description: "Electrical hazard awareness and safe practices", thumbnail: "", avgScore: 71, playCount: 650, passRate: 68, active: false },
  { id: "6", title: "Forklift Training", category: "Equipment", description: "Operate forklifts safely in warehouse environments", thumbnail: "", avgScore: 77, playCount: 1100, passRate: 73, active: true },
];

export const sessions: Session[] = [
  { id: "1", companyName: "Acme Corp", trainingTitle: "Fire Evacuation", playerName: "John Smith", score: 85, passed: true, duration: "12:34", date: "2026-03-31", criteria: [{ name: "Response Time", score: 9, maxScore: 10 }, { name: "Route Selection", score: 8, maxScore: 10 }, { name: "Communication", score: 8, maxScore: 10 }] },
  { id: "2", companyName: "TechVision", trainingTitle: "Chemical Handling", playerName: "Sara Lee", score: 92, passed: true, duration: "15:20", date: "2026-03-30", criteria: [{ name: "PPE Usage", score: 10, maxScore: 10 }, { name: "Spill Response", score: 9, maxScore: 10 }, { name: "Storage Protocol", score: 9, maxScore: 10 }] },
  { id: "3", companyName: "BuildRight", trainingTitle: "Crane Operation", playerName: "Mike Chen", score: 58, passed: false, duration: "20:10", date: "2026-03-28", criteria: [{ name: "Pre-Check", score: 6, maxScore: 10 }, { name: "Load Balance", score: 5, maxScore: 10 }, { name: "Signal Response", score: 6, maxScore: 10 }] },
  { id: "4", companyName: "GreenEnergy", trainingTitle: "Customer Service VR", playerName: "Emily Davis", score: 95, passed: true, duration: "08:45", date: "2026-03-31", criteria: [{ name: "Empathy", score: 10, maxScore: 10 }, { name: "Resolution", score: 9, maxScore: 10 }, { name: "Follow-up", score: 10, maxScore: 10 }] },
  { id: "5", companyName: "Acme Corp", trainingTitle: "Forklift Training", playerName: "Tom Wilson", score: 72, passed: true, duration: "18:00", date: "2026-03-29", criteria: [{ name: "Safety Check", score: 7, maxScore: 10 }, { name: "Maneuvering", score: 7, maxScore: 10 }, { name: "Load Handling", score: 8, maxScore: 10 }] },
  { id: "6", companyName: "MediCare Plus", trainingTitle: "Fire Evacuation", playerName: "Lisa Brown", score: 45, passed: false, duration: "14:55", date: "2026-03-27", criteria: [{ name: "Response Time", score: 4, maxScore: 10 }, { name: "Route Selection", score: 5, maxScore: 10 }, { name: "Communication", score: 5, maxScore: 10 }] },
  { id: "7", companyName: "TechVision", trainingTitle: "Electrical Safety", playerName: "Alex Park", score: 88, passed: true, duration: "11:30", date: "2026-03-26", criteria: [{ name: "Hazard ID", score: 9, maxScore: 10 }, { name: "Lockout/Tagout", score: 9, maxScore: 10 }, { name: "PPE Selection", score: 8, maxScore: 10 }] },
  { id: "8", companyName: "GreenEnergy", trainingTitle: "Chemical Handling", playerName: "Rachel Kim", score: 91, passed: true, duration: "16:12", date: "2026-03-25", criteria: [{ name: "PPE Usage", score: 9, maxScore: 10 }, { name: "Spill Response", score: 10, maxScore: 10 }, { name: "Storage Protocol", score: 9, maxScore: 10 }] },
];

export const dashboardStats = {
  totalCompanies: companies.length,
  totalTrainings: trainings.length,
  totalSessions: sessions.length * 150,
  globalPassRate: 76,
};
