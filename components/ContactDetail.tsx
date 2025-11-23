
import React, { useState } from 'react';
import { Contact, Deal, AccountGrade } from '../types';
import { ArrowLeft, Mail, Phone, Building, Sparkles, Calendar, Send, Edit3, Save, Search, Target, MapPin } from 'lucide-react';
import { generateEmailDraft, summarizeMeetingNotes, assessAccountGrade } from '../services/geminiService';

interface ContactDetailProps {
  contact: Contact;
  deals: Deal[];
  onBack: () => void;
}

const ContactDetail: React.FC<ContactDetailProps> = ({ contact, deals, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'email' | 'notes'>('overview');
  const [emailPrompt, setEmailPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  
  const [noteInput, setNoteInput] = useState('');
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Grading State
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<string | null>(null);

  const contactDeals = deals.filter(d => d.contactId === contact.id);

  const handleGenerateEmail = async () => {
    if (!emailPrompt) return;
    setIsGeneratingEmail(true);
    const draft = await generateEmailDraft(contact.name, contact.company, emailPrompt);
    setGeneratedEmail(draft);
    setIsGeneratingEmail(false);
  };

  const handleSummarizeNotes = async () => {
    if (!noteInput) return;
    setIsSummarizing(true);
    const result = await summarizeMeetingNotes(noteInput);
    setSummary(result);
    setIsSummarizing(false);
  }

  const handleAnalyzeGrade = async () => {
    setIsGrading(true);
    setGradingResult(null);
    const totalValue = contactDeals.reduce((acc, d) => acc + d.value, 0);
    // Pass contact.type to the service
    const result = await assessAccountGrade(contact.company, contact.type, totalValue, contact.notes);
    setGradingResult(result);
    setIsGrading(false);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft size={20} className="mr-2" /> 거래처 목록으로
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-bold">
              {contact.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h1 className="text-2xl font-bold text-slate-900">{contact.name}</h1>
                 <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">{contact.type || 'Company'}</span>
              </div>
              <p className="text-slate-500 flex items-center mt-1">
                <Building size={16} className="mr-1" /> {contact.role} at {contact.company}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
              <Phone size={18} className="mr-2" /> 전화
            </button>
            <button 
              onClick={() => setActiveTab('email')}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Mail size={18} className="mr-2" /> 이메일 작성
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            기본 정보
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'email' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles size={16} className="mr-2" /> AI 이메일 초안
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'notes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Edit3 size={16} className="mr-2" /> 회의록 요약
          </button>
        </div>

        <div className="p-8 bg-slate-50/50 min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Info Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">연락처 정보</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-slate-700">
                      <Mail size={18} className="mr-3 text-slate-400" /> {contact.email}
                    </div>
                    <div className="flex items-center text-slate-700">
                      <Phone size={18} className="mr-3 text-slate-400" /> {contact.phone}
                    </div>
                    <div className="flex items-center text-slate-700">
                       <MapPin size={18} className="mr-3 text-slate-400" /> {contact.address || '주소 미입력'}
                    </div>
                    <div className="flex items-center text-slate-700">
                      <Calendar size={18} className="mr-3 text-slate-400" /> 최근 연락: {contact.lastContacted}
                    </div>
                     <div className="flex items-center text-slate-700">
                      <Target size={18} className="mr-3 text-slate-400" /> 목표 금액: {formatCurrency(contact.targetAmount || 0)}
                    </div>
                  </div>
                </div>
                
                {/* Grade Analysis Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                   <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">AI 거래처 등급 평가</h3>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded">현재: {contact.grade}등급</span>
                   </div>
                   
                   {!gradingResult && !isGrading && (
                       <div className="text-center py-4">
                           <p className="text-sm text-slate-500 mb-3">
                               Google Search를 통해 외부 데이터(재무, 뉴스, KESS 등)와 내부 데이터를 종합하여 등급을 재산정합니다.
                           </p>
                           <button 
                                onClick={handleAnalyzeGrade}
                                className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium flex items-center mx-auto"
                            >
                                <Search size={16} className="mr-2" /> 등급 분석 실행
                            </button>
                       </div>
                   )}

                   {isGrading && (
                        <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
                            <span className="text-sm">외부 데이터 검색 및 등급 분석 중...</span>
                        </div>
                   )}

                   {gradingResult && (
                       <div className="bg-indigo-50/50 rounded p-4 text-sm text-slate-700 whitespace-pre-line border border-indigo-100">
                           {gradingResult}
                       </div>
                   )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">메모 히스토리</h3>
                   <ul className="space-y-2 text-sm text-slate-600">
                    {contact.notes.map((note, i) => (
                      <li key={i} className="flex items-start">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-2 mr-2 flex-shrink-0"></span>
                        {note}
                      </li>
                    ))}
                   </ul>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">진행 중인 거래 (Deals)</h3>
                {contactDeals.length > 0 ? (
                  <div className="space-y-4">
                    {contactDeals.map(deal => (
                      <div key={deal.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-indigo-900">{deal.title}</h4>
                          <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                            {deal.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>{formatCurrency(deal.value)}</span>
                          <span>성공 확률: {deal.probability}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">진행 중인 거래가 없습니다.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start">
                <Sparkles className="text-indigo-600 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-indigo-900 font-semibold text-sm">Gemini AI 어시스턴트</h3>
                  <p className="text-indigo-700 text-sm mt-1">보내려는 내용을 간단히 적어주시면, 전문적인 이메일을 작성해 드립니다.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">이메일 목적 및 내용</label>
                <textarea 
                  className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[100px]"
                  placeholder="예: 지난 화요일 미팅에 대한 후속 조치 및 계약서 검토 여부 문의..."
                  value={emailPrompt}
                  onChange={(e) => setEmailPrompt(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleGenerateEmail}
                  disabled={isGeneratingEmail || !emailPrompt}
                  className={`flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium shadow-sm transition-all ${isGeneratingEmail ? 'opacity-75 cursor-wait' : 'hover:bg-indigo-700 hover:shadow-md'}`}
                >
                  {isGeneratingEmail ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      작성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} className="mr-2" /> 이메일 초안 생성
                    </>
                  )}
                </button>
              </div>

              {generatedEmail && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500 uppercase">생성된 초안</span>
                    <button 
                        className="text-slate-400 hover:text-indigo-600 text-xs"
                        onClick={() => navigator.clipboard.writeText(generatedEmail)}
                    >
                        복사하기
                    </button>
                  </div>
                  <div className="p-6">
                    <textarea 
                      className="w-full h-64 p-0 border-0 focus:ring-0 text-slate-700 resize-none leading-relaxed bg-transparent"
                      value={generatedEmail}
                      onChange={(e) => setGeneratedEmail(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                      <Send size={16} className="mr-2" /> 메일 발송
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

           {activeTab === 'notes' && (
            <div className="max-w-3xl mx-auto space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div className="flex flex-col space-y-4">
                      <label className="block text-sm font-medium text-slate-700">회의 메모 (Raw Data)</label>
                      <textarea
                          className="w-full flex-1 p-4 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[300px] text-sm"
                          placeholder="메모를 여기에 붙여넣으세요...
- 고객 할인 요청
- 도입 시기 고민 중 (4분기?)
- API 문서 필요하다고 함"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                      ></textarea>
                      <button
                          onClick={handleSummarizeNotes}
                          disabled={isSummarizing || !noteInput}
                          className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors flex items-center justify-center"
                      >
                           {isSummarizing ? '분석 중...' : <><Sparkles size={16} className="mr-2"/> 요약 및 실행 항목 추출</>}
                      </button>
                  </div>
                  <div className="flex flex-col space-y-4">
                      <label className="block text-sm font-medium text-slate-700">AI 요약 리포트</label>
                      <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 min-h-[300px] overflow-y-auto shadow-sm text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {summary ? summary : <span className="text-slate-400 italic">결과가 여기에 표시됩니다...</span>}
                      </div>
                      <button
                          disabled={!summary}
                          className="w-full py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors flex items-center justify-center"
                      >
                          <Save size={16} className="mr-2"/> 히스토리에 저장
                      </button>
                  </div>
               </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ContactDetail;
