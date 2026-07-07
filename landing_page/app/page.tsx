'use client';

import { useState } from 'react';
import {
  FileText,
  Flame,
  PlusCircle,
  Search as SearchIcon,
  BookOpen,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import PublicHeader from '../components/public/PublicHeader';
import PublicButton from '../components/public/PublicButton';
import PublicInput from '../components/public/PublicInput';
import MemorialCard from '../components/public/MemorialCard';

export default function Home() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const memorials = [
    {
      name: 'Margaret Eleanor Thompson',
      years: '1942 — 2024',
      relationship: 'Mother',
      excerpt:
        'Passed away peacefully surrounded by family. A devoted mother, grandmother, and community leader who will be deeply missed.',
      image:
        'https://images.unsplash.com/photo-1614367936673-51c6daef6af9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      candles: 156,
    },
    {
      name: 'William Robert Anderson',
      years: '1938 — 2024',
      relationship: 'Father',
      excerpt:
        'Passed away peacefully at home after a long and fulfilling life. Beloved husband, father, and proud veteran.',
      image:
        'https://images.unsplash.com/photo-1617746038583-9726a81f24b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      candles: 142,
    },
    {
      name: 'Dorothy Mae Collins',
      years: '1945 — 2024',
      relationship: 'Grandmother',
      excerpt:
        'Passed away peacefully with her loving family by her side. A cherished grandmother who brought joy to everyone she met.',
      image:
        'https://images.unsplash.com/photo-1736081204918-784bb5609e26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      candles: 189,
    },
    {
      name: 'James Michael Foster',
      years: '1951 — 2024',
      relationship: 'Uncle',
      excerpt:
        'Passed away peacefully after a brief illness. A dedicated teacher and mentor who inspired generations of students.',
      image:
        'https://images.unsplash.com/photo-1552915170-73c2330ae617?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      candles: 98,
    },
    {
      name: 'Yuki Tanaka',
      years: '1943 — 2024',
      relationship: 'Grandmother',
      excerpt:
        'Passed away peacefully at home. A gentle soul who dedicated her life to her family and community.',
      image:
        'https://images.unsplash.com/photo-1761580525127-392880387ca4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      candles: 167,
    },
    {
      name: 'Marcus James Williams',
      years: '1947 — 2024',
      relationship: 'Father',
      excerpt:
        'Passed away peacefully surrounded by his children. A devoted father, community activist, and beloved friend to many.',
      image:
        'https://images.unsplash.com/photo-1736896165046-5df757614776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      candles: 203,
    },
  ];

  const trendingTributes = [...memorials]
    .sort((a, b) => b.candles - a.candles)
    .slice(0, 3);

  const recentMemorials = memorials.slice(0, 3);
  const featuredMemorials = memorials.slice(0, 4);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5200,
    arrows: false,
  };

  const handleGetStarted = () => {
    console.log('Creating memorial for:', firstName, lastName);
  };

  return (
    <div className="mem-public-page">
      <PublicHeader />

      {/* HERO */}
      <section className="mem-hero">
        <div className="mem-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1800"
            alt="Memorial background"
          />
        </div>

        <div className="mem-public-container">
          <div className="mem-hero-content">
            <p className="mem-hero-eyebrow">A place for remembrance</p>

            <h2 className="mem-hero-title">
              Create a Memorial Website
            </h2>

            <p className="mem-hero-desc">
              Preserve and share memories of your loved one with dignity,
              grace, and a lasting digital tribute.
            </p>

            <div className="mem-hero-actions">
              <PublicButton size="lg" onClick={handleGetStarted}>
                Get Started
              </PublicButton>

              <PublicButton size="lg" variant="outline">
                <SearchIcon className="w-4 h-4" />
                Find a Memorial
              </PublicButton>

              <PublicButton size="lg" variant="ghost">
                <BookOpen className="w-4 h-4" />
                How It Works
              </PublicButton>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH PANEL */}
      <section className="mem-search-panel px-6">
        <div className="mem-public-container">
          <div className="mem-search-box">
            <p className="mem-section-eyebrow">Start a tribute</p>

            <div className="mem-search-grid">
              <PublicInput
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <PublicInput
                placeholder="Last Name optional"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <PublicButton onClick={handleGetStarted}>
                Create
              </PublicButton>
            </div>
          </div>
        </div>
      </section>

      {/* SHORTCUT CARDS */}
      <section className="mem-public-section">
        <div className="mem-public-container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="mem-public-card p-8 text-center">
              <div className="mem-stat-icon mx-auto">
                <PlusCircle className="w-7 h-7" />
              </div>
              <h3 className="mb-3 text-2xl font-light">Create Memorial</h3>
              <p className="text-sm leading-6 text-white/60">
                Start a memorial page to honor a life remembered.
              </p>
            </div>

            <div className="mem-public-card p-8 text-center">
              <div className="mem-stat-icon mx-auto">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="mb-3 text-2xl font-light">Browse Obituaries</h3>
              <p className="text-sm leading-6 text-white/60">
                Explore tributes and celebrate lives well-lived.
              </p>
            </div>

            <div className="mem-public-card p-8 text-center">
              <div className="mem-stat-icon mx-auto">
                <Flame className="w-7 h-7" />
              </div>
              <h3 className="mb-3 text-2xl font-light">Light a Candle</h3>
              <p className="text-sm leading-6 text-white/60">
                Leave a quiet message and light a virtual candle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED MEMORIALS */}
      <section className="mem-public-section border-y border-white/10 bg-white/[0.03]">
        <div className="mem-public-container">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="mem-section-eyebrow">Featured</p>
              <h3 className="mem-section-title">Featured Memorials</h3>
              <p className="mem-section-desc">
                Celebrating lives, stories, and legacies shared by families.
              </p>
            </div>
          </div>

          <Slider {...sliderSettings}>
            {featuredMemorials.map((memorial, index) => (
              <div key={index}>
                <MemorialCard {...memorial} variant="featured" />
              </div>
            ))}
          </Slider>
        </div>
      </section>

      {/* RECENT MEMORIALS */}
      <section className="mem-public-section">
        <div className="mem-public-container">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="mem-section-eyebrow">Recent</p>
              <h3 className="mem-section-title">Recent Memorials</h3>
              <p className="mem-section-desc">
                Latest tributes from our community.
              </p>
            </div>

            <PublicButton variant="outline">
              View All
              <ArrowRight className="w-4 h-4" />
            </PublicButton>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {recentMemorials.map((memorial, index) => (
              <MemorialCard key={index} {...memorial} />
            ))}
          </div>
        </div>
      </section>

      {/* TRENDING TRIBUTES */}
      <section className="mem-public-section border-y border-white/10 bg-white/[0.03]">
        <div className="mem-public-container">
          <div className="mb-10">
            <p className="mem-section-eyebrow">This week</p>
            <h3 className="mem-section-title flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#C7A76A]" />
              Trending Tributes
            </h3>
            <p className="mem-section-desc">
              Most remembered memorials this week.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {trendingTributes.map((memorial, index) => (
              <div key={index} className="mem-public-card p-6">
                <div className="flex items-start gap-4">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                    <img
                      src={memorial.image}
                      alt={memorial.name}
                      className="h-full w-full object-cover grayscale"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                  </div>

                  <div>
                    <h4 className="mb-1 text-lg font-light text-white">
                      {memorial.name}
                    </h4>

                    <p className="mb-3 text-xs text-white/50">
                      {memorial.years}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-[#C7A76A]">
                      <Flame className="w-4 h-4" />
                      <span>{memorial.candles} candles lit</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CANDLE SECTION */}
      <section className="mem-public-section">
        <div className="mem-public-container text-center">
          <Flame className="mx-auto mb-5 h-12 w-12 text-[#C7A76A]" />

          <p className="mem-section-eyebrow">Community remembrance</p>

          <h3 className="mem-section-title">
            Light a Candle Today
          </h3>

          <p className="mem-section-desc mx-auto">
            Join our community in remembrance and leave a quiet tribute.
          </p>

          <div className="mt-8 text-6xl font-light text-[#C7A76A]">
            12,847
          </div>

          <p className="mt-2 text-sm text-white/50">
            candles lit this month
          </p>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
            <div className="mem-public-card p-5 text-left">
              <p className="mb-3 text-sm italic leading-6 text-white/70">
                “Forever in our hearts. Rest peacefully, Mom.”
              </p>
              <p className="text-xs text-white/40">— Sarah, 2 hours ago</p>
            </div>

            <div className="mem-public-card p-5 text-left">
              <p className="mb-3 text-sm italic leading-6 text-white/70">
                “A beautiful soul who touched so many lives.”
              </p>
              <p className="text-xs text-white/40">— Michael, 5 hours ago</p>
            </div>

            <div className="mem-public-card p-5 text-left">
              <p className="mb-3 text-sm italic leading-6 text-white/70">
                “Your kindness will never be forgotten, Dad.”
              </p>
              <p className="text-xs text-white/40">— Jennifer, 1 day ago</p>
            </div>
          </div>

          <div className="mt-10">
            <PublicButton size="lg">
              <Flame className="w-4 h-4" />
              Light a Candle
            </PublicButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black px-6 py-12">
        <div className="mem-public-container">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h1 className="mb-3 text-2xl font-light tracking-[0.25em] text-white uppercase">
                MEMODISE
              </h1>
              <p className="text-sm leading-6 text-white/50">
                Honoring memories with dignity and respect.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-white">Platform</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>Create Memorial</li>
                <li>Browse Memorials</li>
                <li>How It Works</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-white">Support</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>FAQs</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-medium text-white">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-white/40">
              © 2026 Memodise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* PAPER GRAIN */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
    </div>
  );
}