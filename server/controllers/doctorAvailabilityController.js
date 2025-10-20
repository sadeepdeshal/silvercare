const pool = require('../db');

// Ensure doctor_blocked_time table exists
async function ensureDoctorBlockedTimeTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS doctor_blocked_time (
      blocked_id SERIAL PRIMARY KEY,
      doctor_id INTEGER NOT NULL REFERENCES doctor(doctor_id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      all_day BOOLEAN NOT NULL DEFAULT FALSE,
      reason TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_doctor_blocked_time_doc_date ON doctor_blocked_time(doctor_id, date);
  `;
  await pool.query(sql);
}

// Helper: validate time range when not all-day
function validateTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return false;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) return false;
  return (eh * 60 + em) > (sh * 60 + sm);
}

// Compute end minutes given start and type (online=60m, physical=120m)
function computeEndMinutes(startHour, startMinute, type) {
  let endHour = startHour;
  let endMinute = startMinute + (type === 'physical' ? 120 : 60);
  endHour += Math.floor(endMinute / 60);
  endMinute = endMinute % 60;
  return { endHour, endMinute };
}

// Check overlap between [aStart,aEnd) and [bStart,bEnd)
function rangesOverlap(aStartMin, aEndMin, bStartMin, bEndMin) {
  return aStartMin < bEndMin && aEndMin > bStartMin;
}

// POST /api/doctor/:doctorId/blocked
// body: { date: 'YYYY-MM-DD', allDay?: boolean, startTime?: 'HH:MM', endTime?: 'HH:MM', reason?: string }
const createBlockedTime = async (req, res) => {
  const { doctorId } = req.params;
  const { date, allDay = false, startTime, endTime, reason } = req.body || {};
  try {
    await ensureDoctorBlockedTimeTable();

    // basic validation
    if (!date) return res.status(400).json({ success: false, error: 'date is required (YYYY-MM-DD)' });
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return res.status(400).json({ success: false, error: 'Invalid date format. Use YYYY-MM-DD' });

  // verify doctor exists (allow any status to manage availability)
  const doc = await pool.query('SELECT doctor_id, status FROM doctor WHERE doctor_id=$1', [doctorId]);
  if (doc.rows.length === 0) return res.status(404).json({ success: false, error: 'Doctor not found' });

    if (!allDay) {
      if (!validateTimeRange(startTime, endTime)) return res.status(400).json({ success: false, error: 'Invalid time range. Provide startTime and endTime as HH:MM with endTime > startTime' });
    }

    // Conflict check with confirmed appointments
    // Fetch appointments for that date
    const appts = await pool.query(
      `SELECT appointment_id, appointment_type, date_time
       FROM appointment
       WHERE doctor_id = $1 AND DATE(date_time) = $2 AND status IN ('confirmed')
       ORDER BY date_time`,
      [doctorId, date]
    );

    // Fetch non-expired temporary bookings as well
    let temps = { rows: [] };
    try {
      temps = await pool.query(
        `SELECT temp_booking_id, appointment_type, date_time
         FROM temporary_booking
         WHERE doctor_id = $1 AND DATE(date_time) = $2 AND expires_at > NOW()`,
        [doctorId, date]
      );
    } catch (_) { /* table may not exist in some deployments */ }

    const conflicts = [];

    if (allDay) {
      if (appts.rows.length > 0 || temps.rows.length > 0) {
        return res.status(409).json({ success: false, error: 'Cannot block entire day because there are existing bookings on that date', details: { appointments: appts.rows.length, temporary: temps.rows.length } });
      }
    } else {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const blockStartMin = sh * 60 + sm;
      const blockEndMin = eh * 60 + em;

      // Check against confirmed appointments
      for (const a of appts.rows) {
        const d = new Date(a.date_time);
        const ah = d.getHours();
        const am = d.getMinutes();
        const { endHour, endMinute } = computeEndMinutes(ah, am, a.appointment_type);
        const apptStart = ah * 60 + am;
        const apptEnd = endHour * 60 + endMinute;
        if (rangesOverlap(blockStartMin, blockEndMin, apptStart, apptEnd)) {
          conflicts.push({ type: 'appointment', id: a.appointment_id, start: `${ah}:${am.toString().padStart(2,'0')}` });
        }
      }

      // Check against temp bookings
      for (const t of temps.rows) {
        const d = new Date(t.date_time);
        const th = d.getHours();
        const tm = d.getMinutes();
        const { endHour, endMinute } = computeEndMinutes(th, tm, t.appointment_type);
        const tempStart = th * 60 + tm;
        const tempEnd = endHour * 60 + endMinute;
        if (rangesOverlap(blockStartMin, blockEndMin, tempStart, tempEnd)) {
          conflicts.push({ type: 'temporary_booking', id: t.temp_booking_id });
        }
      }

      if (conflicts.length > 0) {
        return res.status(409).json({ success: false, error: 'Selected time range overlaps with existing bookings', conflicts });
      }
    }

    // Optional: prevent overlapping with existing blocked ranges
    const existingBlocks = await pool.query(
      `SELECT * FROM doctor_blocked_time WHERE doctor_id=$1 AND date=$2`,
      [doctorId, date]
    );
    if (!allDay) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const newStart = sh * 60 + sm;
      const newEnd = eh * 60 + em;
      for (const b of existingBlocks.rows) {
        if (b.all_day) {
          return res.status(409).json({ success: false, error: 'Day already blocked' });
        }
        const [bsH, bsM] = (b.start_time || '00:00').split(':').map(Number);
        const [beH, beM] = (b.end_time || '00:00').split(':').map(Number);
        const bStart = bsH * 60 + bsM;
        const bEnd = beH * 60 + beM;
        if (rangesOverlap(newStart, newEnd, bStart, bEnd)) {
          return res.status(409).json({ success: false, error: 'Overlaps with an existing blocked time range' });
        }
      }
    } else if (existingBlocks.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'There are already blocked ranges on this date; remove them before blocking entire day' });
    }

    // Insert block
    const insert = await pool.query(
      `INSERT INTO doctor_blocked_time (doctor_id, date, start_time, end_time, all_day, reason)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [doctorId, date, allDay ? null : startTime, allDay ? null : endTime, allDay, reason || null]
    );

    res.json({ success: true, blocked: insert.rows[0] });
  } catch (err) {
    console.error('Error creating blocked time:', err);
    res.status(500).json({ success: false, error: 'Error creating blocked time' });
  }
};

