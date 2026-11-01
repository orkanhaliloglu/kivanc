import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Profile, WorkoutPlanMap, DailyRecordsMap, DailyRecordData, WorkoutPlan } from './types';
import { defaultPlans, iso, buildWeeklySummary } from './constants';
import { getSupabase, getSupabaseConfig } from './config';
import { LoginGate } from './components/LoginGate';
import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { DayDetail } from './components/DayDetail';
import { MonthlyStats } from './components/MonthlyStats';
import { ShareSection } from './components/ShareSection';
import { SelfPlanPanel } from './components/SelfPlanPanel';
import { PasswordPanel } from './components/PasswordPanel';
import { AdminPanel } from './components/AdminPanel';
import { Toast } from './components/Toast';

const LOCAL_STORAGE_PREFIX = 'ritim_records_';
const LOCAL_STORAGE_PLANS_PREFIX = 'ritim_plans_';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<WorkoutPlanMap>(structuredClone(defaultPlans));
  const [records, setRecords] = useState<DailyRecordsMap>({});
  const [viewDate, setViewDate] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => iso(new Date()));
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<string>('● Bulutta saklanır');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Panels visibility
  const [showSelfPlan, setShowSelfPlan] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const toastTimerRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  const isAdmin = profile?.role === 'admin';

  // Load avatar if user has avatar
  const updateAvatar = useCallback(async (user: Profile | null) => {
    if (!user) {
      setAvatarUrl(null);
      return;
    }
    const avatarEmails = new Set(['mamioksuz1@gmail.com', 'haliloglukivanc5@gmail.com']);
    if (!user.email || !avatarEmails.has(user.email.toLowerCase())) {
      setAvatarUrl(null);
      return;
    }
    const client = getSupabase();
    if (!client) return;
    try {
      const { data, error } = await client.storage
        .from('ritim-avatars')
        .createSignedUrl(`${user.id}/avatar.jpeg`, 3600);
      if (!error && data?.signedUrl) {
        setAvatarUrl(data.signedUrl);
      } else {
        setAvatarUrl(null);
      }
    } catch {
      setAvatarUrl(null);
    }
  }, []);

  // Load plans for a specific user
  const loadUserPlans = useCallback(async (userId: string) => {
    const basePlans = structuredClone(defaultPlans);

    // Try reading cached plans from localStorage first
    const cachedPlansStr = localStorage.getItem(`${LOCAL_STORAGE_PLANS_PREFIX}${userId}`);
    if (cachedPlansStr) {
      try {
        const cached = JSON.parse(cachedPlansStr);
        Object.assign(basePlans, cached);
      } catch {
        // ignore
      }
    }

    const client = getSupabase();
    if (client && userId) {
      try {
        const { data, error } = await client
          .from('user_workout_plans')
          .select('weekday,plan_type,label,items')
          .eq('user_id', userId);

        if (!error && data) {
          data.forEach((p) => {
            basePlans[p.weekday] = {
              type: p.plan_type,
              label: p.label,
              items: p.items,
            };
          });
        }
      } catch {
        // fallback to basePlans
      }
    }

    setPlans(basePlans);
  }, []);

  // Load records for a specific user
  const loadUserRecords = useCallback(
    async (userId: string) => {
      let initialRecords: DailyRecordsMap = {};

      // Try reading cached records
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
      if (cached) {
        try {
          initialRecords = JSON.parse(cached);
        } catch {
          // ignore
        }
      }

      const client = getSupabase();
      if (client && userId) {
        try {
          const { data, error } = await client
            .from('daily_records')
            .select('record_date,data')
            .eq('user_id', userId);

          if (!error && data) {
            data.forEach((row) => {
              const d = row.data || {};
              initialRecords[row.record_date] = {
                done: Array.isArray(d.done) ? d.done : [],
                sleepGoal: !!d.sleepGoal,
                bed: d.bed || '',
                lessonTitle: d.lessonTitle || '',
                lesson: d.lesson || '',
                note: d.note || '',
              };
            });
          }
        } catch {
          // keep cached
        }
      }

      setRecords(initialRecords);
    },
    []
  );

  // Load all profiles (if admin)
  const loadProfiles = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      setProfiles([
        {
          id: 'kivanc-id',
          email: 'haliloglukivanc5@gmail.com',
          full_name: 'Kıvanç Haliloğlu',
          role: 'athlete',
        },
        {
          id: 'mami-id',
          email: 'mamioksuz1@gmail.com',
          full_name: 'Muhammed Öksüz',
          role: 'athlete',
        },
      ]);
      return;
    }

    try {
      const { data, error } = await client
        .from('profiles')
        .select('id,email,full_name,role')
        .order('full_name');

      if (!error && data) {
        setProfiles(data as Profile[]);
      }
    } catch {
      // ignore
    }
  }, []);

  // Enter session
  const enterSession = useCallback(
    async (userProfile: Profile) => {
      setProfile(userProfile);
      const isAdm = userProfile.role === 'admin';
      setActiveUserId(userProfile.id);
      setShowAdmin(false);
      setShowPassword(false);
      setShowSelfPlan(false);

      await loadUserPlans(userProfile.id);
      if (isAdm) {
        await loadProfiles();
      }
      await loadUserRecords(userProfile.id);
      await updateAvatar(userProfile);
    },
    [loadUserPlans, loadProfiles, loadUserRecords, updateAvatar]
  );

  // Check initial Supabase session
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      if (data.session) {
        client
          .from('profiles')
          .select('id,email,full_name,role')
          .eq('id', data.session.user.id)
          .single()
          .then(({ data: profileData, error }) => {
            if (!error && profileData) {
              enterSession(profileData as Profile);
            } else {
              const fallback: Profile = {
                id: data.session.user.id,
                email: data.session.user.email || '',
                full_name:
                  (data.session.user.user_metadata?.full_name as string) ||
                  (data.session.user.email ? data.session.user.email.split('@')[0] : 'Kullanıcı'),
                role: 'athlete',
              };
              enterSession(fallback);
            }
          });
      }
    });

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
        setActiveUserId(null);
        setRecords({});
        setAvatarUrl(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [enterSession]);

  // Demo athlete login
  const handleDemoAthlete = () => {
    const demoProfile: Profile = {
      id: 'kivanc-demo-id',
      email: 'haliloglukivanc5@gmail.com',
      full_name: 'Kıvanç Haliloğlu',
      role: 'athlete',
    };
    enterSession(demoProfile);
    showToast('Kıvanç hesabı ile giriş yapıldı.');
  };

  // Demo admin login
  const handleDemoAdmin = () => {
    const demoAdmin: Profile = {
      id: 'admin-demo-id',
      email: 'admin@ritim.app',
      full_name: 'Antrenör / Yönetici',
      role: 'admin',
    };
    enterSession(demoAdmin);
    showToast('Yönetici hesabı ile giriş yapıldı.');
  };

  // Logout
  const handleLogout = async () => {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch {
        // ignore
      }
    }
    setProfile(null);
    setActiveUserId(null);
    setRecords({});
    setAvatarUrl(null);
    showToast('Çıkış yapıldı.');
  };

  // Switch athlete (for admin)
  const handleSelectAthlete = async (userId: string) => {
    setActiveUserId(userId);
    await loadUserPlans(userId);
    await loadUserRecords(userId);
    const target = profiles.find((p) => p.id === userId);
    await updateAvatar(target || null);
    showToast(`${target?.full_name || target?.email || 'Sporcu'} kayıtları yüklendi.`);
  };

  // Save record to DB and localStorage
  const saveRecordToCloud = useCallback(
    async (dateStr: string, recordData: DailyRecordData) => {
      if (!activeUserId) return;
      setSaveState('● Kaydediliyor');

      // Update localStorage cache
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${activeUserId}`);
        const currentCached = cached ? JSON.parse(cached) : {};
        currentCached[dateStr] = recordData;
        localStorage.setItem(
          `${LOCAL_STORAGE_PREFIX}${activeUserId}`,
          JSON.stringify(currentCached)
        );
      } catch {
        // ignore
      }

      const client = getSupabase();
      if (!client) {
        setSaveState('● Cihazda saklandı');
        return;
      }

      try {
        const { error } = await client.from('daily_records').upsert(
          {
            user_id: activeUserId,
            record_date: dateStr,
            data: recordData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,record_date' }
        );

        if (error) {
          setSaveState('● Kaydedilemedi');
          showToast(`Kayıt kaydedilemedi: ${error.message}`);
        } else {
          setSaveState('● Buluta kaydedildi');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Bağlantı hatası';
        setSaveState('● Kaydedilemedi');
        showToast(`Hata: ${msg}`);
      }
    },
    [activeUserId, showToast]
  );

  // Update current day's record
  const handleUpdateRecord = useCallback(
    (updates: Partial<DailyRecordData>) => {
      setRecords((prev) => {
        const current = prev[selectedDate] || {
          done: [],
          sleepGoal: false,
          bed: '',
          lessonTitle: '',
          lesson: '',
          note: '',
        };
        const updated: DailyRecordData = { ...current, ...updates };

        // Schedule save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(() => {
          saveRecordToCloud(selectedDate, updated);
        }, 300);

        return { ...prev, [selectedDate]: updated };
      });
    },
    [selectedDate, saveRecordToCloud]
  );

  // Toggle exercise checkbox
  const handleToggleExercise = useCallback(
    (exerciseId: string, checked: boolean) => {
      setRecords((prev) => {
        const current = prev[selectedDate] || {
          done: [],
          sleepGoal: false,
          bed: '',
          lessonTitle: '',
          lesson: '',
          note: '',
        };
        let newDone = current.done.filter((id) => id !== exerciseId);
        if (checked) {
          newDone = [...newDone, exerciseId];
        }
        const updated: DailyRecordData = { ...current, done: newDone };
        saveRecordToCloud(selectedDate, updated);
        return { ...prev, [selectedDate]: updated };
      });
    },
    [selectedDate, saveRecordToCloud]
  );

  // Save athlete's personal plan
  const handleSaveSelfPlan = async (weekday: number, plan: WorkoutPlan): Promise<boolean> => {
    if (!profile) return false;

    // Update state
    setPlans((prev) => ({
      ...prev,
      [weekday]: plan,
    }));

    // Update localStorage cache
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PLANS_PREFIX}${profile.id}`);
      const plansObj = cached ? JSON.parse(cached) : {};
      plansObj[weekday] = plan;
      localStorage.setItem(
        `${LOCAL_STORAGE_PLANS_PREFIX}${profile.id}`,
        JSON.stringify(plansObj)
      );
    } catch {
      // ignore
    }

    const client = getSupabase();
    if (!client) {
      showToast('Programınız kaydedildi.');
      return true;
    }

    try {
      const { error } = await client.from('user_workout_plans').upsert(
        {
          user_id: profile.id,
          weekday,
          plan_type: plan.type,
          label: plan.label,
          items: plan.items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,weekday' }
      );

      if (error) {
        showToast(`Plan kaydedilemedi: ${error.message}`);
        return false;
      }
      showToast('Programınız buluta kaydedildi.');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bağlantı hatası';
      showToast(`Hata: ${msg}`);
      return false;
    }
  };

  // Clear athlete's plan for that day (Rest day)
  const handleClearSelfPlan = async (weekday: number): Promise<boolean> => {
    return handleSaveSelfPlan(weekday, {
      type: 'mobility',
      label: 'Dinlenme günü',
      items: [],
    });
  };

  // Admin saves plan for an athlete
  const handleSaveAdminPlan = async (
    targetUserId: string,
    weekday: number,
    plan: WorkoutPlan
  ): Promise<boolean> => {
    if (targetUserId === activeUserId) {
      setPlans((prev) => ({ ...prev, [weekday]: plan }));
    }

    const client = getSupabase();
    if (!client) return true;

    try {
      const { error } = await client.from('user_workout_plans').upsert(
        {
          user_id: targetUserId,
          weekday,
          plan_type: plan.type,
          label: plan.label,
          items: plan.items,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,weekday' }
      );
      return !error;
    } catch {
      return false;
    }
  };

  // Top header share action (copies summary)
  const handleTopShare = async () => {
    const summaryText = buildWeeklySummary(selectedDate, plans, records);
    try {
      await navigator.clipboard.writeText(summaryText);
      showToast('Haftalık özet panoya kopyalandı');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = summaryText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Haftalık özet kopyalandı');
    }
  };

  // Month navigation
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setSelectedDate(iso(now));
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const currentRecord = records[selectedDate] || {
    done: [],
    sleepGoal: false,
    bed: '',
    lessonTitle: '',
    lesson: '',
    note: '',
  };

  // If user is not logged in, show LoginGate
  if (!profile) {
    return (
      <>
        <LoginGate
          onSuccess={enterSession}
          onDemoAthleteLogin={handleDemoAthlete}
          onDemoAdminLogin={handleDemoAdmin}
        />
        <Toast message={toastMessage} />
      </>
    );
  }

  return (
    <main className="app" id="trackerApp">
      <Header
        profile={profile}
        isAdmin={isAdmin}
        onToggleSelfPlan={() => setShowSelfPlan((p) => !p)}
        onToggleAdmin={() => setShowAdmin((p) => !p)}
        onTogglePassword={() => setShowPassword((p) => !p)}
        onShare={handleTopShare}
        onGoToday={handleGoToday}
        onLogout={handleLogout}
      />

      {/* Athlete Personal Plan Panel */}
      {showSelfPlan && (
        <SelfPlanPanel
          plans={plans}
          onClose={() => setShowSelfPlan(false)}
          onSavePlan={handleSaveSelfPlan}
          onClearPlan={handleClearSelfPlan}
        />
      )}

      {/* Password Change Panel */}
      {showPassword && (
        <PasswordPanel
          onClose={() => setShowPassword(false)}
          onNotice={showToast}
        />
      )}

      {/* Admin Panel (if admin) */}
      {showAdmin && isAdmin && (
        <AdminPanel
          profiles={profiles}
          selectedUserId={activeUserId || profile.id}
          plans={plans}
          onClose={() => setShowAdmin(false)}
          onSelectUser={handleSelectAthlete}
          onRefreshProfiles={loadProfiles}
          onSaveAdminPlan={handleSaveAdminPlan}
          onNotice={showToast}
        />
      )}

      <div className="layout">
        <CalendarView
          viewDate={viewDate}
          selectedDate={selectedDate}
          plans={plans}
          records={records}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={setSelectedDate}
        />

        <aside className="aside">
          <DayDetail
            selectedDate={selectedDate}
            plans={plans}
            record={currentRecord}
            avatarUrl={avatarUrl}
            saveState={saveState}
            onUpdateRecord={handleUpdateRecord}
            onToggleExercise={handleToggleExercise}
          />

          <MonthlyStats
            viewDate={viewDate}
            selectedDate={selectedDate}
            plans={plans}
            records={records}
          />

          <ShareSection
            selectedDate={selectedDate}
            plans={plans}
            records={records}
            onNotice={showToast}
          />
        </aside>
      </div>

      <div className="footer">
        Kişisel takip alanın · <strong>Ritim</strong>
      </div>

      <Toast message={toastMessage} />
    </main>
  );
};
export default App;
