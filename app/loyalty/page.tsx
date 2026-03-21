'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { Gift, Star, Zap, Download } from 'lucide-react'

export default function Loyalty() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-accent py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6">WASH Club</h1>
          <p className="text-2xl mb-8 opacity-95 max-w-2xl mx-auto">
            Our loyalty program that works just like a stamp card! Earn points on every wash and unlock free rewards.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">How WASH Club Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card hoverable>
              <div className="flex justify-center mb-6">
                <div className="bg-primary/20 rounded-full p-6">
                  <Star size={40} className="text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-dark text-center mb-4">Earn Points</h3>
              <p className="text-gray text-center">
                You'll earn 1 point for every kilogram of laundry you wash with us. Start collecting immediately!
              </p>
            </Card>

            <Card hoverable>
              <div className="flex justify-center mb-6">
                <div className="bg-primary/20 rounded-full p-6">
                  <Zap size={40} className="text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-dark text-center mb-4">Collect & Redeem</h3>
              <p className="text-gray text-center">
                Once you've collected 10 points, you'll get a free wash on us! That's free laundry service worth up to $39.
              </p>
            </Card>

            <Card hoverable>
              <div className="flex justify-center mb-6">
                <div className="bg-primary/20 rounded-full p-6">
                  <Gift size={40} className="text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-dark text-center mb-4">Birthday Bonus</h3>
              <p className="text-gray text-center">
                You'll also receive a free wash on your birthday as a little treat from us. Year after year!
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Wanna Join? */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <h2 className="text-4xl font-bold text-dark mb-6">Wanna be a WASH Club member?</h2>
            <p className="text-lg text-gray mb-8 leading-relaxed">
              Just download the Washlee app, register, and start earning points instantly! You can easily track your points and rewards by logging into the app with your email and password.
            </p>

            <div className="border-l-4 border-primary pl-6 mb-8">
              <h3 className="text-2xl font-bold text-dark mb-4">How do I join?</h3>
              <p className="text-gray text-lg mb-4">
                So you want in, hey? Well, it ain't that easy. You can't just magically download the app and register your details and expect to be granted entry into our super exclusive WASH Club. Wait. Actually, that's exactly all you need to do.
              </p>
              <p className="text-gray text-lg font-semibold">
                So go and do it so you can enjoy free Washlee stuff and laundry deals!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-primary text-white">
                  Join WASH Club Now
                </Button>
              </Link>
              <a 
                href="https://apps.apple.com/app/washlee" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-dark text-white rounded-lg hover:shadow-lg transition font-semibold"
              >
                <Download size={20} />
                Download App
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">WASH Club Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-dark mb-4">🎯 1 Point per Kilogram</h3>
              <p className="text-gray leading-relaxed">
                Every kilogram of laundry you drop off earns you 1 WASH Club point. Keep earning and watch your rewards grow!
              </p>
            </div>

            <div className="bg-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-dark mb-4">🎁 Free Wash at 10 Points</h3>
              <p className="text-gray leading-relaxed">
                Collect just 10 points and redeem a free wash service! No minimum order, no hidden fees—just completely free laundry.
              </p>
            </div>

            <div className="bg-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-dark mb-4">🎂 Birthday Bonus</h3>
              <p className="text-gray leading-relaxed">
                Get a free wash on or within 14 days before/after your birthday. Our gift to you for being a loyal Washlee customer!
              </p>
            </div>

            <div className="bg-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-dark mb-4">📱 Track in Real-Time</h3>
              <p className="text-gray leading-relaxed">
                Log into your WASH Club account anytime to view your current points balance, rewards history, and upcoming offers.
              </p>
            </div>

            <div className="bg-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-dark mb-4">💳 No Fees Ever</h3>
              <p className="text-gray leading-relaxed">
                No registration fee, activation fee, or maintenance fee. Joining WASH Club is completely free—start earning today!
              </p>
            </div>

            <div className="bg-light rounded-xl p-8">
              <h3 className="text-2xl font-bold text-dark mb-4">🌟 Exclusive Deals</h3>
              <p className="text-gray leading-relaxed">
                WASH Club members get access to special promotions, early access to new services, and member-only discounts!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark mb-8">WASH Club Terms & Conditions</h2>
          
          <div className="bg-white rounded-xl p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Points & Rewards</h3>
              <p className="text-gray leading-relaxed">
                WASH points will be awarded to customers for full-price laundry services only, unless expressly specified. Points will not be awarded in association with any other offer or discount, unless expressly specified. Points are not transferable or redeemable for cash.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Technical Errors</h3>
              <p className="text-gray leading-relaxed">
                While every effort will be made to ensure WASH points are correctly awarded, Washlee takes no responsibility for technical errors associated with crediting points onto the WASH account.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Point Expiration</h3>
              <p className="text-gray leading-relaxed">
                The WASH points accrued balance on an account will expire if the WASH account remains inactive for a period of 6 months or more. If there is no activity on your account for 24 consecutive months, the membership account will be deactivated and any remaining points will expire. Activity includes earning points through purchases as well as redeeming points for rewards.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Lost or Stolen Cards</h3>
              <p className="text-gray leading-relaxed">
                In the case of a lost or stolen card, customers may continue to use the same membership number by logging into their WASH account on the app or web. If you're worried about security, you may email support@washlee.com to report your lost/stolen card. Every effort will be made to transfer your full points balance, however Washlee will not be responsible for any points lost in the transfer. Cards reported as lost or stolen will immediately be cancelled and rendered inactive.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Birthday Bonus</h3>
              <p className="text-gray leading-relaxed">
                WASH members are entitled to one (1) free wash on the day or within fourteen (14) days before or after their date of birth. Members will need to present valid identification confirming their birth date. This free wash cannot be redeemed on any other day regardless of external circumstances. This free wash is non-transferable and cannot be exchanged for cash. WASH members may only redeem their Free Birthday Wash with at least 1 point in their account. Each member is entitled to redeem only one (1) free Birthday Wash per calendar year.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Password Reset</h3>
              <p className="text-gray leading-relaxed">
                Should a password be lost or forgotten, WASH members should go to the registered members section where they can click on 'Forgot your password' and enter their email address to reset their password.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Program Changes</h3>
              <p className="text-gray leading-relaxed">
                Washlee reserves the right to alter the terms and conditions of the WASH member program at any time. Any such changes will be communicated to members via email or through updates on the website/mobile apps. Continued use of the services indicates acceptance of updated terms.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Eligibility</h3>
              <p className="text-gray leading-relaxed">
                By registering for the WASH loyalty program, you confirm that you are at least 18 years of age and possess a valid identification document. Washlee reserves the right to refuse service or cancel rewards in cases of suspected fraudulent activity or violations of these terms and conditions.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Non-Transferable</h3>
              <p className="text-gray leading-relaxed">
                WASH points are non-transferable and may not be shared, sold, assigned, or transferred to any other member or account. Points are non-redeemable for cash and are valid only within the registered country of the membership.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-dark mb-3">Account Suspension</h3>
              <p className="text-gray leading-relaxed">
                Washlee reserves the right to suspend or terminate any member's account at its sole discretion if it believes the account is being used in violation of these terms or any applicable laws.
              </p>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 border-l-4 border-primary">
              <p className="text-gray text-sm">
                Information collected from members at the time of signing up to the WASH member program is subject to our Privacy Policy. For more information, please visit our privacy page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-accent py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join WASH Club today and start collecting points on every wash. Your first free wash is closer than you think!
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-primary hover:bg-light">
              Join WASH Club
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
