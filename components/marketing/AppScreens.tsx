'use client'

import {
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Gift,
  MapPin,
  Package,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'

/**
 * Inner screen content for PhoneMockup. Each component renders a stylised
 * fake app screen — used until real Washlee screenshots are dropped into
 * /public/marketing/app-screen-*.png.
 */

const StatusBar = () => (
  <div className="flex items-center justify-between px-5 pt-2 text-[10px] font-semibold text-dark/80">
    <span>9:41</span>
    <div className="flex items-center gap-1">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-dark/70" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-dark/70" />
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-dark/40" />
      <span className="ml-1 inline-block h-2 w-3 rounded-sm border border-dark/60" />
    </div>
  </div>
)

export function HomeAppScreen() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#E8FFFB] via-white to-white">
      <StatusBar />
      <div className="px-5 pt-7">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-deep">Good morning</p>
        <p className="text-base font-bold text-dark">Welcome back, Sam</p>
      </div>

      <div className="mx-5 mt-4 rounded-2xl bg-primary p-4 text-white shadow-[0_12px_24px_-12px_rgba(72,201,176,0.6)]">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider opacity-80">
          <Sparkles size={12} /> Quick book
        </div>
        <p className="mt-1 text-lg font-bold leading-tight">Schedule a pickup<br />in under a minute</p>
        <button className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-primary-deep">
          Book pickup <ChevronRight size={12} />
        </button>
      </div>

      <div className="mx-5 mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-white p-3">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-mint">
            <Truck size={13} className="text-primary-deep" />
          </div>
          <p className="text-[11px] font-bold text-dark">Standard</p>
          <p className="text-[10px] text-gray">$7.50/kg · next day</p>
        </div>
        <div className="rounded-xl border border-line bg-white p-3">
          <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-mint">
            <Sparkles size={13} className="text-primary-deep" />
          </div>
          <p className="text-[11px] font-bold text-dark">Express</p>
          <p className="text-[10px] text-gray">$12.50/kg · same day</p>
        </div>
      </div>

      <div className="mx-5 mt-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray">Recent</p>
        <div className="space-y-1.5">
          {[
            { id: 'WL-2204', status: 'Delivered', tone: 'bg-mint text-primary-deep' },
            { id: 'WL-2198', status: 'Washing', tone: 'bg-blue-50 text-blue-700' },
          ].map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2">
              <div>
                <p className="text-[11px] font-bold text-dark">Order #{o.id}</p>
                <p className="text-[9px] text-gray">3.2 kg · Carlton</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${o.tone}`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-line bg-white px-5 py-3">
        <div className="flex items-center justify-around text-[9px] font-semibold text-gray">
          {[
            { icon: Package, label: 'Home', active: true },
            { icon: Calendar, label: 'Bookings' },
            { icon: Gift, label: 'Rewards' },
            { icon: Bell, label: 'Inbox' },
          ].map((t) => (
            <div key={t.label} className={`flex flex-col items-center gap-0.5 ${t.active ? 'text-primary-deep' : ''}`}>
              <t.icon size={14} />
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TrackingAppScreen() {
  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar />
      <div className="px-5 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-deep">Tracking · WL-2204</p>
        <p className="text-base font-bold text-dark">On the way to you</p>
      </div>

      {/* Faked map area */}
      <div className="relative mx-5 mt-3 h-32 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-mint via-white to-[#F0F7FF]">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(72,201,176,0.25), transparent 40%), radial-gradient(circle at 75% 30%, rgba(72,201,176,0.15), transparent 35%)' }} />
        {/* Roads */}
        <div className="absolute inset-x-4 top-1/2 h-[2px] bg-line" />
        <div className="absolute inset-y-3 left-1/2 w-[2px] bg-line" />
        {/* Markers */}
        <div className="absolute left-[20%] top-[30%] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow">
          <Truck size={11} />
        </div>
        <div className="absolute right-[18%] bottom-[18%] flex h-5 w-5 items-center justify-center rounded-full bg-dark text-white shadow">
          <MapPin size={11} />
        </div>
      </div>

      <div className="mx-5 mt-4 rounded-2xl border border-line bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-primary-deep font-bold">JM</div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-dark">James M. is on the way</p>
            <p className="text-[10px] text-gray">Arriving ~ 12 min · Carlton</p>
          </div>
          <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-primary-deep">Pro</span>
        </div>
      </div>

      <div className="mx-5 mt-3 space-y-2">
        {[
          { label: 'Order received', done: true },
          { label: 'Pickup confirmed', done: true },
          { label: 'En route to pickup', done: true, current: true },
          { label: 'Washing in progress', done: false },
          { label: 'Out for delivery', done: false },
        ].map((step) => (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full ${
                step.done ? 'bg-primary text-white' : 'border border-line bg-white text-gray-soft'
              }`}
            >
              {step.done ? <Check size={10} /> : <span className="block h-1.5 w-1.5 rounded-full bg-line" />}
            </div>
            <p className={`text-[10px] ${step.current ? 'font-bold text-dark' : step.done ? 'text-dark' : 'text-gray'}`}>{step.label}</p>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-auto mb-4 flex gap-2">
        <button className="flex-1 rounded-full border border-line bg-white py-2 text-[11px] font-bold text-dark">Message Pro</button>
        <button className="flex-1 rounded-full bg-primary py-2 text-[11px] font-bold text-white">View receipt</button>
      </div>
    </div>
  )
}

