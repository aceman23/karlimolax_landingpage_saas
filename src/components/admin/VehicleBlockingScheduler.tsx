import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { API_BASE_URL } from '../../config';
import { Users, DollarSign, Plus, Trash2, ChevronLeft, CalendarX } from 'lucide-react';

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
  date: Date | null;
  startTime: string;
  endTime: string;
}

interface SavedBlock {
  _id: string;
  vehicleId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function newSlot(): BlockSlot {
  return { id: crypto.randomUUID(), date: new Date(), startTime: '08:00', endTime: '17:00' };
}

function formatDisplayDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
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

  function updateSlotDate(id: string, date: Date | null) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, date } : s));
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
      if (!s.date) {
        toast.error('Please select a date for each slot.');
        return;
      }
      if (!s.startTime || !s.endTime) {
        toast.error('Please fill in all time fields.');
        return;
      }
      if (s.startTime >= s.endTime) {
        toast.error(`Start time must be before end time (${format(s.date, 'MM/dd/yyyy')}).`);
        return;
      }
    }

    const payload = slots.map(s => ({
      date: format(s.date!, 'yyyy-MM-dd'),
      startTime: s.startTime,
      endTime: s.endTime,
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
        [...prev, ...created].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
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
                      <span className="font-medium">{formatDisplayDate(block.date)}</span>
                      <span className="text-red-500">·</span>
                      <span>{block.startTime} – {block.endTime}</span>
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
            <div className="space-y-4">
              {slots.map((slot, idx) => (
                <div key={slot.id} className="flex flex-wrap items-end gap-3">
                  <span className="text-xs text-gray-400 pb-2 w-4 text-right flex-shrink-0">{idx + 1}.</span>

                  {/* Calendar date picker */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Date</label>
                    <DatePicker
                      selected={slot.date}
                      onChange={date => updateSlotDate(slot.id, date)}
                      minDate={new Date()}
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Pick a date"
                      popperPlacement="bottom-start"
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
                      calendarClassName="shadow-lg border border-gray-200 rounded-lg"
                    />
                  </div>

                  {/* Start time */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">Start time</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={e => updateSlotTime(slot.id, 'startTime', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>

                  {/* End time */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">End time</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={e => updateSlotTime(slot.id, 'endTime', e.target.value)}
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
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