// GET /api/doctor/:doctorId/blocked?from=YYYY-MM-DD&to=YYYY-MM-DD
const listBlockedTimes = async (req, res) => {
  const { doctorId } = req.params;
  const { from, to } = req.query;
  try {
    await ensureDoctorBlockedTimeTable();
    let where = 'doctor_id = $1';
    const params = [doctorId];
    if (from) { params.push(from); where += ` AND date >= $${params.length}`; }
    if (to) { params.push(to); where += ` AND date <= $${params.length}`; }
    const rows = await pool.query(`SELECT * FROM doctor_blocked_time WHERE ${where} ORDER BY date, start_time NULLS FIRST`, params);
    res.json({ success: true, blocked: rows.rows, count: rows.rows.length });
  } catch (err) {
    console.error('Error listing blocked times:', err);
    res.status(500).json({ success: false, error: 'Error listing blocked times' });
  }
};

// DELETE /api/doctor/:doctorId/blocked/:blockedId
const deleteBlockedTime = async (req, res) => {
  const { doctorId, blockedId } = req.params;
  try {
    await ensureDoctorBlockedTimeTable();
    const del = await pool.query('DELETE FROM doctor_blocked_time WHERE blocked_id=$1 AND doctor_id=$2 RETURNING *', [blockedId, doctorId]);
    if (del.rows.length === 0) return res.status(404).json({ success: false, error: 'Blocked time not found' });
    res.json({ success: true, deleted: del.rows[0] });
  } catch (err) {
    console.error('Error deleting blocked time:', err);
    res.status(500).json({ success: false, error: 'Error deleting blocked time' });
  }
};

module.exports = {
  ensureDoctorBlockedTimeTable,
  createBlockedTime,
  listBlockedTimes,
  deleteBlockedTime,
};
