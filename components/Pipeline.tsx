import React from 'react';
import { Deal, DealStage, Contact } from '../types';
import { AlertCircle } from 'lucide-react';
import { analyzeDealHealth } from '../services/geminiService';

interface PipelineProps {
  deals: Deal[];
  contacts: Contact[];
}

const Pipeline: React.FC<PipelineProps> = ({ deals, contacts }) => {
  const stages = Object.values(DealStage);

  const getContactName = (id: string) => {
    return contacts.find(c => c.id === id)?.name || 'Unknown Contact';
  };
  
  const getStageColor = (stage: DealStage) => {
      switch (stage) {
          case DealStage.CLOSED_WON: return 'border-t-4 border-t-emerald-500';
          case DealStage.CLOSED_LOST: return 'border-t-4 border-t-red-500';
          default: return 'border-t-4 border-t-indigo-500';
      }
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
  };

  const [analyzingDealId, setAnalyzingDealId] = React.useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = React.useState<{id: string, text: string} | null>(null);

  const handleAnalyzeDeal = async (deal: Deal) => {
    setAnalyzingDealId(deal.id);
    setAnalysisResult(null);
    const contact = contacts.find(c => c.id === deal.contactId);
    const notes = contact ? contact.notes : [];
    
    const result = await analyzeDealHealth(deal.title, deal.stage, deal.value, notes);
    setAnalysisResult({ id: deal.id, text: result });
    setAnalyzingDealId(null);
  };

  return (
    <div className="h-[calc(100vh-12rem)] overflow-x-auto animate-fade-in pb-4">
      <div className="flex space-x-4 min-w-max h-full">
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div key={stage} className="w-80 flex-shrink-0 flex flex-col h-full">
              <div className="mb-3 flex justify-between items-center px-1">
                <h3 className="font-semibold text-slate-700 text-sm truncate max-w-[200px]" title={stage}>{stage}</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                   {stageDeals.length}
                </span>
              </div>
              <div className="text-xs text-slate-400 mb-3 px-1 font-mono">
                {formatCurrency(stageValue)}
              </div>
              
              <div className="flex-1 bg-slate-100/50 rounded-xl p-2 overflow-y-auto space-y-3 border border-slate-100">
                {stageDeals.map(deal => (
                  <div key={deal.id} className={`bg-white p-4 rounded-lg shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-shadow group relative ${getStageColor(deal.stage)}`}>
                    <h4 className="font-semibold text-slate-800 mb-1">{deal.title}</h4>
                    <p className="text-sm text-slate-500 mb-2">{getContactName(deal.contactId)}</p>
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {formatCurrency(deal.value)}
                      </span>
                      <span className={`${deal.probability >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        확률 {deal.probability}%
                      </span>
                    </div>
                    
                    {/* AI Insight Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleAnalyzeDeal(deal); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 hover:text-indigo-600 bg-white rounded-full p-1 shadow-sm"
                        title="AI 분석"
                    >
                        <AlertCircle size={16} />
                    </button>

                    {/* Inline Analysis Result */}
                    {(analyzingDealId === deal.id || analysisResult?.id === deal.id) && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 bg-indigo-50/50 -mx-4 -mb-4 p-4 rounded-b-lg">
                            {analyzingDealId === deal.id ? (
                                <div className="flex items-center">
                                    <div className="animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full mr-2"></div>
                                    분석 중...
                                </div>
                            ) : (
                                <div className="prose prose-xs text-slate-600 whitespace-pre-line">
                                    {analysisResult?.text}
                                    <button onClick={(e) => { e.stopPropagation(); setAnalysisResult(null); }} className="block mt-2 text-indigo-600 underline">닫기</button>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;