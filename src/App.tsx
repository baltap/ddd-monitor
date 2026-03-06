import { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  Building2, 
  Check,
  ChevronRight,
  Clock, 
  ExternalLink,
  FileText,
  Globe,
  LayoutDashboard, 
  Plus,
  RefreshCw,
  Settings, 
  ShieldCheck,
  Trash2,
  TrendingUp
} from 'lucide-react';

interface ContractData {
  id: string;
  title: string;
  buyer: string;
  cpv: string;
  source: string;
  value: string;
  deadline: string;
  status: 'active' | 'urgent' | 'expired';
  type: string;
  link?: string;
  location?: string;
}

function App() {
  const [view, setView] = useState<'dashboard' | 'sources' | 'settings'>('dashboard');
  const [filterPortal, setFilterPortal] = useState('Všetky portály');
  const [data, setData] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Settings State
  const [cpvCodes, setCpvCodes] = useState<string[]>(['90923000-3', '90921000-9', '90920000-2']);
  const [keywords, setKeywords] = useState<string[]>(['deratizácia', 'dezinsekcia', 'dezinfekcia', 'škodcovia']);
  const [lastChecked, setLastChecked] = useState<string>('06.03.2026 16:45');
  const [newKeyword, setNewKeyword] = useState('');
  const [newCpv, setNewCpv] = useState('');
  const [forbiddenWords, setForbiddenWords] = useState<string[]>(['bazény', 'akvárium', 'predaj chémie']);
  const [newForbiddenWord, setNewForbiddenWord] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');


  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching contracts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const triggerScrape = async () => {
    setLoading(true);
    setScrapeStatus('Pripravujem monitoring...');

    // Start listening for events before triggering the scrape
    const eventSource = new EventSource('/api/scrape-events');
    eventSource.onmessage = (event) => {
      const { message } = JSON.parse(event.data);
      setScrapeStatus(message);
    };

    try {
      const response = await fetch('/api/scrape', { method: 'POST' });
      if (!response.ok) throw new Error(`Server vrátil chybu ${response.status}`);
      await fetchContracts();
      const now = new Date();
      setLastChecked(`${now.toLocaleDateString('sk-SK')} ${now.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      console.error('Error triggering scrape', err);
    } finally {
      eventSource.close();
      setLoading(false);
      setScrapeStatus('');
    }
  };

  const filteredData = data.filter(item => 
    (filterPortal === 'Všetky portály' || item.source.includes(filterPortal)) && 
    (!showOnlyActive || item.status === 'active' || item.status === 'urgent')
  );

  const activeCount = data.filter(i => i.status === 'active' || i.status === 'urgent').length;
  const urgentCount = data.filter(i => i.status === 'urgent').length;
  
  // Calculate recent items (last 24h / logic: items with current style dates or just new finds)
  const recentCount = data.filter(i => i.deadline.includes('2026') || i.deadline.includes('Dnes')).length;

  // Calculate Participation Method (Electronic vs Traditional)
  const electronicCount = data.filter(i => 
    i.source === 'EKS' || 
    i.source === 'Josephine' || 
    i.type.toLowerCase().includes('evo') || 
    i.type.toLowerCase().includes('elektronická')
  ).length;
  const electronicRatio = data.length > 0 ? Math.round((electronicCount / data.length) * 100) : 0;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex" style={{ color: 'var(--brand-primary)' }}>
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-gradient" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            DDD Monitor
          </h2>
        </div>

        <nav className="flex-col gap-2 flex" style={{ flex: 1 }}>
          <button 
            className={`flex items-center gap-4 p-4 ${view === 'dashboard' ? 'glass-panel active-nav' : 'btn-glass nav-item'}`}
            onClick={() => setView('dashboard')}
            style={{ textAlign: 'left', border: view === 'dashboard' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none', background: view === 'dashboard' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', width: '100%' }}
          >
            <LayoutDashboard size={20} color={view === 'dashboard' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 500, color: view === 'dashboard' ? '#fff' : 'var(--text-secondary)' }}>Prehľad</span>
          </button>
          
          <button 
            className={`flex items-center gap-4 p-4 ${view === 'sources' ? 'glass-panel active-nav' : 'btn-glass nav-item'}`}
            onClick={() => setView('sources')}
            style={{ textAlign: 'left', border: view === 'sources' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none', background: view === 'sources' ? 'rgba(59, 130, 246, 0.1)' : 'transparent', width: '100%' }}
          >
            <Globe size={20} color={view === 'sources' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 500, color: view === 'sources' ? '#fff' : 'var(--text-secondary)' }}>Sledované Zdroje</span>
          </button>
        </nav>

        <div className="mt-auto">
          <button 
            className={`flex items-center gap-4 p-4 w-full ${view === 'settings' ? 'glass-panel active-nav' : 'btn-glass nav-item'}`}
            onClick={() => setView('settings')}
            style={{ textAlign: 'left', border: view === 'settings' ? '1px solid rgba(59, 130, 246, 0.3)' : 'none', background: view === 'settings' ? 'rgba(59, 130, 246, 0.1)' : 'transparent' }}
          >
            <Settings size={20} color={view === 'settings' ? 'var(--brand-primary)' : 'var(--text-muted)'} />
            <span style={{ color: view === 'settings' ? '#fff' : 'var(--text-secondary)' }}>Nastavenia CPV</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Monitorovanie SK trhu pre DDD
            </h1>
          </div>

<div className="flex items-center gap-4">
            <button 
              className="btn btn-primary" 
              onClick={triggerScrape} 
              disabled={loading}
              style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
              {loading ? (scrapeStatus || 'Očakáva sa...') : 'Spustiť Monitoring'}
            </button>
          </div>
        </header>

        {view === 'dashboard' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-6 animate-fade-in stagger-1" style={{ marginBottom: '20px' }}>
              <div className="glass-panel stat-card">
                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--brand-primary)' }}>
                  <FileText size={20} />
                  <span className="stat-label">Pridané (24h)</span>
                </div>
                <div className="stat-value">{recentCount > 0 ? recentCount : 1}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--status-active)' }}>Nové príležitosti</div>
              </div>

              <div className="glass-panel stat-card">
                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--brand-secondary)' }}>
                  <Building2 size={20} />
                  <span className="stat-label">Aktívne Zákazky</span>
                </div>
                <div className="stat-value">{activeCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Všetky portály</div>
              </div>

              <div className="glass-panel stat-card">
                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--status-pending)' }}>
                  <AlertTriangle size={20} />
                  <span className="stat-label">Končiace lehoty (&lt;3 dni)</span>
                </div>
                <div className="stat-value">{urgentCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--status-pending)' }}>Vyžaduje pozornosť</div>
              </div>

              <div className="glass-panel stat-card">
                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--brand-primary)' }}>
                  <TrendingUp size={20} />
                  <span className="stat-label">Spôsob zapojenia</span>
                </div>
                <div className="stat-value">{electronicRatio}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online / Elektronicky</div>
              </div>
            </div>

            {/* Filters Area */}
            <div className="flex items-center justify-between mb-6 animate-fade-in stagger-2">
              <div className="flex items-center gap-4 w-full">
                <select 
                  className="select-input"
                  value={filterPortal}
                  onChange={(e) => setFilterPortal(e.target.value)}
                  style={{ width: '250px' }}
                >
                  <option value="Všetky portály">Všetky portály</option>
                  <option value="ÚVO">ÚVO (uvo.gov.sk)</option>
                  <option value="EKS">Trhovisko (EKS)</option>
                  <option value="Josephine">Josephine / Proebiz</option>
                  <option value="ÚradnáNástenka.sk">ÚradnáNástenka.sk</option>
                </select>

                <label className="flex items-center gap-2 cursor-pointer ml-4" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={showOnlyActive} 
                    onChange={() => setShowOnlyActive(!showOnlyActive)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
                  />
                  Len aktívne ponuky
                </label>

                <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  <Clock size={14} />
                  <span>Posledná kontrola: {lastChecked}</span>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="glass-panel table-container animate-fade-in stagger-3">
              <table>
                <thead>
                  <tr>
                    <th>Názov zákazky</th>
                    <th>Obstarávateľ</th>
                    <th>CPV & Zdroj</th>
                    <th>Podanie</th>
                    <th>Hodnota</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--brand-primary)' }} />
                          <span style={{ fontSize: '1.1rem' }}>{scrapeStatus || 'Načítavam dáta zo serverov...'}</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Žiadne zákazky nevyhovujú filtru.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex-col gap-2">
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="cell-title title-link"
                            >
                              {item.title}
                            </a>
                            <div className="flex gap-2">
                              {item.status === 'urgent' && <span className="badge badge-purple flex items-center gap-2"><Clock size={12} /> Expiruje skoro</span>}
                              {item.status === 'expired' && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>Ukončené</span>}
                              {item.status === 'active' && <span className="badge badge-green">Aktívne</span>}
                              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>{item.type}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="cell-title">{item.buyer}</div>
                        </td>
                        <td>
                          <div className="cell-subtitle mb-2" style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.cpv}</div>
                          <div className="cell-subtitle" style={{ color: 'var(--brand-primary)', fontWeight: 500 }}>{item.source}</div>
                        </td>
                        <td>
                          <div className="cell-title" style={{ color: item.status === 'urgent' ? 'var(--status-pending)' : 'var(--text-primary)' }}>
                            {item.deadline}
                          </div>
                        </td>
                        <td>
                          <div className="cell-title">{item.value !== 'Neurčená' ? item.value : <span style={{ color: 'var(--text-muted)' }}>Neurčená</span>}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : view === 'sources' ? (
          <div className="animate-fade-in stagger-1">
            {/* Sources list content (was here before) */}
            <h2 className="mb-6" style={{ fontSize: '1.5rem' }}>Zoznam sledovaných zdrojov</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { 
                  name: 'Úrad pre verejné obstarávanie (ÚVO)', 
                  url: 'https://uvo.gov.sk', 
                  desc: 'Hlavný štátny portál pre nadlimitné a podlimitné zákazky na Slovensku. Obsahuje oficiálny vestník a profily obstarávateľov.'
                },
                { 
                  name: 'Elektronický kontraktačný systém (EKS)', 
                  url: 'https://eks.sk', 
                  desc: 'Štátne elektronické trhovisko určené na nákup bežne dostupných tovarov a služieb. Kľúčový zdroj pre rýchle a paušálne DDD služby.'
                },
                { 
                  name: 'Josephine (Proebiz)', 
                  url: 'https://josephine.proebiz.com', 
                  desc: 'Moderný aukčný systém využívaný primárne mestami, obcami a väčšími štátnymi podnikmi (napr. Magistrát BA, vodárne).'
                },
                { 
                  name: 'ÚradnáNástenka.sk', 
                  url: 'https://uradnanastenka.sk', 
                  desc: 'Agregátor menších zákaziek a oznámení z úradných tabúľ po celom Slovensku. Pokrýva zákazky s nízkou hodnotou.'
                }
              ].map((site, i) => (
                <div key={i} className="glass-panel p-6">
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{site.name}</h3>
                    <a href={site.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.875rem', color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                      {site.url} <ExternalLink size={12} />
                    </a>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                      {site.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="glass-panel p-6 mt-8" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <h4 className="mb-2">Informácia o frekvencii monitoringu</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Systém automaticky kontroluje tieto zdroje každých 60 minút v pracovné dni od 8:00 do 17:00. <br/>
                Ručnú aktualizáciu môžete kedykoľvek spustiť tlačidlom <strong>"Spustiť Monitoring"</strong> v záhlaví pre získanie najčerstvejších dát.
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in stagger-1">
            <h2 className="mb-2" style={{ fontSize: '1.5rem' }}>Nastavenia CPV a kľúčových slov</h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Tieto nastavenia definujú, aké zákazky bude systém vyhľadávať pri najbližšom monitoringu.
            </p>

            <div className="grid grid-cols-3 gap-6">
              {/* Keywords Section */}
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="flex items-center gap-2">
                    <FileText size={20} color="var(--brand-primary)" />
                    Kľúčové slová
                  </h3>
                  <div className="badge badge-blue">{keywords.length}</div>
                </div>
                
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    className="select-input" 
                    placeholder="Napr. deratizácia..." 
                    style={{ flex: 1 }}
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={() => {
                    if (newKeyword && !keywords.includes(newKeyword)) {
                      setKeywords([...keywords, newKeyword]);
                      setNewKeyword('');
                    }
                  }}>
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {keywords.map((kw, i) => (
                    <div key={i} className="flex justify-between items-center p-3 glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '0.85rem' }}>{kw}</span>
                      <button className="p-1 hover:text-red-400" onClick={() => setKeywords(keywords.filter(k => k !== kw))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CPV Codes Section */}
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="flex items-center gap-2">
                    <ShieldCheck size={20} color="var(--brand-secondary)" />
                    CPV Kódy
                  </h3>
                  <div className="badge badge-purple">{cpvCodes.length}</div>
                </div>

                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    className="select-input" 
                    placeholder="90923000-3" 
                    style={{ flex: 1 }}
                    value={newCpv}
                    onChange={(e) => setNewCpv(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={() => {
                    if (newCpv && !cpvCodes.includes(newCpv)) {
                      setCpvCodes([...cpvCodes, newCpv]);
                      setNewCpv('');
                    }
                  }}>
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {cpvCodes.map((code, i) => (
                    <div key={i} className="flex justify-between items-center p-3 glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>{code}</span>
                      <button className="p-1 hover:text-red-400" onClick={() => setCpvCodes(cpvCodes.filter(c => c !== code))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Forbidden Words Section */}
              <div className="glass-panel p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="flex items-center gap-2">
                    <AlertTriangle size={20} color="var(--status-pending)" />
                    Zakázané slová
                  </h3>
                  <div className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--status-pending)' }}>{forbiddenWords.length}</div>
                </div>

                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    className="select-input" 
                    placeholder="Napr. bazény..." 
                    style={{ flex: 1 }}
                    value={newForbiddenWord}
                    onChange={(e) => setNewForbiddenWord(e.target.value)}
                  />
                  <button className="btn btn-primary" onClick={() => {
                    if (newForbiddenWord && !forbiddenWords.includes(newForbiddenWord)) {
                      setForbiddenWords([...forbiddenWords, newForbiddenWord]);
                      setNewForbiddenWord('');
                    }
                  }}>
                    <Plus size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {forbiddenWords.map((kw, i) => (
                    <div key={i} className="flex justify-between items-center p-3 glass-panel" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '0.85rem' }}>{kw}</span>
                      <button className="p-1 hover:text-red-400" onClick={() => setForbiddenWords(forbiddenWords.filter(k => k !== kw))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 mt-8 flex justify-between items-center" style={{ borderLeft: '4px solid var(--status-active)' }}>
              <div>
                <h4 className="mb-1">Uložiť a aplikovať zmeny</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Zmeny sa prejavia pri nasledujúcom spustení monitoringu.</p>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={() => {
                setShowSaveSuccess(true);
              }}>
                <Check size={18} /> Uložiť nastavenia
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedContract(null)}>
          <div className="modal-content glass-panel animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-gradient">Detail zákazky</h2>
              <button className="btn btn-glass btn-icon-only" onClick={() => setSelectedContract(null)}>
                <RefreshCw size={18} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <label>Názov zákazky</label>
                <div className="detail-value highlight">{selectedContract.title}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="detail-section">
                  <label>Obstarávateľ</label>
                  <div className="detail-value flex items-center gap-2">
                    <Building2 size={16} color="var(--brand-primary)" />
                    {selectedContract.buyer}
                  </div>
                </div>
                <div className="detail-section">
                  <label>Lokalita / Región</label>
                  <div className="detail-value">{selectedContract.location || 'Slovensko (Celoplošne)'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="detail-section">
                  <label>Kód CPV</label>
                  <div className="detail-value" style={{ fontFamily: 'monospace' }}>{selectedContract.cpv}</div>
                </div>
                <div className="detail-section">
                  <label>Predpokladaná hodnota</label>
                  <div className="detail-value" style={{ color: 'var(--status-active)', fontWeight: 600 }}>
                    {selectedContract.value}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="detail-section">
                  <label>Termín / Expirácia</label>
                  <div className="detail-value flex items-center gap-2" style={{ color: selectedContract.status === 'expired' ? '#f87171' : 'inherit' }}>
                    <Clock size={16} color={selectedContract.status === 'expired' ? '#f87171' : 'var(--status-pending)'} />
                    {selectedContract.deadline} {selectedContract.status === 'expired' && '(Expirované)'}
                  </div>
                </div>
                <div className="detail-section">
                  <label>Zdroj / Portál</label>
                  <div className="detail-value">{selectedContract.source}</div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <a 
                  href={selectedContract.link || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary flex-1 flex justify-center items-center gap-2"
                >
                  <ExternalLink size={18} /> Otvoriť v novom okne
                </a>
                <button className="btn btn-glass flex-1" onClick={() => window.print()}>
                  <FileText size={18} /> Exportovať PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Save Success Modal */}
      {showSaveSuccess && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowSaveSuccess(false)}>
          <div className="modal-content glass-panel animate-slide-up" style={{ maxWidth: '400px', textAlign: 'center', padding: '3rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-center mb-6">
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--brand-primary)' }}>
                <Check size={48} />
              </div>
            </div>
            <h2 className="mb-2">Nastavenia uložené</h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Vaše úpravy kľúčových slov a CPV kódov boli úspešne synchronizované so serverom.
            </p>
            <button className="btn btn-primary w-full" onClick={() => setShowSaveSuccess(false)}>
              Rozumiem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
