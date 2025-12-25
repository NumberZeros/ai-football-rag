export interface ReportSection {
  title: string;
  content: string;
  emoji: string;
}

export interface FinalReport {
  title: string;
  subtitle: string;
  sections: ReportSection[];
  quickTalkingPoints: string[];
  generatedAt: number;
}
