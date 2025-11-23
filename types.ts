
export enum DealStage {
  LEAD = '가망 고객 (Lead)',
  QUALIFIED = '적격 단계 (Qualified)',
  PROPOSAL = '제안 단계 (Proposal)',
  NEGOTIATION = '협상 단계 (Negotiation)',
  CLOSED_WON = '계약 성사 (Closed Won)',
  CLOSED_LOST = '계약 실패 (Closed Lost)'
}

export type DealStatus = '매출' | '확정' | '예정' | '미정';

export type AccountGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'Unrated';

// 거래처 유형 구분 (AI 분석용)
export type ContactType = 'Company' | 'University' | 'Institute' | 'Association';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  type?: ContactType; // 학교, 연구원, 기업 구분
  address?: string;
  role: string;
  department: string; // For internal hierarchy mapping
  lastContacted: string;
  notes: string[];
  grade: AccountGrade;
  targetAmount: number; // Annual Target
  owner?: string; // Sales Rep Name
  team?: string; // Sales Team Name
}

export interface Deal {
  id: string;
  title: string;
  
  // Financial Breakdown
  value: number; // Total (Product + Goods)
  productAmount: number; // 제품 매출
  goodsAmount: number; // 상품 매출
  
  // Details
  itemDetails: string; // 영업 품목 세부 내역
  
  // Status & Classification
  status: DealStatus; // 매출, 확정, 예정, 미정
  stage: DealStage; // Traditional Pipeline Stage
  
  contactId: string;
  expectedCloseDate: string; // YYYY-MM-DD
  probability: number;
  owner: string; // Sales rep name
  team: string; // Sales team name
  department: string; // Department name
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note';
  contactId: string;
  description: string;
  date: string;
}

export interface SalesRep {
  id: string;
  name: string;
  team: string;
  department: string;
  role: 'staff' | 'manager' | 'director';
  email: string;
}

export type ViewState = 'dashboard' | 'contacts' | 'pipeline' | 'settings';
export type ScopeType = 'individual' | 'team' | 'department' | 'all';
export type TimePeriod = 'month' | 'quarter' | 'year'; // 월별, 분기별, 누계(연간)

export interface AIResponse {
  content: string;
  isLoading: boolean;
  error?: string;
}

// Google Apps Script Interface
declare global {
  interface Window {
    google?: {
      script: {
        run: {
          withSuccessHandler: (callback: (response: any) => void) => {
            withFailureHandler: (callback: (error: Error) => void) => {
              [key: string]: (...args: any[]) => void;
            };
          };
        };
      };
    };
  }
}