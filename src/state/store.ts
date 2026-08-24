import { useSyncExternalStore } from 'react'
import type { Activity, CategoryId, Day, PackItem, ThemeId, Trip } from '../types'
import { photosDb, tripsDb } from '../lib/db'
import { addDays, nightsBetween, todayIso } from '../lib/date'
import { moveItem, uid } from '../lib/util'
import { DEFAULT_PACKING } from '../lib/catalog'

interface StoreState {
  loaded: boolean
  trips: Trip[]
}

let state: StoreState = { loaded: false, trips: [] }
const listeners = new Set<() => void>()

function setState(next: StoreState) {
  state = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return state
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function useTrip(id: string | null): Trip | undefined {
  const { trips } = useStore()
  return id ? trips.find((t) => t.id === id) : undefined
}

function sortTrips(trips: Trip[]): Trip[] {
  return trips
    .slice()
    .sort((a, b) =>
      a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : b.updatedAt - a.updatedAt,
    )
}

let initialized = false
export async function initStore(): Promise<void> {
  if (initialized) return
  initialized = true
  try {
    const trips = await tripsDb.all()
    setState({ loaded: true, trips: sortTrips(trips) })
  } catch {
    setState({ loaded: true, trips: [] })
  }
}

function persist(trip: Trip) {
  void tripsDb.put(trip)
}

/** 旅ひとつを書き換える。recipe は新しい Trip を返す純関数 */
export function updateTrip(id: string, recipe: (trip: Trip) => Trip): void {
  const current = state.trips.find((t) => t.id === id)
  if (!current) return
  const next: Trip = { ...recipe(current), updatedAt: Date.now() }
  persist(next)
  setState({ ...state, trips: sortTrips(state.trips.map((t) => (t.id === id ? next : t))) })
}

// ---------- 旅 ----------

export interface NewTripInput {
  title: string
  destination: string
  startDate: string
  endDate: string
  theme: ThemeId
  members: string[]
  withPackingTemplate: boolean
}

function emptyDay(date: string): Day {
  return { id: uid('day_'), date, title: '', memo: '', activities: [] }
}

export function createTrip(input: NewTripInput): string {
  const now = Date.now()
  const count = nightsBetween(input.startDate, input.endDate)
  const trip: Trip = {
    id: uid('trip_'),
    title: input.title.trim() || '名前のない旅',
    destination: input.destination.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    coverPhotoId: null,
    theme: input.theme,
    members: input.members,
    memo: '',
    days: Array.from({ length: count }, (_, i) => emptyDay(addDays(input.startDate, i))),
    packing: input.withPackingTemplate
      ? DEFAULT_PACKING.map((label) => ({ id: uid('pk_'), label, done: false }))
      : [],
    createdAt: now,
    updatedAt: now,
  }
  persist(trip)
  setState({ ...state, trips: sortTrips([trip, ...state.trips]) })
  return trip.id
}

export function duplicateTrip(id: string): string | null {
  const src = state.trips.find((t) => t.id === id)
  if (!src) return null
  const now = Date.now()
  const copy: Trip = {
    ...structuredClone(src),
    id: uid('trip_'),
    title: src.title + ' のコピー',
    createdAt: now,
    updatedAt: now,
  }
  copy.days = copy.days.map((d) => ({
    ...d,
    id: uid('day_'),
    activities: d.activities.map((a) => ({ ...a, id: uid('act_') })),
  }))
  copy.packing = copy.packing.map((p) => ({ ...p, id: uid('pk_'), done: false }))
  persist(copy)
  setState({ ...state, trips: sortTrips([copy, ...state.trips]) })
  return copy.id
}

export function collectPhotoIds(trip: Trip): string[] {
  const ids = new Set<string>()
  if (trip.coverPhotoId) ids.add(trip.coverPhotoId)
  for (const day of trip.days) {
    for (const act of day.activities) {
      for (const p of act.photoIds) ids.add(p)
    }
  }
  return [...ids]
}

export function deleteTrip(id: string): void {
  const trip = state.trips.find((t) => t.id === id)
  void tripsDb.remove(id)
  setState({ ...state, trips: state.trips.filter((t) => t.id !== id) })
  if (trip) {
    for (const photoId of collectPhotoIds(trip)) void photosDb.remove(photoId)
  }
}

export interface TripMetaPatch {
  title: string
  destination: string
  startDate: string
  endDate: string
  theme: ThemeId
  members: string[]
  memo: string
}

export function updateTripMeta(id: string, patch: TripMetaPatch): void {
  updateTrip(id, (trip) => {
    const count = nightsBetween(patch.startDate, patch.endDate)
    let days = trip.days.slice()
    while (days.length < count) days.push(emptyDay(''))
    if (days.length > count) days = days.slice(0, count)
    days = days.map((d, i) => ({ ...d, date: addDays(patch.startDate, i) }))
    return { ...trip, ...patch, title: patch.title.trim() || '名前のない旅', days }
  })
}

export function setCoverPhoto(id: string, photoId: string | null): void {
  updateTrip(id, (trip) => {
    if (trip.coverPhotoId && trip.coverPhotoId !== photoId) void photosDb.remove(trip.coverPhotoId)
    return { ...trip, coverPhotoId: photoId }
  })
}

// ---------- 日 ----------

export function updateDay(
  tripId: string,
  dayId: string,
  patch: Partial<Pick<Day, 'title' | 'memo'>>,
): void {
  updateTrip(tripId, (trip) => ({
    ...trip,
    days: trip.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
  }))
}

// ---------- 予定 ----------

export function emptyActivity(category: CategoryId = 'sight'): Activity {
  return {
    id: uid('act_'),
    time: '',
    endTime: '',
    title: '',
    category,
    place: '',
    memo: '',
    cost: null,
    url: '',
    photoIds: [],
  }
}

export function addActivity(tripId: string, dayId: string, activity: Activity): void {
  updateTrip(tripId, (trip) => ({
    ...trip,
    days: trip.days.map((d) =>
      d.id === dayId ? { ...d, activities: [...d.activities, activity] } : d,
    ),
  }))
}

export function updateActivity(tripId: string, dayId: string, activity: Activity): void {
  updateTrip(tripId, (trip) => ({
    ...trip,
    days: trip.days.map((d) =>
      d.id === dayId
        ? { ...d, activities: d.activities.map((a) => (a.id === activity.id ? activity : a)) }
        : d,
    ),
  }))
}

export function removeActivity(tripId: string, dayId: string, activityId: string): void {
  const trip = state.trips.find((t) => t.id === tripId)
  const target = trip?.days.find((d) => d.id === dayId)?.activities.find((a) => a.id === activityId)
  updateTrip(tripId, (t) => ({
    ...t,
    days: t.days.map((d) =>
      d.id === dayId ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) } : d,
    ),
  }))
  if (target) for (const p of target.photoIds) void photosDb.remove(p)
}

