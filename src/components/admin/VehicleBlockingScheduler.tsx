import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { API_BASE_URL } from '../../config';
import { Users, DollarSign, Plus, Trash2, ChevronLeft, CalendarX } from 'lucide-react';
import { formatTime } from '../common/TimePicker';

// ── Types ────────────────────────────────────────────────────────────────────

interface VehicleItem {
  _id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  capacity: number;
  pricePerHour: number;
  status?: string;
  imageUrl?: string;
  imageUrls?: string[];
}

interface BlockSlot {
  id: string;
  startDate: Date | null;
  startTime: string;
  endDate: Date | null;
  endTime: string;
}

interface SavedBlock {
  _id: string;
  vehicleId: string;
  start: string;   // ISO date string
  end:   string;   // ISO date string
  reason?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function newSlot(): BlockSlot {
  return { id: crypto.randomUUID(), startDate: new Date(), startTime: '08:00', endDate: null, endTime: '17:00' };
}

/** Build a Date treating the picked calendar date + HH:mm as UTC, so UTC display methods round-trip correctly. */
function toUTCDate(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0));
}

function utcHHmm(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function utcMMDDYYYY(d: Date): string {
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function formatSavedBlock(block: SavedBlock): string {
  const startD = new Date(block.start);
  const endD   = new Date(block.end);
  const startDateStr = utcMMDDYYYY(startD);
  const endDateStr   = utcMMDDYYYY(endD);
  const startTime    = formatTime(utcHHmm(startD));
  const endTime      = formatTime(utcHHmm(endD));
  if (startDateStr === endDateStr) {
    return `${startDateStr} ${startTime} – ${endTime}`;
  }
  return `${startDateStr} ${startTime} – ${endDateStr} ${endTime}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function VehicleBlockingScheduler() {
  const { token } = useAuth();

  // Step 1 – vehicle list
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);

  // Step 2 – blocking slots
  const [slots, setSlots] = useState<BlockSlot[]>([newSlot()]);
  const [savedBlocks, setSavedBlocks] = useState<SavedBlock[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch vehicles on mount ─────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    setVehiclesLoading(true);
    fetch(`${API_BASE_URL}/vehicles`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(data => setVehicles(data))
      .catch(() => toast.error('Failed to load vehicles'))
      .finally(() => setVehiclesLoading(false));
  }, [token]);

  // ── Fetch saved blocks when a vehicle is selected ───────────────────────

  useEffect(() => {
    if (!selectedVehicle || !token) return;
    setBlocksLoading(true);
    fetch(`${API_BASE_URL}/admin/vehicle-blocks/${selectedVehicle._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject('Failed'))
      .then(data => setSavedBlocks(data))
      .catch(() => toast.error('Failed to load existing blocks'))
      .finally(() => setBlocksLoading(false));
  }, [selectedVehicle, token]);

  // ── Slot row handlers ───────────────────────────────────────────────────

  function updateSlotStartDate(id: string, date: Date | null) {
    setSlots(prev => prev.map(s => {
      if (s.id !== id) return s;
      // Auto-default end date to same day when start date is first picked
      const endDate = s.endDate ?? date;
      return { ...s, startDate: date, endDate };
    }));
  }

  function updateSlotEndDate(id: string, date: Date | null) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, endDate: date } : s));
  }

  function updateSlotTime(id: string, field: 'startTime' | 'endTime', value: string) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function addSlot() {
    setSlots(prev => [...prev, newSlot()]);
  }

  function removeSlot(id: string) {
    setSlots(prev => prev.length === 1 ? prev : prev.filter(s => s.id !== id));
  }

  // ── Save new blocks ─────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedVehicle || !token) return;

    for (const s of slots) {
      if (!s.startDate || !s.endDate) {
        toast.error('Please select a start and end date for each slot.');
        return;
      }
      if (!s.startTime || !s.endTime) {
        toast.error('Please fill in all time fields.');
        return;
      }
      const startDt = toUTCDate(s.startDate, s.startTime);
      const endDt   = toUTCDate(s.endDate,   s.endTime);
      if (startDt >= endDt) {
        toast.error(`Start must be before end (${format(s.startDate, 'MM/dd/yyyy')} ${s.startTime}).`);
        return;
      }
    }

    const payload = slots.map(s => ({
      start: toUTCDate(s.startDate!, s.startTime).toISOString(),
      end:   toUTCDate(s.endDate!,   s.endTime).toISOString(),
      reason: '',
    }));

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vehicle-blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vehicleId: selectedVehicle._id, slots: payload }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save blocks');
      }

      const created: SavedBlock[] = await response.json();
      setSavedBlocks(prev =>
        [...prev, ...created].sort((a, b) => a.start.localeCompare(b.start))
      );
      setSlots([newSlot()]);
      toast.success(`${created.length} block${created.length > 1 ? 's' : ''} saved.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save blocks');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete a saved block ────────────────────────────────────────────────

  async function handleDelete(blockId: string) {
    if (!token) return;
    setDeletingId(blockId);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/vehicle-blocks/${blockId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to remove block');
      setSavedBlocks(prev => prev.filter(b => b._id !== blockId));
      toast.success('Block removed.');
    } catch {
      toast.error('Failed to remove block');
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-1">Vehicle Blocking Schedule</h2>
      <p className="text-sm text-gray-500 mb-5">
        Block specific dates and times for a vehicle so customers cannot book during those windows.
      </p>

      {/* ── Step 1: Vehicle list ── */}
      {!selectedVehicle ? (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">Select a vehicle to manage its blocked times:</p>

          {vehiclesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500" />
            </div>
          ) : vehicles.length === 0 ? (
            <p className="text-sm text-gray-500">No vehicles found.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {vehicles.map(vehicle => {
                const image = vehicle.imageUrls?.[0] ?? vehicle.imageUrl;
                return (
                  <button
                    key={vehicle._id}
                    onClick={() => { setSelectedVehicle(vehicle); setSlots([newSlot()]); setSavedBlocks([]); }}
                    className="w-full flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-colors text-left"
                  >
                    {image ? (
                      <img src={image} alt={vehicle.name} className="h-12 w-16 object-cover rounded flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-16 bg-gray-100 rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{vehicle.name}</p>
                      {(vehicle.make || vehicle.model) && (
                        <p className="text-xs text-gray-500">
                          {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />{vehicle.capacity}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <DollarSign className="h-3 w-3" />${vehicle.pricePerHour}/hr
                        </span>
                        {vehicle.status && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            vehicle.status === 'active' ? 'bg-green-100 text-green-700'
                            : vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                            {vehicle.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-gray-400 rotate-180 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ── Step 2: Date/time blocking for selected vehicle ── */
        <>
          {/* Selected vehicle header */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-brand-50 border border-brand-200 rounded-lg">
            <button
              onClick={() => setSelectedVehicle(null)}
              className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-800 font-medium flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="w-px h-5 bg-brand-200" />
            {(selectedVehicle.imageUrls?.[0] ?? selectedVehicle.imageUrl) && (
              <img
                src={selectedVehicle.imageUrls?.[0] ?? selectedVehicle.imageUrl}
                alt={selectedVehicle.name}
                className="h-8 w-12 object-cover rounded flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{selectedVehicle.name}</p>
              {(selectedVehicle.make || selectedVehicle.model) && (
                <p className="text-xs text-gray-500">
                  {[selectedVehicle.year, selectedVehicle.make, selectedVehicle.model].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>

          {/* Existing saved blocks */}
          {blocksLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-500" />
            </div>
          ) : savedBlocks.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Existing blocked slots</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {savedBlocks.map(block => (
                  <div key={block._id} className="flex items-center justify-between gap-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-red-800">
                      <CalendarX className="h-4 w-4 text-red-400 flex-shrink-0" />
                      <span>{formatSavedBlock(block)}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(block._id)}
                      disabled={deletingId === block._id}
                      className="text-red-400 hover:text-red-600 disabled:opacity-40 flex-shrink-0"
                      title="Remove block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New slots form */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Add new blocked slots</p>
            <div className="space-y-5">
              {slots.map((slot, idx) => (
                <div key={slot.id} className="flex flex-wrap items-end gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-400 pb-2 w-4 text-right flex-shrink-0">{idx + 1}.</span>

                  {/* Start group */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">Start</label>
                    <div className="flex items-end gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Date</label>
                        <DatePicker
                          selected={slot.startDate}
                          onChange={date => updateSlotStartDate(slot.id, date)}
                          minDate={new Date()}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Pick a date"
                          popperPlacement="bottom-start"
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
                          calendarClassName="shadow-lg border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Time</label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={e => updateSlotTime(slot.id, 'startTime', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                      </div>
                    </div>
                  </div>

                  <span className="text-gray-400 pb-2 text-lg">→</span>

                  {/* End group */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">End</label>
                    <div className="flex items-end gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Date</label>
                        <DatePicker
                          selected={slot.endDate}
                          onChange={date => updateSlotEndDate(slot.id, date)}
                          minDate={slot.startDate ?? new Date()}
                          dateFormat="MM/dd/yyyy"
                          placeholderText="Pick a date"
                          popperPlacement="bottom-start"
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
                          calendarClassName="shadow-lg border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Time</label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={e => updateSlotTime(slot.id, 'endTime', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeSlot(slot.id)}
                    disabled={slots.length === 1}
                    className="pb-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30"
                    title="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addSlot}
              className="mt-4 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 font-medium"
            >
              <Plus className="h-4 w-4" /> Add another slot
            </button>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <Button onClick={handleSave} disabled={saving} className="px-6">
              {saving ? 'Saving...' : 'Save Blocked Slots'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
