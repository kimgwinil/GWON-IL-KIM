
import { GoogleGenAI } from "@google/genai";
import { Deal, Contact } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Email Generation
export const generateEmailDraft = async (
  contactName: string,
  company: string,
  context: string,
  tone: string = 'professional'
): Promise<string> => {
  if (!apiKey) return "오류: API 키가 없습니다.";

  try {
    const prompt = `
      작성자: 영업 담당자
      수신자: ${contactName} (${company})
      맥락/목표: ${context}
      
      위 내용을 바탕으로 ${tone === 'professional' ? '정중하고 전문적인' : '친근한'} 한국어 이메일 초안을 작성해주세요.
      제목과 본문을 구분해서 작성해주세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "내용을 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "이메일 초안 생성에 실패했습니다. 다시 시도해주세요.";
  }
};

// Deal Analysis
export const analyzeDealHealth = async (
  dealTitle: string,
  stage: string,
  value: number,
  notes: string[]
): Promise<string> => {
  if (!apiKey) return "오류: API 키가 없습니다.";

  try {
    const prompt = `
      당신은 노련한 영업 전문가입니다. 다음 거래 건의 건전성을 분석해주세요:
      
      거래명: ${dealTitle}
      단계: ${stage}
      금액: ₩${value.toLocaleString()}
      최근 메모/특이사항: ${notes.join('; ')}

      다음 형식으로 3문장 이내의 평가와 2개의 구체적인 행동 제안을 한국어로 작성해주세요:
      [평가] ...
      [제안] 1. ... 2. ...
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "분석 결과를 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "거래 분석에 실패했습니다.";
  }
};

// Meeting Notes Summary
export const summarizeMeetingNotes = async (rawNotes: string): Promise<string> => {
    if (!apiKey) return "오류: API 키가 없습니다.";
    try {
        const prompt = `
            다음의 정리되지 않은 회의 메모를 분석하여 핵심 요약(Key Takeaways)과 실행 항목(Action Items)으로 정리된 깔끔한 리스트를 한국어로 만들어주세요:
            
            "${rawNotes}"
        `;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "요약을 생성하지 못했습니다.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "메모 요약에 실패했습니다.";
    }
}

// Account Grading with Grounding (Search + KESS)
export const assessAccountGrade = async (
  companyName: string,
  type: string | undefined,
  currentValue: number,
  notes: string[]
): Promise<string> => {
  if (!apiKey) return "오류: API 키가 없습니다.";

  try {
    // 교육기관(학교, 연구원 등) 여부에 따라 프롬프트 분기
    let additionalInstruction = "";
    if (type === 'University' || type === 'Institute') {
        additionalInstruction = `
          - 이 기관은 교육기관 또는 연구소입니다.
          - '교육통계서비스(KESS)' (kess.kedi.re.kr) 관련 데이터나, 해당 학교의 학생 수, 최근 국책 과제 수주 현황, 연구비 예산 규모 등을 중점적으로 검색하세요.
          - 학령 인구 감소 또는 정부 R&D 예산 변화가 이 기관에 미치는 영향을 고려하세요.
        `;
    } else {
        additionalInstruction = `
          - 이 기업의 최근 재무 제표, 주가 추이(상장사의 경우), 신규 투자 유치 소식을 중점적으로 검색하세요.
          - 산업군 내 시장 점유율과 경쟁사 동향을 비교하세요.
        `;
    }

    const prompt = `
      기업/기관명: ${companyName}
      유형: ${type || '일반 기업'}
      현재 파이프라인 가치: ₩${currentValue.toLocaleString()}
      내부 영업 메모: ${notes.join(', ')}

      [지시사항]
      1. Google Search를 사용하여 위 기관의 최신 현황을 조사하세요.
      ${additionalInstruction}
      
      2. 내부 데이터(현재 거래 규모)와 외부 데이터를 종합하여 등급을 평가하세요.
      
      [등급 기준]
      - S등급: 예산 풍부/학생수 안정적/대형 과제 수주 등 긍정적 신호 강력함. 최우선 공략 필요.
      - A등급: 우수 거래처, 성장 가능성 높음.
      - B등급: 일반적, 현상 유지 예상.
      - C등급: 예산 삭감/학생수 급감/적자 등 리스크 존재.
      - D등급: 거래 중단 고려.
      
      [출력 형식]
      등급: [등급]
      주요 지표: [학생 수, 매출액, 예산 규모 등 구체적 수치 2~3개]
      분석: [종합적인 분석 내용 3줄 요약]
      전략: [이 기관을 공략하기 위한 구체적 전략 1문장]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], 
      },
    });

    return response.text || "등급 평가를 완료할 수 없습니다.";
  } catch (error) {
    console.error("Gemini API Error (Grading):", error);
    return "등급 평가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
}

// Weekly Strategy Report
export const generateWeeklyReport = async (deals: Deal[], contacts: Contact[]): Promise<string> => {
  if (!apiKey) return "오류: API 키가 없습니다.";

  try {
    // Summarize deals by status
    const dealSummary = deals.map(d => {
      const contact = contacts.find(c => c.id === d.contactId);
      const company = contact ? contact.company : '알 수 없는 기업';
      const grade = contact ? contact.grade : 'Unrated';
      return `- [${d.status}] ${d.title} (${company}, 등급:${grade}): 총 ₩${d.value.toLocaleString()} (제품: ₩${d.productAmount.toLocaleString()}, 상품: ₩${d.goodsAmount.toLocaleString()})`;
    }).join('\n');

    const prompt = `
      당신은 영업 팀의 유능한 AI 비서입니다. 아래 파이프라인 현황을 분석하여 영업 담당자에게 보낼 '주간 영업 전략 리포트' 내용을 HTML 형식(본문만)으로 작성해주세요.

      [현재 파이프라인 현황]
      ${dealSummary}

      [작성 지침]
      1. **매출/확정/예정/미정** 상태별로 요약하여 분석하세요.
      2. **등급(S, A)**이 높지만 상태가 '미정'인 건에 대해 우선 방문/연락을 제안하세요.
      3. **제품 매출**과 **상품 매출** 비중을 고려하여 수익성 높은 건에 집중하도록 조언하세요.
      4. 이번 주 핵심 실행 아이템 3가지를 명확히 리스트업하세요.
      
      출력 스타일:
      - 인사말은 생략하고 바로 본론으로 들어갑니다.
      - <h3>, <ul>, <li>, <b> 태그를 사용하여 가독성을 높이세요.
      - 금액은 한국 원화(₩) 표기를 유지하세요.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "리포트를 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini API Error (Report):", error);
    return "주간 리포트 생성 실패.";
  }
}
