
import React, { useState, useEffect } from 'react';
import { ViewState, Contact, Deal, SalesRep, DealStage } from './types';
import Dashboard from './components/Dashboard';
import ContactList from './components/ContactList';
import ContactDetail from './components/ContactDetail';
import Pipeline from './components/Pipeline';
import Settings from './components/Settings';
import { generateWeeklyReport } from './services/geminiService';
import { loadInitialData, saveDataToSheet, sendReportEmail, syncSheetData } from './services/storageService';
import { LayoutDashboard, Users, Kanban, Menu, X, Sparkles, Mail, Save, RefreshCw, Settings as SettingsIcon, FileSpreadsheet, ChevronUp, ChevronDown, Check, Activity } from 'lucide-react';
import { MOCK_SALES_REPS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Data State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // User Switcher State (Managed via Dashboard, but default held here)
  const [currentUser, setCurrentUser] = useState<SalesRep>(MOCK_SALES_REPS[0]);

  // Load Data on Mount
  useEffect(() => {
    loadData();
    
    // Auto-sync every 10 minutes (600,000 ms)
    const syncInterval = setInterval(() => {
        console.log("Auto-syncing data...");
        syncSheetData().then(data => {
            // Only update if data exists to avoid wiping local work with empty sheet
            if (data.contacts.length > 0) setContacts(data.contacts);
            if (data.deals.length > 0) setDeals(data.deals);
            if (data.salesReps.length > 0) setSalesReps(data.salesReps);
        }).catch(err => console.error("Auto-sync failed", err));
    }, 600000);

    return () => clearInterval(syncInterval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await loadInitialData();
      setContacts(data.contacts);
      setDeals(data.deals);
      setSalesReps(data.salesReps);
      
      // Update currentUser if salesReps are loaded and current user is default
      if (data.salesReps.length > 0) {
          setCurrentUser(data.salesReps[0]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      await saveDataToSheet(contacts, deals, salesReps);
      alert("데이터가 구글 시트에 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("Save failed:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSamples = async () => {
      setIsSaving(true);
      try {
          // Force save the current state (which contains mock data) to the sheet
          await saveDataToSheet(contacts, deals, salesReps);
          alert("샘플 데이터가 구글 시트에 업로드되었습니다.");
      } catch (error) {
          console.error("Upload failed:", error);
          alert("업로드 중 오류가 발생했습니다.");
      } finally {
          setIsSaving(false);
      }
  }

  const handleSyncSheet = async () => {
      // Check if running in typical Gas environment or local
      if (!window.google?.script) {
          console.warn("Local sync simulated.");
      }
      if (!window.confirm("구글 시트의 데이터를 가져와서 현재 화면을 덮어씁니다. 계속하시겠습니까?")) return;
      setIsSyncing(true);
      try {
          const data = await syncSheetData();
          setContacts(data.contacts);
          setDeals(data.deals);
          setSalesReps(data.salesReps);
          alert("구글 시트 데이터와 동기화되었습니다.");
      } catch (error) {
          console.error("Sync failed:", error);
          alert("동기화 실패: " + error);
      } finally {
          setIsSyncing(false);
      }
  }

  const handleWeeklyReport = async () => {
      setIsGeneratingReport(true);
      try {
          const reportBody = await generateWeeklyReport(deals, contacts);
          await sendReportEmail(currentUser.email, `[주간 영업 리포트] ${new Date().toLocaleDateString()}`, reportBody);
          alert(`주간 리포트가 ${currentUser.email}로 발송되었습니다.`);
      } catch (e) {
          console.error(e);
          alert("리포트 생성 또는 발송 실패");
      } finally {
          setIsGeneratingReport(false);
      }
  }

  const handleAddContact = (newContact: Contact, newDeal?: Deal) => {
    setContacts(prev => [...prev, newContact]);
    if (newDeal) {
        setDeals(prev => [...prev, newDeal]);
    }
  };

  const handleUpdateContact = (updatedContact: Contact, updatedDeal?: Deal) => {
      setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
      
      if (updatedDeal) {
          setDeals(prev => {
              const exists = prev.find(d => d.id === updatedDeal.id);
              if (exists) {
                  return prev.map(d => d.id === updatedDeal.id ? updatedDeal : d);
              } else {
                  return [...prev, updatedDeal];
              }
          });
      }
  };

  const handleDeleteContact = (contactId: string) => {
    setContacts(prev => prev.filter(c => c.id !== contactId));
    setDeals(prev => prev.filter(d => d.contactId !== contactId));
  };

  const handleAddRep = (newRep: SalesRep) => {
    setSalesReps(prev => [...prev, newRep]);
  };

  const handleUpdateRep = (updatedRep: SalesRep) => {
      setSalesReps(prev => prev.map(r => r.id === updatedRep.id ? updatedRep : r));
  }

  const handleDeleteRep = (repId: string) => {
    setSalesReps(prev => prev.filter(r => r.id !== repId));
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-indigo-600 font-medium">데이터 불러오는 중...</span>
        </div>
      );
    }

    if (selectedContact) {
      return (
        <ContactDetail 
          contact={selectedContact} 
          deals={deals}
          onBack={() => setSelectedContact(null)} 
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard deals={deals} contacts={contacts} currentUser={currentUser} salesReps={salesReps} onExportToSheet={handleSaveData} />;
      case 'contacts':
        return (
          <ContactList 
            contacts={contacts}
            deals={deals}
            onSelectContact={setSelectedContact} 
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
          />
        );
      case 'pipeline':
        return <Pipeline deals={deals} contacts={contacts} />;
      case 'settings':
        return (
          <Settings 
            salesReps={salesReps} 
            onAddRep={handleAddRep} 
            onUpdateRep={handleUpdateRep}
            onDeleteRep={handleDeleteRep}
            onUploadSamples={handleUploadSamples}
          />
        );
      default:
        return <Dashboard deals={deals} contacts={contacts} currentUser={currentUser} salesReps={salesReps} onExportToSheet={handleSaveData} />;
    }
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setSelectedContact(null);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group ${
        currentView === view && !selectedContact
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} className={`mr-3 ${currentView === view && !selectedContact ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'}`} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center space-x-2">
            <Activity className="text-indigo-600 h-8 w-8" />
            <span className="text-2xl font-bold tracking-tight text-slate-900">
                <span className="text-blue-600">IEG</span> CRM
            </span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          <NavItem view="dashboard" icon={LayoutDashboard} label="대시보드" />
          <NavItem view="contacts" icon={Users} label="거래처 및 매출 관리" />
          <NavItem view="pipeline" icon={Kanban} label="파이프라인" />
          <div className="border-t border-slate-100 my-2 pt-2">
             <NavItem view="settings" icon={SettingsIcon} label="설정 (직원 관리)" />
          </div>
        </nav>

        <div className="px-4 space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={handleSyncSheet}
                    disabled={isSyncing}
                    className="py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 flex items-center justify-center text-sm font-medium transition-colors"
                >
                   {isSyncing ? <div className="animate-spin h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full"></div> : <FileSpreadsheet size={16} />}
                   <span className="ml-2">불러오기</span>
                </button>
                <button 
                    onClick={handleSaveData}
                    disabled={isSaving}
                    className="py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-100 flex items-center justify-center text-sm font-medium transition-colors"
                >
                   {isSaving ? <div className="animate-spin h-4 w-4 border-2 border-indigo-700 border-t-transparent rounded-full"></div> : <Save size={16} />}
                   <span className="ml-2">저장</span>
                </button>
            </div>

            <button 
                onClick={handleWeeklyReport}
                disabled={isGeneratingReport}
                className="w-full py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 flex items-center justify-center text-sm font-medium transition-colors shadow-lg shadow-slate-200"
            >
                {isGeneratingReport ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                    <Mail size={16} className="mr-2" />
                )}
                주간 리포트 발송
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between z-30">
           <div className="flex items-center space-x-2">
             <Activity className="text-indigo-600 h-6 w-6" />
             <span className="text-lg font-bold text-slate-900"><span className="text-blue-600">IEG</span> CRM</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
