'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';
import { useRestaurantById, useShopById } from '@/hooks/useHasuraApi';
import { apiGet, apiPost } from '@/lib/api';
import bcrypt from 'bcryptjs';
import {
  ArrowLeft,
  AlertCircle,
  Loader2,
  Utensils,
  ShoppingBag,
  Search,
  Clock,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

const RECENT_LOGINS_KEY = 'pos_recent_logins';
const MAX_RECENT = 4;

interface Employee {
  id: string;
  fullnames: string;
  email: string;
  phone: string;
  Position: string;
  roleType: string;
  pos_pin: string | null;
  password?: string;
  profile_image?: string | null;
  Shops?: { id: string; name: string; logo?: string | null; image?: string | null; relatedTo?: string | null };
  Restaurants?: { id: string; name: string; logo?: string | null; relatedTo?: string | null };
}

interface POSLoginScreenProps {
  onLogin: (employee: Employee) => void;
}

// Persist recent login IDs to localStorage (max 4)
function saveRecentLogin(empId: string) {
  try {
    const raw = localStorage.getItem(RECENT_LOGINS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const updated = [empId, ...ids.filter(id => id !== empId)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_LOGINS_KEY, JSON.stringify(updated));
  } catch (e) {}
}

function getRecentLoginIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_LOGINS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/* ─────────── Employee Avatar ─────────── */
function EmployeeAvatar({ emp, size = 'md' }: { emp: Employee; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-lg' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-12 h-12 text-sm';
  const initials = emp.fullnames.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return emp.profile_image ? (
    <img
      src={emp.profile_image}
      alt={emp.fullnames}
      className={`${sizeClass} rounded-full object-cover border-2 border-slate-600`}
    />
  ) : (
    <div className={`${sizeClass} rounded-full bg-slate-700/60 border-2 border-slate-600 flex items-center justify-center font-black text-slate-300`}>
      {initials}
    </div>
  );
}

/* ─────────── Main Component ─────────── */
const POSLoginScreen: React.FC<POSLoginScreenProps> = ({ onLogin }) => {
  const { session } = useAuth();
  const { shopSession, activeBusiness } = useShopSession();
  const { color } = useThemeColor();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // Flow & keypad states
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // PIN setup states
  const [setupStep, setSetupStep] = useState<'enter_pin' | 'verify_password' | 'setup_pin' | 'confirm_pin'>('enter_pin');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  /* ── Business identity ── */
  const isRestaurant = !!(session?.restaurant_id || shopSession?.isRestaurant);

  const restaurantId = session?.restaurant_id || (shopSession?.isRestaurant ? shopSession?.shopId : null);
  const shopId = session?.shop_id || (!shopSession?.isRestaurant ? shopSession?.shopId : null);

  const { data: restaurantData } = useRestaurantById(restaurantId || '');
  const { data: shopData } = useShopById(shopId || '');

  const restaurant = restaurantData?.Restaurants_by_pk;
  const shop = shopData?.Shops_by_pk;

  const businessName = restaurant?.name || shop?.name || session?.restaurant_name || session?.shop_name || activeBusiness?.name || '';
  const businessLogo = restaurant?.logo || shop?.logo || shop?.image || null;

  const currentBusinessId = shopSession?.shopId || session?.restaurant_id || session?.shop_id || activeBusiness?.id;
  const currentBusinessName = shopSession?.shopName || session?.restaurant_name || session?.shop_name || activeBusiness?.name;

  /* ── Load employees ── */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await apiGet<{ orgEmployees: any[] }>('/api/queries/org-employees');
        const allEmployees = data.orgEmployees || [];

        let currentStoreObj: any = null;
        for (const emp of allEmployees) {
          const s = emp.Shops || emp.Restaurants;
          if (s && (s.id === currentBusinessId || s.name === currentBusinessName)) {
            currentStoreObj = s;
            break;
          }
        }
        const mainName = currentStoreObj?.name || currentBusinessName;
        const mainRelatedTo = currentStoreObj?.relatedTo;

        const filtered = allEmployees.filter(emp => {
          const s = emp.Shops || emp.Restaurants;
          if (!s) return emp.shop_id === currentBusinessId || emp.restaurant_id === currentBusinessId;
          const isSameId = currentBusinessId && s.id === currentBusinessId;
          const isSameName = mainName && s.name === mainName;
          const isChildBranch = mainName && s.relatedTo === mainName;
          const isParentBranch = mainRelatedTo && s.name === mainRelatedTo;
          const isSiblingBranch = mainRelatedTo && s.relatedTo === mainRelatedTo;
          return isSameId || isSameName || isChildBranch || isParentBranch || isSiblingBranch;
        });

        setEmployees(filtered);
      } catch (err: any) {
        setError('Failed to load employee accounts. Please check connection.');
      } finally {
        setLoading(false);
      }
    };

    if (currentBusinessId || currentBusinessName) fetchEmployees();
  }, [currentBusinessId, currentBusinessName]);

  /* ── Load recent logins from localStorage ── */
  useEffect(() => {
    setRecentIds(getRecentLoginIds());
  }, []);

  /* ── Derived lists ── */
  const recentEmployees = useMemo(() =>
    recentIds.map(id => employees.find(e => e.id === id)).filter(Boolean) as Employee[],
    [recentIds, employees]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return employees.filter(e =>
      e.fullnames.toLowerCase().includes(q) ||
      (e.Position || '').toLowerCase().includes(q) ||
      (e.roleType || '').toLowerCase().includes(q)
    );
  }, [searchQuery, employees]);

  /* ── Keypad ── */
  const handleKeypadPress = (val: string) => {
    setPinError(null);
    setAuthError(null);

    if (val === 'C') { setPinCode(''); return; }
    if (val === 'B') { setPinCode(prev => prev.slice(0, -1)); return; }

    if (/^\d$/.test(val) && pinCode.length < 5) {
      const nextPin = pinCode + val;
      setPinCode(nextPin);

      if (nextPin.length === 5) {
        if (setupStep === 'enter_pin' && selectedEmp) {
          if (selectedEmp.pos_pin === nextPin) {
            saveRecentLogin(selectedEmp.id);
            onLogin(selectedEmp);
          } else {
            setPinError('Incorrect PIN. Try again.');
            setPinCode('');
          }
        } else if (setupStep === 'setup_pin') {
          setNewPin(nextPin);
          setPinCode('');
          setSetupStep('confirm_pin');
        } else if (setupStep === 'confirm_pin') {
          if (nextPin === newPin) {
            savePinToDatabase(nextPin);
          } else {
            setPinError('PIN codes do not match. Try again.');
            setPinCode('');
            setSetupStep('setup_pin');
          }
        }
      }
    }
  };

  const verifyPasswordAndProceed = () => {
    if (!selectedEmp || !authPassword) return;
    try {
      const isMatch = selectedEmp.password ? bcrypt.compareSync(authPassword, selectedEmp.password) : false;
      if (isMatch) {
        setSetupStep('setup_pin');
        setPinCode('');
        setPinError(null);
        setAuthPassword('');
      } else {
        setAuthError('Incorrect account password. Verification failed.');
      }
    } catch {
      setAuthError('Failed to verify password.');
    }
  };

  const savePinToDatabase = async (pin: string) => {
    if (!selectedEmp) return;
    try {
      setSavingPin(true);
      await apiPost('/api/mutations/update-employee-pin', { id: selectedEmp.id, pos_pin: pin });
      setEmployees(prev => prev.map(e => e.id === selectedEmp.id ? { ...e, pos_pin: pin } : e));
      saveRecentLogin(selectedEmp.id);
      onLogin({ ...selectedEmp, pos_pin: pin });
    } catch {
      setPinError('Failed to save PIN. Please try again.');
      setSetupStep('setup_pin');
      setPinCode('');
    } finally {
      setSavingPin(false);
    }
  };

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    setPinCode('');
    setPinError(null);
    setAuthError(null);
    setAuthPassword('');
    setSearchQuery('');
    setSetupStep(emp.pos_pin === null ? 'verify_password' : 'enter_pin');
  };

  const handleBack = () => {
    if (setupStep === 'confirm_pin') { setSetupStep('setup_pin'); setPinCode(''); }
    else if (setupStep === 'setup_pin') { setSetupStep('verify_password'); setPinCode(''); }
    else { setSelectedEmp(null); setPinCode(''); }
  };

  /* ─── Employee avatar card (grid) ─── */
  const EmployeeGridCard = ({ emp, isRecent = false }: { emp: Employee; isRecent?: boolean }) => (
    <button
      onClick={() => handleSelectEmployee(emp)}
      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60 hover:border-primary/50 hover:bg-slate-800/80 transition-all duration-200 group w-full"
    >
      <div className="relative">
        <EmployeeAvatar emp={emp} size="md" />
        {isRecent && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow">
            <Clock className="h-2.5 w-2.5 text-white" />
          </span>
        )}
        {emp.pos_pin === null && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow">!</span>
        )}
      </div>
      <div className="min-w-0 w-full text-center">
        <p className="text-xs font-extrabold text-slate-200 group-hover:text-white truncate leading-tight">{emp.fullnames}</p>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-400 truncate mt-0.5">
          {emp.Position || emp.roleType || 'Staff'}
        </p>
      </div>
    </button>
  );

  /* ─── Search result row card ─── */
  const EmployeeRowCard = ({ emp }: { emp: Employee }) => (
    <button
      onClick={() => handleSelectEmployee(emp)}
      className="flex items-center gap-3 w-full p-3 rounded-2xl bg-slate-800/40 border border-slate-800/60 hover:border-primary/50 hover:bg-slate-800/80 transition-all duration-200 group text-left"
    >
      <div className="relative shrink-0">
        <EmployeeAvatar emp={emp} size="sm" />
        {emp.pos_pin === null && (
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white font-extrabold">!</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-slate-200 group-hover:text-white truncate">{emp.fullnames}</p>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-400 truncate">
          {emp.Position || emp.roleType || 'Staff'}
        </p>
      </div>
    </button>
  );

  /* ─────────── Render ─────────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white font-sans overflow-hidden">
      {/* Theme-colored background blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[120px]" />

      <div className="w-full max-w-2xl p-7 bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col items-center relative z-10">

        {/* ── Business identity header ── */}
        <div className="flex flex-col items-center mb-6">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt={businessName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-lg mb-3"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/25">
              {isRestaurant
                ? <Utensils className="h-8 w-8 text-white" />
                : <ShoppingBag className="h-8 w-8 text-white" />
              }
            </div>
          )}
          <h2 className="text-xl font-black tracking-tight text-center">
            {businessName || 'POS'} <span className="text-primary">TERMINAL</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            TERMINAL <span className="text-slate-500 mx-1">•</span> LOCKED
          </p>
        </div>

        {/* ── Loading / Error / Employee Selection / Keypad ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-slate-400 font-medium">Loading staff profiles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-400 font-bold mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} size="sm">Retry</Button>
          </div>
        ) : !selectedEmp ? (
          <div className="w-full space-y-4">

            {/* 4-col grid: recents first, then fill remaining up to 8 */}
            {(() => {
              const recentIdSet = new Set(recentIds);
              const recentSlots = recentEmployees.slice(0, 8);
              const recentIdsFilled = new Set(recentSlots.map(e => e.id));
              const otherSlots = employees
                .filter(e => !recentIdsFilled.has(e.id))
                .slice(0, 8 - recentSlots.length);
              const gridEmployees = [...recentSlots, ...otherSlots];

              if (gridEmployees.length === 0) {
                return (
                  <p className="text-center text-xs text-slate-500 py-4 font-bold">
                    No active staff found for this branch.
                  </p>
                );
              }

              return (
                <div>
                  {recentSlots.length > 0 && (
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <Clock className="h-3 w-3" /> Select Your Profile
                    </label>
                  )}
                  <div className="grid grid-cols-4 gap-3">
                    {gridEmployees.map(emp => (
                      <EmployeeGridCard
                        key={emp.id}
                        emp={emp}
                        isRecent={recentIdSet.has(emp.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Search for the rest */}
            {employees.length > 8 && (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="Search more staff..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 pl-8 text-sm h-9"
                  />
                </div>

                {searchQuery.trim() && (
                  <ScrollArea className="max-h-[200px] w-full mt-2">
                    <div className="space-y-1.5 pr-1">
                      {searchResults.length === 0 ? (
                        <p className="text-center text-xs text-slate-500 py-3 font-bold">No staff matching "{searchQuery}"</p>
                      ) : (
                        searchResults.map(emp => <EmployeeRowCard key={emp.id} emp={emp} />)
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

          </div>
        ) : (
          /* ── PIN / Password screens ── */
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleBack}
              className="text-xs font-bold text-slate-400 hover:text-white mb-4 flex items-center gap-1.5 self-start"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>

            {/* Selected employee avatar + info */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                <EmployeeAvatar emp={selectedEmp} size="lg" />
              </div>
              <p className="text-base font-black text-white mt-2">{selectedEmp.fullnames}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {selectedEmp.Position || selectedEmp.roleType || 'Staff'}
              </p>
            </div>

            {/* Step header */}
            <div className="text-center mb-5">
              {setupStep === 'verify_password' && (
                <>
                  <span className="text-xs text-primary font-bold uppercase tracking-wide">Authentication Required</span>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[260px]">Enter your account password to set up a security PIN.</p>
                </>
              )}
              {setupStep === 'setup_pin' && (
                <>
                  <span className="text-xs text-primary font-bold uppercase tracking-wide">PIN Setup</span>
                  <p className="text-[10px] text-slate-400 mt-1">Enter a new 5-digit PIN</p>
                </>
              )}
              {setupStep === 'confirm_pin' && (
                <>
                  <span className="text-xs text-primary font-bold uppercase tracking-wide">Confirm PIN</span>
                  <p className="text-[10px] text-slate-400 mt-1">Re-enter your 5-digit PIN</p>
                </>
              )}
              {setupStep === 'enter_pin' && (
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">Enter your 5-digit PIN</span>
              )}
            </div>

            {setupStep === 'verify_password' ? (
              <div className="w-full space-y-3">
                <Input
                  type="password"
                  placeholder="Account Password"
                  value={authPassword}
                  onChange={e => { setAuthPassword(e.target.value); setAuthError(null); }}
                  className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-center"
                  onKeyDown={e => { if (e.key === 'Enter') verifyPasswordAndProceed(); }}
                />
                {authError && <p className="text-[10px] font-bold text-red-400 text-center">{authError}</p>}
                <Button
                  onClick={verifyPasswordAndProceed}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-2.5 rounded-xl shadow-lg"
                >
                  Verify Password
                </Button>
              </div>
            ) : (
              <>
                {/* PIN dots */}
                <div className="flex gap-3 mb-5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                        pinCode.length > idx
                          ? 'bg-primary border-primary scale-110 shadow-md shadow-primary/35'
                          : 'border-slate-700 bg-transparent'
                      }`}
                    />
                  ))}
                </div>

                {pinError && <div className="text-xs font-bold text-red-400 mb-3 text-center">{pinError}</div>}
                {savingPin && (
                  <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Saving PIN...
                  </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
                  {['1','2','3','4','5','6','7','8','9'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleKeypadPress(val)}
                      disabled={savingPin}
                      className="h-13 rounded-2xl bg-slate-800/40 border border-slate-800 text-lg font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white py-3"
                    >
                      {val}
                    </button>
                  ))}
                  <button type="button" onClick={() => handleKeypadPress('C')} disabled={savingPin}
                    className="h-13 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-400 text-sm font-black hover:bg-red-600/20 transition-colors flex items-center justify-center active:scale-95 py-3">
                    Clear
                  </button>
                  <button type="button" onClick={() => handleKeypadPress('0')} disabled={savingPin}
                    className="h-13 rounded-2xl bg-slate-800/40 border border-slate-800 text-lg font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white py-3">
                    0
                  </button>
                  <button type="button" onClick={() => handleKeypadPress('B')} disabled={savingPin}
                    className="h-13 rounded-2xl bg-slate-800/40 border border-slate-800 text-base font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white py-3">
                    Del
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default POSLoginScreen;