export function reorderActivities(tripId: string, dayId: string, from: number, to: number): void {
  updateTrip(tripId, (trip) => ({
    ...trip,
    days: trip.days.map((d) =>
      d.id === dayId ? { ...d, activities: moveItem(d.activities, from, to) } : d,
    ),
  }))
}

/** 予定を別の日へ移す */
export function moveActivityToDay(
  tripId: string,
  fromDayId: string,
  toDayId: string,
  activityId: string,
): void {
  if (fromDayId === toDayId) return
  updateTrip(tripId, (trip) => {
    const target = trip.days.find((d) => d.id === fromDayId)?.activities.find((a) => a.id === activityId)
    if (!target) return trip
    return {
      ...trip,
      days: trip.days.map((d) => {
        if (d.id === fromDayId) return { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
        if (d.id === toDayId) return { ...d, activities: [...d.activities, target] }
        return d
      }),
    }
  })
}

/** 時刻が入っている予定を昇順に並べ替える（未入力は末尾のまま） */
export function sortActivitiesByTime(tripId: string, dayId: string): void {
  updateTrip(tripId, (trip) => ({
    ...trip,
    days: trip.days.map((d) =>
      d.id === dayId
        ? {
            ...d,
            activities: d.activities
              .map((a, i) => ({ a, i }))
              .sort((x, y) => {
                if (!x.a.time && !y.a.time) return x.i - y.i
                if (!x.a.time) return 1
                if (!y.a.time) return -1
                return x.a.time.localeCompare(y.a.time) || x.i - y.i
              })
              .map((x) => x.a),
          }
        : d,
    ),
  }))
}

// ---------- 持ち物 ----------

export function addPackItem(tripId: string, label: string): void {
  const trimmed = label.trim()
  if (!trimmed) return
  updateTrip(tripId, (trip) => ({
    ...trip,
    packing: [...trip.packing, { id: uid('pk_'), label: trimmed, done: false }],
  }))
}

export function togglePackItem(tripId: string, itemId: string): void {
  updateTrip(tripId, (trip) => ({
    ...trip,
    packing: trip.packing.map((p) => (p.id === itemId ? { ...p, done: !p.done } : p)),
  }))
}

export function removePackItem(tripId: string, itemId: string): void {
  updateTrip(tripId, (trip) => ({ ...trip, packing: trip.packing.filter((p) => p.id !== itemId) }))
}

export function replacePacking(tripId: string, items: PackItem[]): void {
  updateTrip(tripId, (trip) => ({ ...trip, packing: items }))
}

// ---------- バックアップの読み込み ----------

export function importTrips(trips: Trip[]): number {
  const existing = new Set(state.trips.map((t) => t.id))
  const incoming = trips.map((t) => (existing.has(t.id) ? { ...t, id: uid('trip_') } : t))
  for (const t of incoming) persist(t)
  setState({ ...state, trips: sortTrips([...incoming, ...state.trips]) })
  return incoming.length
}

export function newTripDefaults(): NewTripInput {
  const start = addDays(todayIso(), 14)
  return {
    title: '',
    destination: '',
    startDate: start,
    endDate: addDays(start, 2),
    theme: 'sunset',
    members: [],
    withPackingTemplate: true,
  }
}
