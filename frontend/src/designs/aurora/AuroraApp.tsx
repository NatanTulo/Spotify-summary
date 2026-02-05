import { Link, useLocation } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useOverviewStats, useTimeOfDay, useDayOfWeek, useTimeline, useTopArtists } from '../../hooks/useApi';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import './aurora.css';

function Particles() {
  return (
    <div className="aurora-particles">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}

function AuroraNav() {
  const location = useLocation();
  const { profiles, selectedProfileId, setSelectedProfileId } = useProfile();
  
  return (
    <nav className="aurora-nav">
      <div className="aurora-logo">
        <div className="aurora-logo-blob" />
        <span>Harmony</span>
      </div>
      
      <ul className="aurora-nav-links">
        <li>
          <Link 
            to="/3" 
            className={`aurora-nav-link ${location.pathname === '/3' ? 'active' : ''}`}
          >
            Overview
          </Link>
        </li>
        <li>
          <Link 
            to="/3/rhythm" 
            className={`aurora-nav-link ${location.pathname === '/3/rhythm' ? 'active' : ''}`}
          >
            Daily Rhythm
          </Link>
        </li>
        <li>
          <Link 
            to="/3/weekly" 
            className={`aurora-nav-link ${location.pathname === '/3/weekly' ? 'active' : ''}`}
          >
            Week Flow
          </Link>
        </li>
      </ul>
      
      <div className="flex items-center gap-4">
        <select
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="aurora-select"
        >
          <option value="all">All Profiles</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <div className="aurora-design-switcher">
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              to={`/${n}`}
              className={`aurora-design-btn ${n === 3 ? 'active' : ''}`}
            >
              {n}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${Math.round(minutes % 60)}m`;
}

// Circular clock visualization
function DailyRhythmClock({ data }: { data: { hour: number; plays: number }[] }) {
  const maxPlays = Math.max(...data.map(d => d.plays), 1);
  
  return (
    <div className="aurora-clock">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Clock face */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        
        {/* Hour markers */}
        {[0, 3, 6, 9, 12, 15, 18, 21].map(hour => {
          const angle = (hour / 24) * 360 - 90;
          const x = 100 + 95 * Math.cos((angle * Math.PI) / 180);
          const y = 100 + 95 * Math.sin((angle * Math.PI) / 180);
          return (
            <text
              key={hour}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
            >
              {hour}:00
            </text>
          );
        })}
        
        {/* Data bars */}
        {data.map((item, i) => {
          const angle = (item.hour / 24) * 360 - 90;
          const intensity = item.plays / maxPlays;
          const innerR = 30;
          const outerR = innerR + intensity * 50;
          
          const x1 = 100 + innerR * Math.cos((angle * Math.PI) / 180);
          const y1 = 100 + innerR * Math.sin((angle * Math.PI) / 180);
          const x2 = 100 + outerR * Math.cos((angle * Math.PI) / 180);
          const y2 = 100 + outerR * Math.sin((angle * Math.PI) / 180);
          
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={`url(#auroraGrad${i % 3})`}
              strokeWidth="6"
              strokeLinecap="round"
              opacity={0.6 + intensity * 0.4}
            />
          );
        })}
        
        {/* Gradients */}
        <defs>
          <linearGradient id="auroraGrad0" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#f093fb" />
          </linearGradient>
          <linearGradient id="auroraGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#764ba2" />
            <stop offset="100%" stopColor="#667eea" />
          </linearGradient>
          <linearGradient id="auroraGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f093fb" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
        
        {/* Center */}
        <circle cx="100" cy="100" r="25" fill="rgba(102, 126, 234, 0.2)" />
        <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#f8f8ff" fontSize="10">
          24h
        </text>
      </svg>
    </div>
  );
}