export function RewardsAppScreen() {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#F4FFFD] to-white">
      <StatusBar />
      <div className="px-5 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-deep">Wash Club · Free</p>
        <p className="text-base font-bold text-dark">You’re Silver</p>
      </div>

      <div className="mx-5 mt-3 rounded-2xl bg-gradient-to-br from-dark to-dark-soft p-4 text-white shadow-[0_18px_36px_-18px_rgba(20,32,30,0.55)]">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Silver</span>
          <Star size={14} className="text-[#F5C26B]" />
        </div>
        <p className="mt-3 text-2xl font-bold leading-none">1,240 <span className="text-xs font-medium opacity-70">pts</span></p>
        <p className="mt-1 text-[10px] opacity-70">760 pts to Gold tier</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[62%] rounded-full bg-primary" />
        </div>
      </div>

      <div className="mx-5 mt-4">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray">Available perks</p>
        <div className="space-y-1.5">
          {[
            { title: '$15 wash credit', sub: 'Costs 1,000 pts' },
            { title: 'Free Express upgrade', sub: 'Costs 500 pts' },
            { title: 'Birthday bonus pack', sub: 'Members only' },
          ].map((p, i) => (
            <div key={p.title} className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mint">
                  <Gift size={12} className="text-primary-deep" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-dark">{p.title}</p>
                  <p className="text-[9px] text-gray">{p.sub}</p>
                </div>
              </div>
              <button className={`rounded-full px-2 py-1 text-[10px] font-bold ${i === 0 ? 'bg-primary text-white' : 'border border-line text-dark'}`}>
                {i === 0 ? 'Redeem' : 'View'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-auto mb-4 rounded-xl border border-dashed border-primary/40 bg-mint/40 p-2 text-center">
        <p className="text-[10px] font-semibold text-primary-deep">No subscription · No fees · Earn on every order</p>
      </div>
    </div>
  )
}

export function BookingAppScreen() {
  return (
    <div className="flex h-full flex-col bg-white">
      <StatusBar />
      <div className="px-5 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-deep">New booking</p>
        <p className="text-base font-bold text-dark">When should we come?</p>
      </div>

      <div className="mx-5 mt-3 rounded-2xl border border-line bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">Pickup</p>
        <p className="mt-0.5 text-[11px] font-bold text-dark">Tomorrow · Tue 10–12pm</p>
      </div>

      <div className="mx-5 mt-2 grid grid-cols-3 gap-2">
        {['10–12', '12–2', '2–4'].map((slot, i) => (
          <button
            key={slot}
            className={`rounded-xl border py-2 text-[10px] font-bold ${
              i === 0 ? 'border-primary bg-mint text-primary-deep' : 'border-line bg-white text-dark'
            }`}
          >
            {slot}pm
          </button>
        ))}
      </div>

      <div className="mx-5 mt-3 rounded-2xl border border-line bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">Estimated load</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[11px] font-bold text-dark">Medium bag · ~ 6 kg</p>
          <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-primary-deep">$45</span>
        </div>
        <p className="mt-1 text-[9px] text-gray">$75 minimum applies — final price after weigh-in.</p>
      </div>

      <div className="mx-5 mt-3 rounded-2xl border border-line bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray">Care notes</p>
        <p className="mt-1 text-[11px] text-dark/80">No fabric softener, hang-dry the gym kit.</p>
      </div>

      <div className="mx-5 mt-auto mb-4">
        <button className="w-full rounded-full bg-primary py-2.5 text-[11px] font-bold text-white shadow-[0_12px_24px_-12px_rgba(72,201,176,0.7)]">
          Confirm pickup
        </button>
      </div>
    </div>
  )
}
