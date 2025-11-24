
import React, { useState, useMemo, useEffect } from 'react';
import { Deal, DealStage, Contact, ScopeType, TimePeriod, SalesRep } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Briefcase, Users, TrendingUp, Download, Calendar, User, Users as UsersIcon, Activity, FileSpreadsheet, Printer } from 'lucide-react';

interface DashboardProps {
  deals: Deal[];
  contacts: Contact[];
  currentUser: { name: string; team: string; department: string };
  salesReps: SalesRep[]; // List of reps for the dropdown
  onExportToSheet?: () => void;
}

// Custom Won Icon Component (Korean Won Symbol-ish)
const WonIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    width="24"
    height="24"
  >
    <path d="M4 4l4 16" />
    <path d="M20 4l-4 16" />
    <path d="M8 20l4-10" />
    <path d="M16 20l-4-10" />
    <path d="M2 10h20" opacity="0.5"/>
    <path d="M2 14h20" opacity="0.5"/>
  </svg>
);

const Dashboard: React.FC<DashboardProps> = ({ deals, contacts, currentUser, salesReps, onExportToSheet }) => {
  const [scope, setScope] = useState<ScopeType>('individual');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');
  
  // Selected user for "Individual" scope filtering
  const [selectedUser, setSelectedUser] = useState<string>(currentUser.name);
  // Selected team for "Team" scope filtering
  const [selectedTeam, setSelectedTeam] = useState<string>(currentUser.team);
  
  // Export Menu State
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Get unique teams from salesReps dynamically
  const teams = useMemo(() => {
      const teamSet = new Set(salesReps.map(r => r.team).filter(Boolean));
      return Array.from(teamSet).sort();
  }, [salesReps]);

  // Update defaults when currentUser changes or salesReps loads
  useEffect(() => {
    if (currentUser.name && !selectedUser) setSelectedUser(currentUser.name);
    if (currentUser.team && !selectedTeam) setSelectedTeam(currentUser.team);
    
    // Fallback if selectedTeam is empty but teams exist
    if (!selectedTeam && teams.length > 0) {
        setSelectedTeam(teams[0]);
    }
  }, [currentUser, teams, selectedUser, selectedTeam]);

  // --- Filtering Logic ---
  const filterByScope = <T extends { owner?: string; team?: string; department?: string }>(items: T[]): T[] => {
    if (!items) return [];
    return items.filter(item => {
      if (scope === 'individual') return item.owner === selectedUser;
      if (scope === 'team') return item.team === selectedTeam;
      if (scope === 'all') return true; 
      return true;
    });
  };

  // 1. Filter Contacts based on Scope (Individual/Team/All)
  const scopedContacts = useMemo(() => filterByScope(contacts), [contacts, scope, selectedUser, selectedTeam]);
  
  // 2. Filter Deals based on Scope
  const scopedDeals = useMemo(() => filterByScope(deals), [deals, scope, selectedUser, selectedTeam]);

  // Helper for Date Filtering
  const checkDateInPeriod = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    
    if (timePeriod === 'year') {
        return date.getFullYear() === now.getFullYear();
    }
    if (timePeriod === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (timePeriod === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const dateQuarter = Math.floor(date.getMonth() / 3);
        return dateQuarter === currentQuarter && date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // 3. Filter Deals based on Time Period (Month/Quarter/Year)
  const filteredDeals = useMemo(() => {
    return scopedDeals.filter(d => checkDateInPeriod(d.expectedCloseDate));
  }, [scopedDeals, timePeriod]);

  // --- Metrics Calculations ---
  
  // Target Amount depends on SCOPED contacts (not all contacts)
  const calculateAdjustedTarget = () => {
    const totalAnnualTarget = scopedContacts.reduce((acc, c) => acc + (c.targetAmount || 0), 0);
    if (timePeriod === 'month') return Math.round(totalAnnualTarget / 12);
    if (timePeriod === 'quarter') return Math.round(totalAnnualTarget / 4);
    return totalAnnualTarget; 
  };

  const targetAmount = calculateAdjustedTarget();

  const performanceAmount = filteredDeals
    .filter(d => d.status === '매출' || d.stage === DealStage.CLOSED_WON)
    .reduce((acc, d) => acc + d.value, 0);

  const confirmedAmount = filteredDeals
    .filter(d => d.status === '확정')
    .reduce((acc, d) => acc + d.value, 0);

  const expectedAmount = filteredDeals
    .filter(d => d.status === '예정')
    .reduce((acc, d) => acc + d.value, 0);

  const undecidedAmount = filteredDeals
    .filter(d => d.status === '미정')
    .reduce((acc, d) => acc + d.value, 0);

  // --- Chart Data Preparation ---

  // 1. Monthly Stacked Bar Data (Jan-Dec) - Always show 12 months
  const monthlyData = useMemo(() => {
      // Create skeleton for 12 months
      const data = Array.from({length: 12}, (_, i) => ({
          name: `${i + 1}월`,
          매출: 0, 
          확정: 0, 
          예정: 0, 
          미정: 0 
      }));

      // Use scoped deals (all year) to populate the monthly chart
      scopedDeals.forEach(deal => {
          const date = new Date(deal.expectedCloseDate);
          // Only consider current year for the chart regardless of period filter (to show trend)
          if (date.getFullYear() === new Date().getFullYear()) {
              const monthIdx = date.getMonth(); // 0-11
              const status = deal.status; 
              if (data[monthIdx] && data[monthIdx][status] !== undefined) {
                  data[monthIdx][status] += deal.value;
              }
          }
      });
      return data;
  }, [scopedDeals]);

  // 2. Pie Chart Data (Grade) - Based on TARGET AMOUNT sum
  const gradeData = useMemo(() => {
    const sums: Record<string, number> = {};
    scopedContacts.forEach(contact => {
        // Fallback to 'D' if something is unrated, though generator guarantees S-D
        const g = contact.grade === 'Unrated' ? 'D' : (contact.grade || 'D');
        sums[g] = (sums[g] || 0) + (contact.targetAmount || 0);
    });

    return Object.keys(sums)
        .filter(key => sums[key] > 0)
        .map(key => ({
            name: key, // S, A, B...
            value: sums[key]
        }))
        .sort((a, b) => b.value - a.value); // Sort by value desc
  }, [scopedContacts]);
  
  const totalGradeAmount = useMemo(() => gradeData.reduce((acc, cur) => acc + cur.value, 0), [gradeData]);

  const STACK_COLORS = { '매출': '#10b981', '확정': '#3b82f6', '예정': '#f59e0b', '미정': '#94a3b8' };
  const GRADE_COLORS: any = { 'S': '#4f46e5', 'A': '#10b981', 'B': '#f59e0b', 'C': '#f97316', 'D': '#ef4444' };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);
  };

  const formatMillionsKorean = (value: number) => {
      return `₩${Math.round(value / 1000000).toLocaleString()}백만`;
  }

  const handlePrintPDF = () => {
      setShowExportMenu(false);
      window.print();
  }

  const handleGoogleSheetExport = () => {
      setShowExportMenu(false);
      if (onExportToSheet) onExportToSheet();
  }

  const currentScopeLabel = () => {
      if (scope === 'individual') return selectedUser;
      if (scope === 'team') return selectedTeam;
      return '전체';
  }

  // 1. Outside Label: Amount Only (Bigger)
  const renderOutsideLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value } = props;
    const RADIAN = Math.PI / 180;
    // Push label out slightly less to keep in box
    const radius = outerRadius + 20; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    
    return (
      <text x={x} y={y} fill="#334155" textAnchor={textAnchor} dominantBaseline="central" fontSize={13} fontWeight={700}>
        {formatMillionsKorean(value)}
      </text>
    );
  };

  // 2. Inside Label: Grade + Percentage
  const renderInsideLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props;
    const RADIAN = Math.PI / 180;
    // Position in the middle of the donut thickness
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Hide if slice is too small
    if (percent < 0.04) return null;

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold" style={{ textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}>
            {`${name} (${(percent * 100).toFixed(1)}%)`}
        </text>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 dashboard-container">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .dashboard-container, .dashboard-container * {
            visibility: visible;
          }
          .dashboard-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
          }
          aside, header, .no-print {
            display: none !important;
          }
          .shadow-sm, .shadow-lg {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">영업 대시보드</h2>
            <div className="flex items-center bg-white rounded-md border border-slate-200 p-0.5 shadow-sm">
                <button onClick={() => setTimePeriod('month')} className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${timePeriod === 'month' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>월별</button>
                <button onClick={() => setTimePeriod('quarter')} className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${timePeriod === 'quarter' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>분기별</button>
                <button onClick={() => setTimePeriod('year')} className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${timePeriod === 'year' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>누계</button>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            {/* Scope Selection Buttons */}
            <div className="relative inline-flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                {(['individual', 'team', 'all'] as ScopeType[]).map(s => (
                     <button 
                        key={s}
                        onClick={() => setScope(s)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${scope === s ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        {s === 'individual' ? '개인별' : s === 'team' ? '팀별' : '전체'}
                    </button>
                ))}
            </div>

            {/* Individual User Selector */}
            {scope === 'individual' && (
                <div className="relative min-w-[140px]">
                    <select 
                        value={selectedUser} 
                        onChange={(e) => setSelectedUser(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer hover:bg-slate-50"
                    >
                        {salesReps.map(rep => (
                            <option key={rep.id} value={rep.name}>{rep.name}</option>
                        ))}
                    </select>
                    <User className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            )}

            {/* Team Selector */}
            {scope === 'team' && (
                <div className="relative min-w-[140px]">
                    <select 
                        value={selectedTeam} 
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer hover:bg-slate-50"
                    >
                        {teams.map(teamName => (
                            <option key={teamName} value={teamName}>{teamName}</option>
                        ))}
                    </select>
                    <UsersIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            )}

            <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)} 
                    className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm"
                >
                    <Download size={16} className="mr-2" /> 내보내기
                </button>
                
                {showExportMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 z-20 py-1 animate-fade-in">
                            <button 
                                onClick={handleGoogleSheetExport}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                            >
                                <FileSpreadsheet size={16} className="mr-2 text-emerald-600"/>
                                Google Sheet로 내보내기
                            </button>
                            <button 
                                onClick={handlePrintPDF}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                            >
                                <Printer size={16} className="mr-2 text-slate-500"/>
                                PDF로 내보내기 (인쇄)
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
      
      {/* KPI Cards - Compact Height (min-h-[105px]) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Target Card */}
        <div className="md:col-span-2 lg:col-span-5 bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
            <div className="w-full md:w-auto z-10">
                <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-1">
                    총 목표 금액 ({timePeriod === 'month' ? '월간' : timePeriod === 'quarter' ? '분기' : '연간'})
                    <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded-full font-bold border border-indigo-100">
                        {scope === 'individual' && <User size={10} className="mr-1"/>}
                        {scope === 'team' && <UsersIcon size={10} className="mr-1"/>}
                        {currentScopeLabel()}
                    </span>
                </p>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatCurrency(targetAmount)}</p>
            </div>
             <div className="text-right flex items-center gap-6 w-full md:w-auto justify-between md:justify-end z-10">
                 <div>
                     <p className="text-sm text-slate-500 font-semibold">달성률</p>
                     <p className={`text-3xl font-bold ${targetAmount > 0 && (performanceAmount / targetAmount) >= 1 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {targetAmount > 0 ? ((performanceAmount / targetAmount) * 100).toFixed(1) : 0}%
                     </p>
                 </div>
                 {/* Progress Bar Visual */}
                 <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden hidden sm:block border border-slate-200">
                    <div 
                        className={`h-full ${targetAmount > 0 && (performanceAmount / targetAmount) >= 1 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                        style={{width: `${Math.min((performanceAmount / (targetAmount || 1)) * 100, 100)}%`}}
                    ></div>
                 </div>
            </div>
        </div>

        {/* Metric Cards - Reduced height */}
        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-emerald-500 border-y border-r border-slate-100 flex flex-col justify-between min-h-[105px] relative overflow-hidden group">
            <div className="z-10">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">매출 실적 (완료)</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{formatCurrency(performanceAmount)}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 text-emerald-50 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform rotate-12 pointer-events-none">
                <WonIcon className="w-20 h-20" />
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-blue-500 border-y border-r border-slate-100 flex flex-col justify-between min-h-[105px] relative overflow-hidden group">
            <div className="z-10">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">매출 확정</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{formatCurrency(confirmedAmount)}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 text-blue-50 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform rotate-12 pointer-events-none">
                <Briefcase size={80} />
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-amber-400 border-y border-r border-slate-100 flex flex-col justify-between min-h-[105px] relative overflow-hidden group">
             <div className="z-10">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">매출 예정</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{formatCurrency(expectedAmount)}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 text-amber-50 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform rotate-12 pointer-events-none">
                <TrendingUp size={80} />
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-slate-400 border-y border-r border-slate-100 flex flex-col justify-between min-h-[105px] relative overflow-hidden group">
            <div className="z-10">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">매출 미정</p>
                <p className="text-3xl font-extrabold text-slate-800 mt-2">{formatCurrency(undecidedAmount)}</p>
            </div>
             <div className="absolute -bottom-4 -right-4 text-slate-100 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 transform rotate-12 pointer-events-none">
                <Users size={80} />
            </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stacked Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                <Calendar size={20} className="mr-2 text-indigo-500"/>
                월별 매출 현황 (누적)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={monthlyData} 
                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    barCategoryGap="10%"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                    interval={0} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 11}} 
                    tickFormatter={(value) => `₩${(value / 1000000).toLocaleString()}백만`} 
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{fill: '#f8fafc', opacity: 0.8}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="매출" stackId="a" fill={STACK_COLORS['매출']} radius={[0, 0, 0, 0]} maxBarSize={100} />
                  <Bar dataKey="확정" stackId="a" fill={STACK_COLORS['확정']} radius={[0, 0, 0, 0]} maxBarSize={100} />
                  <Bar dataKey="예정" stackId="a" fill={STACK_COLORS['예정']} radius={[0, 0, 0, 0]} maxBarSize={100} />
                  <Bar dataKey="미정" stackId="a" fill={STACK_COLORS['미정']} radius={[4, 4, 0, 0]} maxBarSize={100} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-800">거래처 등급 분포 (목표 금액 기준)</h3>
                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">전체 누적</span>
              </div>
              <div className="h-80 w-full flex items-center justify-center">
                  {gradeData.length > 0 && gradeData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            {/* Main Pie (Visible Ring with Outside Label) */}
                            <Pie
                                data={gradeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50} // Thick donut
                                outerRadius={115} // Larger size
                                paddingAngle={2}
                                dataKey="value"
                                label={renderOutsideLabel} 
                                labelLine={true}
                            >
                                {gradeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.name as keyof typeof GRADE_COLORS] || '#cbd5e1'} stroke="none" />
                                ))}
                            </Pie>
                            {/* Overlay Pie (Invisible Ring for Inside Label) */}
                            <Pie
                                data={gradeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={115}
                                dataKey="value"
                                label={renderInsideLabel}
                                labelLine={false}
                                fill="none"
                                stroke="none"
                                isAnimationActive={false}
                            />
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 h-full w-full bg-slate-50 rounded-lg">
                        <Users size={32} className="mb-2 opacity-50"/>
                        <p>데이터가 없습니다.</p>
                        <p className="text-xs mt-2">거래처에 목표 금액 및 등급 정보가 있는지 확인해주세요.</p>
                    </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
    