function AuroraOverview() {
  const { selectedProfileId } = useProfile();
  const { data: overview, isLoading } = useOverviewStats(selectedProfileId);
  const { data: timeOfDay } = useTimeOfDay(selectedProfileId);
  const { data: dayOfWeek } = useDayOfWeek(selectedProfileId);

  if (isLoading) {
    return (
      <div className="aurora-loading">
        <div className="aurora-loading-blob" />
      </div>
    );
  }

  // Find peak listening times
  const peakHour = timeOfDay?.reduce((max, curr) => curr.plays > max.plays ? curr : max, timeOfDay[0]);
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const peakDay = dayOfWeek?.reduce((max, curr) => curr.plays > max.plays ? curr : max, dayOfWeek[0]);

  return (
    <div className="p-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-outfit text-5xl font-bold text-white mb-4">
          Your Listening <span className="bg-gradient-to-r from-aurora-start via-aurora-mid to-aurora-end bg-clip-text text-transparent">Harmony</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Discover the rhythm of your music consumption and find balance in your listening habits
        </p>
      </div>

      {/* Stats */}
      <div className="aurora-grid aurora-grid-4 mb-12">
        <div className="aurora-card text-center">
          <div className="aurora-stat-value">{formatNumber(overview?.totalPlays || 0)}</div>
          <div className="aurora-stat-label">Total Plays</div>
        </div>
        <div className="aurora-card text-center">
          <div className="aurora-stat-value">{formatMinutes(overview?.totalMinutes || 0)}</div>
          <div className="aurora-stat-label">Time Listening</div>
        </div>
        <div className="aurora-card text-center">
          <div className="aurora-stat-value">{peakHour ? `${peakHour.hour}:00` : '-'}</div>
          <div className="aurora-stat-label">Peak Hour</div>
        </div>
        <div className="aurora-card text-center">
          <div className="aurora-stat-value">{peakDay ? DAYS[peakDay.dow].slice(0, 3) : '-'}</div>
          <div className="aurora-stat-label">Most Active Day</div>
        </div>
      </div>

      <div className="aurora-grid aurora-grid-2 gap-8">
        {/* Daily Rhythm Preview */}
        <div className="aurora-card">
          <h2 className="aurora-section-title">Daily Rhythm</h2>
          <p className="text-white/40 text-sm mb-4">When you listen throughout the day</p>
          {timeOfDay && (
            <div className="h-48">
              <DailyRhythmClock data={timeOfDay} />
            </div>
          )}
          <Link to="/3/rhythm" className="text-aurora-end hover:text-aurora-start transition-colors text-sm mt-4 inline-block">
            Explore full analysis →
          </Link>
        </div>

        {/* Week Flow Preview */}
        <div className="aurora-card">
          <h2 className="aurora-section-title">Week Flow</h2>
          <p className="text-white/40 text-sm mb-4">Your weekly listening pattern</p>
          {dayOfWeek && (
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, i) => {
                const data = dayOfWeek.find(d => d.dow === i);
                const maxPlays = Math.max(...dayOfWeek.map(d => d.plays), 1);
                const intensity = data ? data.plays / maxPlays : 0;
                return (
                  <div key={day} className="text-center">
                    <div 
                      className="aurora-day-bar mx-auto"
                      style={{ 
                        height: `${20 + intensity * 80}px`,
                        background: `linear-gradient(180deg, rgba(102,126,234,${0.3 + intensity * 0.7}) 0%, rgba(240,147,251,${0.3 + intensity * 0.7}) 100%)`
                      }}
                    />
                    <div className="text-white/40 text-xs mt-2">{day.slice(0, 2)}</div>
                    <div className="text-white/70 text-xs">{formatNumber(data?.plays || 0)}</div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/3/weekly" className="text-aurora-end hover:text-aurora-start transition-colors text-sm mt-4 inline-block">
            See detailed breakdown →
          </Link>
        </div>
      </div>
    </div>
  );
}

function AuroraDailyRhythm() {
  const { selectedProfileId } = useProfile();
  const { data: timeOfDay, isLoading } = useTimeOfDay(selectedProfileId);

  // Group hours into periods
  const periods = [
    { name: 'Night Owl', hours: [0, 1, 2, 3, 4, 5], emoji: '🌙' },
    { name: 'Early Bird', hours: [6, 7, 8, 9, 10, 11], emoji: '🌅' },
    { name: 'Afternoon', hours: [12, 13, 14, 15, 16, 17], emoji: '☀️' },
    { name: 'Evening', hours: [18, 19, 20, 21, 22, 23], emoji: '🌆' },
  ];

  const periodStats = periods.map(period => ({
    ...period,
    plays: timeOfDay?.filter(h => period.hours.includes(h.hour)).reduce((sum, h) => sum + h.plays, 0) || 0,
    minutes: timeOfDay?.filter(h => period.hours.includes(h.hour)).reduce((sum, h) => sum + h.totalMinutes, 0) || 0,
  }));

  const dominantPeriod = periodStats.reduce((max, curr) => curr.plays > max.plays ? curr : max, periodStats[0]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-outfit text-4xl font-bold text-white mb-2">
          🕐 Your Daily Rhythm
        </h1>
        <p className="text-white/50">
          Discover how your listening flows throughout the day
        </p>
      </div>

      {isLoading ? (
        <div className="aurora-loading"><div className="aurora-loading-blob" /></div>
      ) : (
        <>
          {/* Dominant Period Card */}
          <div className="aurora-card mb-8 text-center py-8">
            <div className="text-6xl mb-4">{dominantPeriod.emoji}</div>
            <h2 className="font-outfit text-2xl font-bold text-white mb-2">
              You're a <span className="text-aurora-end">{dominantPeriod.name}</span> listener
            </h2>
            <p className="text-white/50">
              Most of your listening happens during {dominantPeriod.name.toLowerCase()} hours
            </p>
          </div>

          <div className="aurora-grid aurora-grid-2 gap-8">
            {/* 24h Clock */}
            <div className="aurora-card">
              <h2 className="aurora-section-title">24-Hour Wheel</h2>
              <div className="h-72">
                {timeOfDay && <DailyRhythmClock data={timeOfDay} />}
              </div>
            </div>

            {/* Period Breakdown */}
            <div className="aurora-card">
              <h2 className="aurora-section-title">Time Periods</h2>
              <div className="space-y-4 mt-4">
                {periodStats.map((period) => (
                  <div key={period.name} className="aurora-period-card">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{period.emoji}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-outfit font-semibold text-white">{period.name}</span>
                          <span className="text-aurora-end">{formatNumber(period.plays)} plays</span>
                        </div>
                        <div className="aurora-progress-bar">
                          <div 
                            className="aurora-progress-fill"
                            style={{ width: `${(period.plays / (periodStats[0].plays || 1)) * 100}%` }}
                          />
                        </div>
                        <div className="text-white/40 text-xs mt-1">
                          {formatMinutes(period.minutes)} listened
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hourly Chart */}
            <div className="aurora-card col-span-2">
              <h2 className="aurora-section-title">Hour by Hour</h2>
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeOfDay?.map(h => ({ hour: `${h.hour}:00`, plays: h.plays })) || []}>
                    <defs>
                      <linearGradient id="auroraFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f093fb" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#667eea" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="hour" 
                      stroke="rgba(255,255,255,0.2)"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      interval={3}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.2)"
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(26,26,46,0.95)', 
                        border: '1px solid rgba(240,147,251,0.3)',
                        borderRadius: '12px',
                        color: '#f8f8ff',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="plays" 
                      stroke="#f093fb"
                      strokeWidth={2}
                      fill="url(#auroraFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AuroraWeekly() {
  const { selectedProfileId } = useProfile();
  const { data: dayOfWeek, isLoading } = useDayOfWeek(selectedProfileId);
  const { data: timeline } = useTimeline(selectedProfileId, 'week');

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxPlays = Math.max(...(dayOfWeek?.map(d => d.plays) || [1]));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-outfit text-4xl font-bold text-white mb-2">
          📅 Your Week Flow
        </h1>
        <p className="text-white/50">
          How your listening habits change throughout the week
        </p>
      </div>

      {isLoading ? (
        <div className="aurora-loading"><div className="aurora-loading-blob" /></div>
      ) : (
        <div className="aurora-grid aurora-grid-2 gap-8">
          {/* Radar Chart */}
          <div className="aurora-card">
            <h2 className="aurora-section-title">Weekly Pattern</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dayOfWeek?.map(d => ({ day: DAYS[d.dow].slice(0, 3), plays: d.plays })) || []}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <Radar 
                    dataKey="plays" 
                    stroke="#f093fb" 
                    fill="#667eea" 
                    fillOpacity={0.4}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(26,26,46,0.95)', 
                      border: '1px solid rgba(240,147,251,0.3)',
                      borderRadius: '12px',
                      color: '#f8f8ff',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Day Cards */}
          <div className="aurora-card">
            <h2 className="aurora-section-title">Day Breakdown</h2>
            <div className="space-y-3 mt-4">
              {dayOfWeek?.sort((a, b) => b.plays - a.plays).map((day, i) => (
                <div key={day.dow} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" 
                       style={{ background: i === 0 ? 'linear-gradient(135deg, #667eea, #f093fb)' : 'rgba(255,255,255,0.1)' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-outfit font-semibold text-white">{DAYS[day.dow]}</span>
                      <span className="text-aurora-end">{formatNumber(day.plays)}</span>
                    </div>
                    <div className="aurora-progress-bar mt-1">
                      <div 
                        className="aurora-progress-fill"
                        style={{ width: `${(day.plays / maxPlays) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Timeline */}
          <div className="aurora-card col-span-2">
            <h2 className="aurora-section-title">Recent Weeks</h2>
            <div className="h-48 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline?.slice(-12) || []}>
                  <defs>
                    <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#667eea" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#f093fb" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="period" 
                    stroke="rgba(255,255,255,0.2)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(26,26,46,0.95)', 
                      border: '1px solid rgba(102,126,234,0.3)',
                      borderRadius: '12px',
                      color: '#f8f8ff',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="plays" 
                    stroke="#667eea"
                    strokeWidth={2}
                    fill="url(#weeklyGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuroraApp() {
  const location = useLocation();
  
  return (
    <div className="aurora-app">
      <div className="aurora-bg" />
      <Particles />
      <div className="aurora-content">
        <AuroraNav />
        
        {location.pathname === '/3' && <AuroraOverview />}
        {location.pathname === '/3/rhythm' && <AuroraDailyRhythm />}
        {location.pathname === '/3/weekly' && <AuroraWeekly />}
      </div>
    </div>
  );
}
