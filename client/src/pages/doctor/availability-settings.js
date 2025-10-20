import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/navbar';
import DoctorSidebar from '../../components/doctor_sidebar';
import { useAuth } from '../../context/AuthContext';
import { getDoctorAppointments } from '../../services/doctorMeetingApi';
import { getDoctorByUserId, listBlockedTimes, createBlockedTime } from '../../services/doctorAvailabilityApi';
import styles from '../../components/css/doctor/availability.module.css';

// Format date as YYYY-MM-DD in LOCAL time to avoid UTC shifting previous/next day
const formatDate = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function AvailabilitySettings() {
  const { currentUser } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [doctorId, setDoctorId] = useState(null);

  // Config
  const dayStartHour = 8; // 08:00
  const dayEndHour = 20; // 20:00
  const slotMinutes = 30;

  // Month state
  const startOfMonth = (date) => { const d = new Date(date); d.setDate(1); d.setHours(0,0,0,0); return d; };
  const [monthBase, setMonthBase] = useState(startOfMonth(new Date()));
  const monthYearTitle = useMemo(() => monthBase.toLocaleDateString(undefined, { month:'long', year:'numeric'}), [monthBase]);
  const buildMonthMatrix = (base) => {
    const first = startOfMonth(base);
    const firstDay = new Date(first);
    const offset = first.getDay();
    firstDay.setDate(firstDay.getDate() - offset);
    const days = [];
    for (let i=0;i<42;i++) { const d = new Date(firstDay); d.setDate(firstDay.getDate() + i); days.push(d); }
    return days;
  };
  const monthDays = useMemo(() => buildMonthMatrix(monthBase), [monthBase]);
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));

  // Form
  const [date, setDate] = useState(formatDate(new Date()));
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [reason, setReason] = useState('');

  // Data
  const [blocked, setBlocked] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [durationType, setDurationType] = useState('online');
  const [selection, setSelection] = useState(null);

  // Doctor lookup
  useEffect(() => {
    const loadDoctor = async () => {
      if (!currentUser?.user_id) return;
      try {
        const info = await getDoctorByUserId(currentUser.user_id);
        if (info?.doctor?.doctor_id) setDoctorId(info.doctor.doctor_id);
      } catch (e) {
        console.error(e);
        setError('Failed to load doctor information');
      }
    };
    loadDoctor();
  }, [currentUser]);

  const startOfMonthFn = (date) => { const d = new Date(date); d.setDate(1); d.setHours(0,0,0,0); return d; };

  const loadBlocked = async () => {
    if (!doctorId) return;
    try {
      setLoading(true);
      setError(null);
      const firstOfMonth = startOfMonthFn(monthBase);
      const monthGridStart = new Date(firstOfMonth); monthGridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
      const monthGridEnd = new Date(monthGridStart); monthGridEnd.setDate(monthGridStart.getDate() + 41);
      const res = await listBlockedTimes(doctorId, { from: formatDate(monthGridStart), to: formatDate(monthGridEnd) });
      setBlocked(res.blocked || []);
    } catch (e) {
      console.error(e);
      setError('Failed to load blocked times');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    if (!doctorId) return;
    try {
      const res = await getDoctorAppointments(doctorId);
      const all = res.appointments || res || [];
      const firstOfMonth = startOfMonthFn(monthBase);
      const monthGridStart = new Date(firstOfMonth); monthGridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
      const monthGridEnd = new Date(monthGridStart); monthGridEnd.setDate(monthGridStart.getDate() + 41);
      const fromTs = monthGridStart.getTime(); const toTs = monthGridEnd.getTime();
      const filtered = all.filter(a => { const t = new Date(a.date_time).getTime(); return t >= fromTs && t <= (toTs + 24*60*60*1000 - 1); });
      setAppointments(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadBlocked(); loadAppointments(); }, [doctorId, monthBase]);

  const validateForm = () => {
    if (!date) return 'Please select a date';
    if (!allDay) {
      if (!startTime || !endTime) return 'Please select start and end time';
      if (endTime <= startTime) return 'End time must be after start time';
    }
    return null;
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setFormError(null);
    const err = validateForm(); if (err) { setFormError(err); return; }
    try {
      setCreating(true);
      const payload = allDay ? { date, allDay, reason } : { date, allDay, startTime, endTime, reason };
      const res = await createBlockedTime(doctorId, payload);
      if (!res?.success) { setFormError(res?.error || 'Failed to create block'); }
      else { await loadBlocked(); await loadAppointments(); }
    } catch (e) {
      const apiMsg = e?.response?.data?.error; setFormError(apiMsg || e.message || 'Failed to create block');
    } finally { setCreating(false); }
  };

  const groupedByDate = useMemo(() => {
    const map = {}; for (const b of blocked) { const key = b.date?.slice(0,10) || b.date; (map[key] ||= []).push(b); } return map;
  }, [blocked]);

  const minutesFromMidnight = (timeStr) => { if (!timeStr) return 0; const [h,m] = timeStr.split(':').map(Number); return h*60 + m; };
  const toTimeStr = (h, m) => `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  const computeEnd = (startDate, type) => { const d = new Date(startDate); const mins = type === 'physical' ? 120 : 60; d.setMinutes(d.getMinutes() + mins); return d; };
  const computeEndByType = (timeStr, type) => { const [h,m] = timeStr.split(':').map(Number); const mins = type === 'physical' ? 120 : 60; const endMins = h*60 + m + mins; return toTimeStr(Math.floor(endMins/60), endMins%60); };

  const createFromSelection = async () => {
    if (!selection?.date || !selection?.start || !selection?.end) return;
    try { setCreating(true); setFormError(null);
      const payload = { date: selection.date, allDay: false, startTime: selection.start, endTime: selection.end, reason };
      const res = await createBlockedTime(doctorId, payload);
      if (!res?.success) throw new Error(res?.error || 'Failed');
      await loadBlocked(); await loadAppointments(); setSelection(null);
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to create'); }
    finally { setCreating(false); }
  };

  const blockAllDay = async (d) => {
    try { setCreating(true);
      const res = await createBlockedTime(doctorId, { date: formatDate(d), allDay: true, reason });
      if (!res?.success) throw new Error(res?.error || 'Failed');
      await loadBlocked(); await loadAppointments();
    } catch (e) { alert(e?.response?.data?.error || e.message || 'Failed to block day'); }
    finally { setCreating(false); }
  };

  return (
    <div className={styles.page}>
      <DoctorSidebar onToggleCollapse={setSidebarCollapsed} />
      <div className={styles.content} style={{ marginLeft: sidebarCollapsed ? 80 : 260 }}>
        <Navbar />
        <div className={styles.container}>
          <div className={styles.headerBar}>
            <div>
              <div className={styles.title}>Availability</div>
              <div className={styles.subtitle}>Block times you are unavailable. Patients cannot book during blocked periods.</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <span className={styles.badge}><span className={`${styles.dot} ${styles.dotBlocked}`}></span>Blocked</span>
              <span className={styles.badge}><span className={`${styles.dot} ${styles.dotBusy}`}></span>Existing appointment</span>
              <span className={styles.badge}><span className={`${styles.dot} ${styles.dotSelect}`}></span>Selection</span>
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.toolbarRight}>
              <label className={styles.hint}>Preview duration:</label>
              <select className={styles.btn} value={durationType} onChange={e => setDurationType(e.target.value)}>
                <option value="online">Online (60m)</option>
                <option value="physical">Physical (120m)</option>
              </select>
              {loading && <span>Loading…</span>}
              {error && <span style={{ color: 'crimson' }}>{error}</span>}
            </div>
          </div>

          <form onSubmit={onCreate} className={`${styles.card} ${styles.formCard}`}>
            <h3 style={{ marginTop: 0 }}>Create blocked time</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className={styles.field} style={{ alignSelf: 'end' }}>
                <label>All day</label>
                <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
              </div>
              {!allDay && (
                <>
                  <div className={styles.field}>
                    <label>Start time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className={styles.field}>
                    <label>End time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                  </div>
                </>
              )}
              <div className={`${styles.field} ${styles.grow}`}>
                <label>Reason (optional)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Rounds, Personal, Meeting" />
              </div>
              <div style={{ alignSelf: 'end' }}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create block'}</button>
              </div>
            </div>
            {formError && <div style={{ color: 'crimson', marginTop: 8 }}>{formError}</div>}
            <div className={styles.hint}>Note: If the time overlaps with existing appointments or holds, creation will be rejected.</div>
          </form>

          <div className={`${styles.card} ${styles.twoCol}`}>
            <div className={styles.leftCard}>
              <div className={styles.sectionTitle}>📅 Select Date</div>
              <div className={styles.monthHeader}>
                <button className={styles.btn} onClick={() => setMonthBase(new Date(monthBase.getFullYear(), monthBase.getMonth()-1, 1))}>◀</button>
                <div className={styles.monthTitle}>{monthYearTitle}</div>
                <button className={styles.btn} onClick={() => setMonthBase(new Date(monthBase.getFullYear(), monthBase.getMonth()+1, 1))}>▶</button>
              </div>
              <div className={styles.dowRow}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className={styles.dowCell}>{d}</div>
                ))}
              </div>
              <div className={styles.monthGrid}>
                {monthDays.map((d,idx) => {
                  const dk = formatDate(d);
                  const inMonth = d.getMonth() === monthBase.getMonth();
                  const isToday = dk === formatDate(new Date());
                  const dayBlocked = blocked.filter(b => b.date?.slice(0,10) === dk);
                  const classNames = [styles.dayCell];
                  if (!inMonth) classNames.push(styles.dayCellInactive);
                  if (isToday) classNames.push(styles.dayCellToday);
                  if (selectedDay === dk) classNames.push(styles.selectedOutline);
                  return (
                    <div key={idx} className={classNames.join(' ')} onClick={() => setSelectedDay(dk)}>
                      <div className={styles.dayNumber}>{d.getDate()}</div>
                      <div className={styles.pillRow}>
                        {dayBlocked.length > 0 && <span className={`${styles.pill} ${styles.pillBlocked}`}>Blocked</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.legend}>
                <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swatchAvail}`}></span>Available</div>
                <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swatchSelected}`}></span>Selected</div>
                <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swatchBlocked}`}></span>Blocked</div>
              </div>
            </div>

            <div className={styles.rightCard}>
              <div className={styles.sectionTitle}>🕒 Select Time</div>
              <div className={styles.slotGrid}>
                {Array.from({ length: ((dayEndHour - dayStartHour) * 60) / slotMinutes }, (_, i) => {
                  const minutes = i * slotMinutes + dayStartHour * 60;
                  const h = Math.floor(minutes / 60);
                  const m = minutes % 60;
                  const timeStr = toTimeStr(h, m);
                  const isBlocked = (() => {
                    const dk = selectedDay;
                    const dayBlocked = (groupedByDate[dk] || []);
                    if (dayBlocked.some(b => b.all_day)) return true;
                    const blockedOverlap = dayBlocked.some(b => {
                      if (!b.start_time || !b.end_time) return false;
                      const sMin = minutesFromMidnight(timeStr);
                      const eMin = minutesFromMidnight(computeEndByType(timeStr, durationType));
                      const bs = minutesFromMidnight(b.start_time);
                      const be = minutesFromMidnight(b.end_time);
                      return (sMin < be && eMin > bs);
                    });
                    if (blockedOverlap) return true;
                    const sMin = minutesFromMidnight(timeStr);
                    const eMin = minutesFromMidnight(computeEndByType(timeStr, durationType));
                    const dayAppts = appointments.filter(a => formatDate(new Date(a.date_time)) === dk);
                    return dayAppts.some(a => {
                      const start = new Date(a.date_time);
                      const end = computeEnd(start, a.appointment_type);
                      const as = start.getHours()*60 + start.getMinutes();
                      const ae = end.getHours()*60 + end.getMinutes();
                      return (sMin < ae && eMin > as);
                    });
                  })();
                  const isSelected = selection && selection.date === selectedDay && selection.start === timeStr;
                  const classNames = [styles.slotBtn];
                  if (isBlocked) classNames.push(styles.slotBlocked);
                  if (isSelected) classNames.push(styles.slotSelected);
                  return (
                    <div
                      key={i}
                      className={classNames.join(' ')}
                      onClick={() => {
                        if (isBlocked) return;
                        setSelection({ date: selectedDay, start: timeStr, end: computeEndByType(timeStr, durationType) });
                      }}
                    >
                      {timeStr}
                    </div>
                  );
                })}
              </div>
              <div className={styles.legend}>
                <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swatchAvail}`}></span>Available</div>
                <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swatchSelected}`}></span>Selected</div>
                <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swatchBlocked}`}></span>Blocked</div>
              </div>
              <div className={styles.actionsRow}>
                {selection && selection.date === selectedDay && selection.start && selection.end && (
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={createFromSelection} disabled={creating}>Block {selection.start}–{selection.end}</button>
                )}
                <button className={styles.btn} onClick={() => blockAllDay(new Date(selectedDay))}>Block whole day</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
