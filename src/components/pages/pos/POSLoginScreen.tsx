'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';
import { apiGet, apiPost } from '@/lib/api';
import bcrypt from 'bcryptjs';
import {
  Lock,
  Unlock,
  Users,
  Key,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Utensils,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Employee {
  id: string;
  fullnames: string;
  email: string;
  phone: string;
  Position: string;
  roleType: string;
  pos_pin: string | null;
  password?: string;
  Shops?: { id: string; name: string; relatedTo?: string | null };
  Restaurants?: { id: string; name: string; relatedTo?: string | null };
}

interface POSLoginScreenProps {
  onLogin: (employee: Employee) => void;
}

const POSLoginScreen: React.FC<POSLoginScreenProps> = ({ onLogin }) => {
  const { session } = useAuth();
  const { shopSession, activeBusiness } = useShopSession();
  const { color } = useThemeColor();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Flow & Keypad states
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // PIN setup states
  // 'enter_pin' | 'verify_password' | 'setup_pin' | 'confirm_pin'
  const [setupStep, setSetupStep] = useState<'enter_pin' | 'verify_password' | 'setup_pin' | 'confirm_pin'>('enter_pin');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  const currentBusinessId =
    shopSession?.shopId ||
    session?.restaurant_id ||
    session?.shop_id ||
    activeBusiness?.id;

  const currentBusinessName =
    shopSession?.shopName ||
    session?.restaurant_name ||
    session?.shop_name ||
    activeBusiness?.name;

  const isRestaurant = !!(session?.restaurant_id || shopSession?.isRestaurant);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await apiGet<{ orgEmployees: any[] }>('/api/queries/org-employees');
        const allEmployees = data.orgEmployees || [];

        // Apply robust business branch filtering
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
          if (!s) {
            return (
              emp.shop_id === currentBusinessId ||
              emp.restaurant_id === currentBusinessId
            );
          }
          const isSameId = currentBusinessId && s.id === currentBusinessId;
          const isSameName = mainName && s.name === mainName;
          const isChildBranch = mainName && s.relatedTo === mainName;
          const isParentBranch = mainRelatedTo && s.name === mainRelatedTo;
          const isSiblingBranch = mainRelatedTo && s.relatedTo === mainRelatedTo;

          return isSameId || isSameName || isChildBranch || isParentBranch || isSiblingBranch;
        });

        setEmployees(filtered);
      } catch (err: any) {
        console.error('Failed to load employees for POS login:', err);
        setError('Failed to load employee accounts. Please check connection.');
      } finally {
        setLoading(false);
      }
    };

    if (currentBusinessId || currentBusinessName) {
      fetchEmployees();
    }
  }, [currentBusinessId, currentBusinessName]);

  const handleKeypadPress = (val: string) => {
    setPinError(null);
    setAuthError(null);

    // Determine current active PIN buffer
    const currentBuffer = setupStep === 'confirm_pin' ? pinCode : (setupStep === 'setup_pin' ? pinCode : pinCode);

    if (val === 'C') {
      setPinCode('');
      return;
    }

    if (val === 'B') {
      setPinCode(prev => prev.slice(0, -1));
      return;
    }

    if (/^\d$/.test(val)) {
      if (currentBuffer.length < 5) {
        const nextPin = currentBuffer + val;
        setPinCode(nextPin);

        if (nextPin.length === 5) {
          if (setupStep === 'enter_pin' && selectedEmp) {
            // Check PIN
            if (selectedEmp.pos_pin === nextPin) {
              onLogin(selectedEmp);
            } else {
              setPinError('Incorrect PIN code. Try again.');
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
              setPinError('PIN codes do not match. Restarting PIN setup.');
              setPinCode('');
              setSetupStep('setup_pin');
            }
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
    } catch (err) {
      console.error('Password verification error:', err);
      setAuthError('Failed to verify password.');
    }
  };

  const savePinToDatabase = async (pin: string) => {
    if (!selectedEmp) return;
    try {
      setSavingPin(true);
      await apiPost('/api/mutations/update-employee-pin', {
        id: selectedEmp.id,
        pos_pin: pin,
      });

      // Update local employees list so they can unlock immediately next time
      setEmployees(prev =>
        prev.map(emp => (emp.id === selectedEmp.id ? { ...emp, pos_pin: pin } : emp))
      );

      // Log the employee in
      onLogin({ ...selectedEmp, pos_pin: pin });
    } catch (err) {
      console.error('Failed to save POS PIN:', err);
      setPinError('Failed to save PIN in the database. Please try again.');
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

    if (emp.pos_pin === null) {
      setSetupStep('verify_password');
    } else {
      setSetupStep('enter_pin');
    }
  };

  const handleBack = () => {
    if (setupStep === 'confirm_pin') {
      setSetupStep('setup_pin');
      setPinCode('');
    } else if (setupStep === 'setup_pin') {
      setSetupStep('verify_password');
      setPinCode('');
    } else {
      setSelectedEmp(null);
      setPinCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white font-sans overflow-hidden">
      {/* Dynamic theme light blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] transition-all duration-300"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[120px] transition-all duration-300"></div>

      <div className="w-full max-w-md p-8 bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl flex flex-col items-center">
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
          {isRestaurant ? (
            <Utensils className="h-7 w-7 text-white" />
          ) : (
            <ShoppingBag className="h-7 w-7 text-white" />
          )}
        </div>

        <h2 className="text-2xl font-black tracking-tight text-center">
          TERMINAL <span className="text-primary">LOCKED</span>
        </h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1 mb-8">
          {isRestaurant ? 'Restaurant' : 'Retail Shop'} POS Terminal
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-slate-400 font-medium">Loading staff profiles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-400 font-bold mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} size="sm">
              Retry
            </Button>
          </div>
        ) : !selectedEmp ? (
          /* Profile selection list */
          <div className="w-full space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-center mb-2">
              Select Your Profile
            </label>
            {employees.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-6 font-bold">
                No active staff found for this business branch.
              </p>
            ) : (
              <ScrollArea className="max-h-[280px] w-full pr-2">
                <div className="grid grid-cols-2 gap-4">
                  {employees.map(emp => {
                    const initials = emp.fullnames
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <button
                        key={emp.id}
                        onClick={() => handleSelectEmployee(emp)}
                        className="flex flex-col items-center p-4 rounded-2xl bg-slate-800/40 border border-slate-800/60 hover:border-primary/50 hover:bg-slate-800/80 transition-all duration-200 group"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-600 flex items-center justify-center text-sm font-black text-slate-300 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-200 mb-2 relative">
                          {initials}
                          {emp.pos_pin === null && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[9px] text-white font-extrabold shadow animate-bounce">
                              !
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-sm text-slate-200 group-hover:text-white truncate max-w-full text-center">
                          {emp.fullnames}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider group-hover:text-slate-400">
                          {emp.Position || emp.roleType || 'Staff'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          /* Profile lock screen keypad / Setup */
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleBack}
              className="text-xs font-bold text-slate-400 hover:text-white mb-4 flex items-center gap-1.5 self-start"
            >
              ← Back
            </button>

            <div className="text-center mb-6">
              {setupStep === 'verify_password' && (
                <>
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-wide">
                    Authentication Required
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    Setup PIN for {selectedEmp.fullnames}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[280px]">
                    To set up your security PIN, please enter your password.
                  </p>
                </>
              )}

              {setupStep === 'setup_pin' && (
                <>
                  <span className="text-xs text-primary font-bold uppercase tracking-wide">
                    PIN Setup
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">Create Security PIN</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Enter a new 5-digit code</p>
                </>
              )}

              {setupStep === 'confirm_pin' && (
                <>
                  <span className="text-xs text-primary font-bold uppercase tracking-wide">
                    PIN Setup
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">Confirm Security PIN</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Re-enter your 5-digit code</p>
                </>
              )}

              {setupStep === 'enter_pin' && (
                <>
                  <span className="text-xs text-slate-400 font-bold uppercase">Enter Security PIN for</span>
                  <h3 className="text-lg font-black text-primary mt-0.5">
                    {selectedEmp.fullnames}
                  </h3>
                </>
              )}
            </div>

            {setupStep === 'verify_password' ? (
              <div className="w-full space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Enter Account Password"
                    value={authPassword}
                    onChange={e => {
                      setAuthPassword(e.target.value);
                      setAuthError(null);
                    }}
                    className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 text-center"
                    onKeyDown={e => {
                      if (e.key === 'Enter') verifyPasswordAndProceed();
                    }}
                  />
                  {authError && (
                    <p className="text-[10px] font-bold text-red-400 text-center mt-2">{authError}</p>
                  )}
                </div>
                <Button
                  onClick={verifyPasswordAndProceed}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-2.5 rounded-xl shadow-lg"
                >
                  Verify Password
                </Button>
              </div>
            ) : (
              <>
                {/* PIN Code Circles */}
                <div className="flex gap-4 mb-6">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const isActive = pinCode.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                          isActive
                            ? 'bg-primary border-primary scale-110 shadow-md shadow-primary/35'
                            : 'border-slate-700 bg-transparent'
                        }`}
                      ></div>
                    );
                  })}
                </div>

                {pinError && (
                  <div className="text-xs font-bold text-red-400 mb-4 text-center max-w-[280px]">
                    {pinError}
                  </div>
                )}

                {savingPin && (
                  <div className="flex items-center justify-center gap-2 mb-4 text-slate-400 text-xs font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Saving PIN...
                  </div>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleKeypadPress(val)}
                      disabled={savingPin}
                      className="h-14 rounded-2xl bg-slate-800/40 border border-slate-800 text-lg font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white"
                    >
                      {val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('C')}
                    disabled={savingPin}
                    className="h-14 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-400 text-sm font-black hover:bg-red-600/20 transition-colors flex items-center justify-center active:scale-95"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    disabled={savingPin}
                    className="h-14 rounded-2xl bg-slate-800/40 border border-slate-800 text-lg font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('B')}
                    disabled={savingPin}
                    className="h-14 rounded-2xl bg-slate-800/40 border border-slate-800 text-base font-black hover:bg-slate-800 hover:border-slate-700 transition-colors flex items-center justify-center active:scale-95 text-white"
                  >
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
