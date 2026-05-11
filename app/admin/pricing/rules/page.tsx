'use client'

import { useState, useEffect } from 'react'
import { useRequireAdminAccess } from '@/lib/useAdminAccess'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import {
  calculatePrice,
  getPricingPreview,
  getSurgePricingInfo,
  applyCoupon,
  isCurrentRushHour,
  isPeakDay,
} from '@/lib/pricing-engine'
import { DollarSign, TrendingUp, Clock, AlertCircle, Zap } from 'lucide-react'

interface PricingRule {
  name: string
  value: number
  unit: string
  description: string
}

export default function PricingRulesPage() {
  const { checkingAdminAccess } = useRequireAdminAccess()
  const [activeTab, setActiveTab] = useState<'rules' | 'preview' | 'surge'>('rules')
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    {
      name: 'Base Price',
      value: 3.0,
      unit: '$/kg',
      description: 'Price per kilogram of laundry',
    },
    {
      name: 'Minimum Order',
      value: 5.0,
      unit: '$',
      description: 'Minimum order value',
    },
    {
      name: 'Distance Rate',
      value: 0.5,
      unit: '$/km',
      description: 'Additional charge per kilometer',
    },
    {
      name: 'Rush Hour Surcharge',
      value: 0.2,
      unit: '%',
      description: 'Additional charge during peak hours (7-9am, 12-1pm, 5-7pm)',
    },
    {
      name: 'Weekend Surcharge',
      value: 0.3,
      unit: '%',
      description: 'Additional charge on Friday-Sunday',
    },
    {
      name: 'Rain Surcharge',
      value: 0.15,
      unit: '%',
      description: 'Additional charge during rain',
    },
    {
      name: 'Snow Surcharge',
      value: 0.3,
      unit: '%',
      description: 'Additional charge during snow',
    },
    {
      name: 'Express Delivery',
      value: 0.5,
      unit: '%',
      description: 'Premium for same-day delivery',
    },
    {
      name: 'Delicate Care',
      value: 0.3,
      unit: '%',
      description: 'Premium for delicate fabric handling',
    },
    {
      name: 'Downtown Zone',
      value: 0.1,
      unit: '%',
      description: 'Premium for downtown locations',
    },
    {
      name: 'Rural Zone',
      value: 0.2,
      unit: '%',
      description: 'Premium for rural locations',
    },
  ])

  const [previewWeight, setPreviewWeight] = useState(5)
  const [previewDistance, setPreviewDistance] = useState(5)
  const [previewService, setPreviewService] = useState<'standard' | 'express' | 'delicate' | 'comforter'>('standard')
  const [previewZone, setPreviewZone] = useState<'downtown' | 'suburban' | 'rural'>('suburban')
  const [previewWeather, setPreviewWeather] = useState<'clear' | 'rain' | 'snow'>('clear')
  const [previewPrice, setPreviewPrice] = useState<any>(null)

  useEffect(() => {
    if (activeTab === 'preview') {
      const pricing = calculatePrice({
        weightKg: previewWeight,
        serviceType: previewService,
        distanceKm: previewDistance,
        isRushHour: isCurrentRushHour(),
        weatherCondition: previewWeather,
        locationZone: previewZone,
        isPeakDay: isPeakDay(),
      })
      setPreviewPrice(pricing)
    }
  }, [previewWeight, previewDistance, previewService, previewZone, previewWeather, activeTab])

  if (checkingAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">Pricing Rules & Configuration</h1>
          <p className="text-gray">Manage dynamic pricing factors and test calculations</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b-2 border-gray/20">
          {(['rules', 'preview', 'surge'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-semibold transition ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray hover:text-dark'
              }`}
            >
              {tab === 'rules' ? 'Pricing Rules' : tab === 'preview' ? 'Price Preview' : 'Surge Pricing'}
            </button>
          ))}
        </div>

        {/* Pricing Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-dark mb-4">Current Pricing Rules</h2>
              <div className="space-y-3">
                {pricingRules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray/5 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-dark">{rule.name}</p>
                      <p className="text-sm text-gray">{rule.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {rule.value}
                        <span className="text-lg">{rule.unit}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-mint">
              <div className="flex items-start gap-3">
                <AlertCircle size={24} className="text-primary mt-1" />
                <div>
                  <p className="font-semibold text-dark">Dynamic Pricing Formula</p>
                  <p className="text-sm text-gray mt-1">
                    Final Price = (Base Price × Demand Multiplier × Zone Multiplier) + Distance Surcharge + Weather
                    Surcharge + Service Premium + Rush Hour Adjustment
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-bold text-dark mb-4">Service Premiums</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray">Standard</span>
                    <span className="font-semibold text-dark">$0.00 (base)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Express Delivery</span>
                    <span className="font-semibold text-dark">+50%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Delicate Care</span>
                    <span className="font-semibold text-dark">+30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Comforter Service</span>
                    <span className="font-semibold text-dark">+40%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-dark mb-4">Zone Multipliers</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray">Downtown</span>
                    <span className="font-semibold text-dark">+10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Suburban</span>
                    <span className="font-semibold text-dark">Standard (1x)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray">Rural</span>
                    <span className="font-semibold text-dark">+20%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Price Preview Tab */}
        {activeTab === 'preview' && previewPrice && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-dark mb-6">Price Calculator</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={previewWeight}
                    onChange={(e) => setPreviewWeight(parseFloat(e.target.value) || 0)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Distance (km)</label>
                  <input
                    type="number"
                    value={previewDistance}
                    onChange={(e) => setPreviewDistance(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Service Type</label>
                  <select
                    value={previewService}
                    onChange={(e) => setPreviewService(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  >
                    <option value="standard">Standard</option>
                    <option value="express">Express Delivery</option>
                    <option value="delicate">Delicate Care</option>
                    <option value="comforter">Comforter Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Location Zone</label>
                  <select
                    value={previewZone}
                    onChange={(e) => setPreviewZone(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray/20 focus:border-primary"
                  >
                    <option value="downtown">Downtown (+10%)</option>
                    <option value="suburban">Suburban (Standard)</option>
                    <option value="rural">Rural (+20%)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-dark mb-2">Weather Condition</label>
                  <div className="flex gap-2">
                    {(['clear', 'rain', 'snow'] as const).map((weather) => (
                      <button
                        key={weather}
                        onClick={() => setPreviewWeather(weather)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          previewWeather === weather
                            ? 'bg-primary text-white'
                            : 'bg-gray/10 text-dark hover:bg-gray/20'
                        }`}
                      >
                        {weather === 'clear' ? '☀️ Clear' : weather === 'rain' ? '🌧️ Rain' : '❄️ Snow'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-primary/5 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-dark mb-4">Price Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray">Base Price ({previewWeight}kg × $3.00)</span>
                    <span className="font-semibold text-dark">${previewPrice.breakdown.base.toFixed(2)}</span>
                  </div>
                  {previewPrice.breakdown.demand > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Demand Multiplier (×{previewPrice.demandMultiplier.toFixed(2)})</span>
                      <span className="font-semibold text-dark">${previewPrice.breakdown.demand.toFixed(2)}</span>
                    </div>
                  )}
                  {previewPrice.breakdown.weather > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Weather Surcharge ({previewWeather})</span>
                      <span className="font-semibold text-dark">${previewPrice.breakdown.weather.toFixed(2)}</span>
                    </div>
                  )}
                  {previewPrice.breakdown.distance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Distance Surcharge ({previewDistance}km × $0.50)</span>
                      <span className="font-semibold text-dark">${previewPrice.breakdown.distance.toFixed(2)}</span>
                    </div>
                  )}
                  {previewPrice.breakdown.service > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray">Service Premium ({previewService})</span>
                      <span className="font-semibold text-dark">${previewPrice.breakdown.service.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray/20 pt-3 flex justify-between">
                    <span className="font-bold text-dark">Total</span>
                    <span className="text-2xl font-bold text-primary">${previewPrice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Surge Pricing Tab */}
        {activeTab === 'surge' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <Zap size={32} className="text-primary" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-dark">Surge Pricing Status</h2>
                  <p className="text-gray">Current demand and pricing multipliers</p>
                </div>
              </div>

              {(() => {
                const surgeInfo = getSurgePricingInfo()
                return (
                  <div className="space-y-4">
                    <div
                      className={`p-6 rounded-lg ${
                        surgeInfo.isRushHour
                          ? 'bg-red-50 border-2 border-red-200'
                          : surgeInfo.isPeakDay
                            ? 'bg-orange-50 border-2 border-orange-200'
                            : 'bg-green-50 border-2 border-green-200'
                      }`}
                    >
                      <p className="text-2xl font-bold text-dark">{surgeInfo.message}</p>
                      <p className="text-lg font-semibold text-primary mt-2">
                        Multiplier: {surgeInfo.multiplier.toFixed(2)}x
                      </p>
                      {surgeInfo.discount && (
                        <p className="text-green-700 font-semibold mt-2">✓ {surgeInfo.discount}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4 bg-gray/5">
                        <Clock size={24} className="text-primary mb-2" />
                        <p className="text-sm font-semibold text-dark">Rush Hours</p>
                        <p className="text-xs text-gray">7-9am, 12-1pm, 5-7pm</p>
                        <p className="text-lg font-bold text-primary mt-2">+20% surge</p>
                      </Card>

                      <Card className="p-4 bg-gray/5">
                        <TrendingUp size={24} className="text-primary mb-2" />
                        <p className="text-sm font-semibold text-dark">Peak Days</p>
                        <p className="text-xs text-gray">Friday-Sunday</p>
                        <p className="text-lg font-bold text-primary mt-2">+30% surge</p>
                      </Card>

                      <Card className="p-4 bg-gray/5">
                        <DollarSign size={24} className="text-green-600 mb-2" />
                        <p className="text-sm font-semibold text-dark">Off-Peak</p>
                        <p className="text-xs text-gray">Monday-Thursday, 9-5</p>
                        <p className="text-lg font-bold text-green-600 mt-2">-10% discount</p>
                      </Card>
                    </div>

                    <div className="mt-6 p-4 bg-mint rounded-lg">
                      <p className="text-sm text-dark">
                        <strong>Smart Scheduling:</strong> Customers are encouraged to schedule deliveries during
                        off-peak hours to receive automatic discounts. This helps optimize demand distribution and
                        ensures faster service during peak times.
                      </p>
                    </div>
                  </div>
                )
              })()}
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
