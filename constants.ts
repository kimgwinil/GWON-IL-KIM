
import { Contact, Deal, DealStage, Activity, SalesRep, ContactType, AccountGrade, DealStatus } from './types';

export const MOCK_SALES_REPS: SalesRep[] = [
  { id: 's1', name: '홍길동', team: '영업 1팀', department: '영업본부', role: 'manager', email: 'hong@ieg.com', phone: '010-1234-5678' },
  { id: 's2', name: '김영업', team: '영업 2팀', department: '영업본부', role: 'staff', email: 'kim@ieg.com', phone: '010-2345-6789' },
  { id: 's3', name: '이수진', team: '영업 1팀', department: '영업본부', role: 'staff', email: 'lee@ieg.com', phone: '010-3456-7890' },
  { id: 's4', name: '박이사', team: '임원실', department: '영업본부', role: 'director', email: 'park@ieg.com', phone: '010-4567-8901' },
  { id: 's5', name: '최성실', team: '영업 2팀', department: '영업본부', role: 'staff', email: 'choi@ieg.com', phone: '010-5678-9012' },
];

const now = new Date();
const currentYear = now.getFullYear();

// Helper to get a date string for a specific month/day in the current year
const getDateInYear = (month: number, day: number) => {
  // month is 0-11
  const d = new Date(currentYear, month, day);
  return d.toISOString().split('T')[0];
};

// --- Data Generators ---

const CONTACT_TYPES: ContactType[] = ['Company', 'University', 'Institute', 'Association'];
// REMOVED 'Unrated' to ensure all charts are populated with valid grades
const GRADES: AccountGrade[] = ['S', 'A', 'B', 'C', 'D']; 

const LOCATIONS = ['서울 강남구', '서울 종로구', '경기 성남시', '대전 유성구', '부산 해운대구', '인천 송도', '충북 청주시', '세종시', '광주 북구'];

const BASE_COMPANIES = [
    '태크코프', '이노베이트', '미래산업', '한국대학교', '서울과학기술대', 'KAIST', 'ETRI', 'KISTI', 
    '소프트웨어산업협회', '정보통신산업진흥원', '삼성전자', 'LG전자', '현대자동차', 'SK하이닉스', 
    '네이버', '카카오', '포스코', '한화시스템', 'LIG넥스원', 'KAI', '서울대', '연세대', '고려대',
    '부산대', '경북대', '전남대', '충남대', '전자통신연구원', '기계연구원', '화학연구원',
    '두산로보틱스', '현대로템', '한국항공우주', 'KT', 'LG유플러스', 'SK텔레콤', '엔씨소프트',
    '넷마블', '크래프톤', '펄어비스', '카카오뱅크', '토스', '쿠팡', '우아한형제들',
    '직방', '당근마켓', '하이퍼커넥트', '비바리퍼블리카', '야놀자', '쏘카'
];

// Generate Contacts ensuring EVERY sales rep has data
const generateContacts = (): Contact[] => {
    const contacts: Contact[] = [];
    let globalIdx = 0;

    // Iterate through EVERY sales rep to ensure coverage
    MOCK_SALES_REPS.forEach((rep) => {
        // Assign 8 to 12 contacts per rep
        const count = 8 + Math.floor(Math.random() * 5); 
        
        for (let i = 0; i < count; i++) {
            const companyName = BASE_COMPANIES[globalIdx % BASE_COMPANIES.length] + (Math.floor(globalIdx / BASE_COMPANIES.length) > 0 ? ` ${Math.floor(globalIdx / BASE_COMPANIES.length) + 1}` : '');
            
            const type = companyName.includes('대') ? 'University' : (companyName.includes('연구원') || companyName.includes('진흥원') ? 'Institute' : (companyName.includes('협회') ? 'Association' : 'Company'));
            
            contacts.push({
                id: `c${globalIdx + 1}`,
                name: `담당자${globalIdx + 1}`,
                email: `contact${globalIdx + 1}@${type === 'Company' ? 'company.com' : 'org.kr'}`,
                phone: `010-${1000 + globalIdx}-${2000 + globalIdx}`,
                company: companyName,
                type: type,
                address: LOCATIONS[globalIdx % LOCATIONS.length] + (globalIdx % 2 === 0 ? ' 테크노밸리' : ' 캠퍼스'),
                role: globalIdx % 3 === 0 ? '팀장' : (globalIdx % 3 === 1 ? '책임' : '이사'),
                department: rep.team, // Sync with Rep's Team
                lastContacted: getDateInYear(now.getMonth(), (globalIdx % 28) + 1),
                notes: [`${currentYear}년 사업 계획 논의 필요`, '최근 예산 증액 소식 있음'],
                grade: GRADES[globalIdx % GRADES.length], // Round-robin assignment of S, A, B, C, D
                targetAmount: (Math.floor(Math.random() * 50) + 10) * 10000000, // 1억 ~ 6억
                owner: rep.name, // Explicitly assign to the rep
                team: rep.team   // Explicitly assign to the rep's team
            });
            globalIdx++;
        }
    });

    return contacts;
};

export const MOCK_CONTACTS = generateContacts();

// Generate Deals linked to the generated contacts
const generateDeals = (): Deal[] => {
    const deals: Deal[] = [];
    let dealIdCounter = 1;

    MOCK_CONTACTS.forEach(contact => {
        // Generate 3-6 deals per contact spread across the year
        const dealCount = 3 + Math.floor(Math.random() * 4);
        
        for(let i = 0; i < dealCount; i++) {
             // Random month 0-11
             const month = Math.floor(Math.random() * 12);
             deals.push(createMockDeal(dealIdCounter++, month, contact));
        }
    });

    return deals;
};

const createMockDeal = (id: number, month: number, contact: Contact): Deal => {
    const day = Math.floor(Math.random() * 28) + 1;
    
    // Distribute statuses evenly
    const statuses: DealStatus[] = ['매출', '확정', '예정', '미정'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const value = (Math.floor(Math.random() * 20) + 5) * 5000000; // 25M ~ 125M
    const prodRatio = 0.7 + (Math.random() * 0.2); // 0.7 ~ 0.9
    const productAmount = Math.round(value * prodRatio);
    const goodsAmount = value - productAmount;

    let stage: DealStage;
    let probability: number;

    switch(status) {
        case '매출': stage = DealStage.CLOSED_WON; probability = 100; break;
        case '확정': stage = DealStage.NEGOTIATION; probability = 90; break;
        case '예정': stage = DealStage.PROPOSAL; probability = 60; break;
        default: stage = DealStage.LEAD; probability = 20; break;
    }

    return {
        id: `d${id}`,
        title: `${contact.company} ${month+1}월 기자재 납품`,
        value: value,
        productAmount: productAmount,
        goodsAmount: goodsAmount,
        itemDetails: `상세 품목: 서버 ${Math.floor(Math.random()*5)+1}대, 라이선스 ${Math.floor(Math.random()*10)+1}ea`,
        status: status,
        stage: stage,
        contactId: contact.id,
        expectedCloseDate: getDateInYear(month, day),
        probability: probability,
        owner: contact.owner!, // Matches contact owner
        team: contact.team!,   // Matches contact team
        department: '영업본부'
    };
}

export const MOCK_DEALS = generateDeals();

export const MOCK_ACTIVITIES: Activity[] = [
  { id: 'a1', type: 'email', contactId: 'c1', description: '제안서 초안 v2 발송', date: getDateInYear(now.getMonth(), now.getDate()) },
  { id: 'a2', type: 'call', contactId: 'c2', description: 'API 제한 사항 논의', date: getDateInYear(now.getMonth(), now.getDate()-2) },
];
