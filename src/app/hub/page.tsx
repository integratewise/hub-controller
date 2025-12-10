import { KpiCard } from '@/components/hub/KpiCard';
import { Section } from '@/components/hub/Section';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Wallet,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileText,
  Zap,
  BarChart3,
  FolderKanban,
  ShieldCheck,
  Building2,
} from 'lucide-react';

// Sample data - in production, fetch from API
const executiveKPIs = [
  { key: 'MRR', value: 125000, trend: 'up' as const, change_percent: 8.5, sparkline: [95, 102, 108, 115, 120, 125] },
  { key: 'ARR', value: 1500000, trend: 'up' as const, change_percent: 12.3 },
  { key: 'Monthly Burn', value: 82000, trend: 'down' as const, change_percent: -5.2, sparkline: [95, 92, 88, 85, 83, 82] },
  { key: 'Runway (months)', value: 14, trend: 'up' as const, change_percent: 16.7 },
  { key: 'Pipeline Value', value: 480000, trend: 'up' as const, change_percent: 22.1 },
  { key: 'Win Rate', value: 28, trend: 'up' as const, change_percent: 3.5 },
  { key: 'Churn Rate', value: 2.1, trend: 'down' as const, change_percent: -0.4 },
  { key: 'Team Utilization', value: 78, trend: 'up' as const, change_percent: 4.2 },
];

const recentActivity = [
  { type: 'deal', title: 'Acme Corp deal closed', value: '$45,000', time: '2h ago', icon: Target, color: 'text-emerald-400' },
  { type: 'expense', title: 'AWS invoice processed', value: '$12,340', time: '4h ago', icon: Wallet, color: 'text-amber-400' },
  { type: 'compliance', title: 'SOC2 audit scheduled', value: 'Q1 2025', time: '6h ago', icon: ShieldCheck, color: 'text-indigo-400' },
  { type: 'team', title: 'New hire onboarded', value: 'Engineering', time: '1d ago', icon: Users, color: 'text-cyan-400' },
  { type: 'investor', title: 'Board deck shared', value: 'Series A', time: '2d ago', icon: Building2, color: 'text-purple-400' },
];

const upcomingDeadlines = [
  { title: 'GST Filing Due', date: 'Dec 20', priority: 'high', category: 'Compliance' },
  { title: 'Board Meeting', date: 'Dec 28', priority: 'high', category: 'Investors' },
  { title: 'Quarterly OKR Review', date: 'Jan 5', priority: 'medium', category: 'Team' },
  { title: 'Contract Renewal - BigCorp', date: 'Jan 15', priority: 'medium', category: 'Sales' },
];

const quickLinks = [
  { href: '/hub/dashboard', label: 'Metrics Dashboard', desc: 'Comprehensive analytics and KPIs for all business operations with real-time insights and trend analysis.', icon: BarChart3, emoji: '📊', color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' },
  { href: '/hub/projects', label: 'Projects Hub', desc: 'Manage all projects, track progress, and collaborate with teams using intelligent project management tools.', icon: FolderKanban, emoji: '📁', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' },
  { href: '/hub/finance', label: 'Finance Center', desc: 'Track cash flow, manage expenses, automate invoicing, and monitor financial health with AI-powered insights.', icon: Wallet, emoji: '💰', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' },
  { href: '/hub/ops', label: 'Compliance Hub', desc: 'Ensure SOC2, GDPR, and GST compliance with automated audits, reporting, and risk management.', icon: ShieldCheck, emoji: '🛡️', color: 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20' },
  { href: '/hub/sales', label: 'Sales Pipeline', desc: 'Track opportunities, manage leads, and accelerate deals with intelligent CRM and forecasting tools.', icon: Target, emoji: '🎯', color: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20' },
  { href: '/hub/docs', label: 'Docs Hub', desc: 'Search, organize, and collaborate on documents with AI-powered search and knowledge management.', icon: FileText, emoji: '📄', color: 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' },
];

export default async function HubHome() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 px-6 rounded-xl bg-gradient-to-br from-indigo-950 to-purple-950 border border-neutral-800">
        <h1 className="text-4xl font-bold text-neutral-100 mb-4">
          IntegrateWise Universal Controller Hub
        </h1>
        <p className="text-lg text-neutral-400 mb-8 max-w-2xl mx-auto">
          Your intelligent SaaS operations platform that accelerates business growth through autonomous operations and unified insights.
        </p>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">$1.5M</div>
            <div className="text-sm text-neutral-500">Annual Recurring Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">40%</div>
            <div className="text-sm text-neutral-500">Process Acceleration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">$82K</div>
            <div className="text-sm text-neutral-500">Monthly Burn</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">14mo</div>
            <div className="text-sm text-neutral-500">Runway</div>
          </div>
        </div>

        <Link
          href="/hub/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Launch Your Hub
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Section title="Recent Activity">
          <div className="space-y-3">
            {recentActivity.map((activity, i) => {
              const Icon = activity.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors">
                  <div className={`p-2 rounded-lg bg-neutral-800 ${activity.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-neutral-100 truncate">{activity.title}</div>
                    <div className="text-xs text-neutral-500">{activity.value}</div>
                  </div>
                  <div className="text-xs text-neutral-500">{activity.time}</div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Upcoming Deadlines */}
        <Section title="Upcoming Deadlines">
          <div className="space-y-3">
            {upcomingDeadlines.map((deadline, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors">
                <div className={`p-2 rounded-lg ${
                  deadline.priority === 'high' ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}>
                  {deadline.priority === 'high' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-neutral-100 truncate">{deadline.title}</div>
                  <div className="text-xs text-neutral-500">{deadline.category}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <Calendar className="w-3 h-3" />
                  {deadline.date}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Alerts & Insights */}
      <Section title="AI Insights">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Growth Opportunity</span>
            </div>
            <p className="text-sm text-neutral-300">
              MRR growth accelerating. Consider increasing marketing spend by 15% to capitalize on momentum.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Attention Needed</span>
            </div>
            <p className="text-sm text-neutral-300">
              2 contracts expiring in 30 days worth $85K ARR. Schedule renewal calls this week.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Quick Win</span>
            </div>
            <p className="text-sm text-neutral-300">
              GST input credit of ₹2.4L available for claim. File before Dec 20 deadline.
            </p>
          </div>
        </div>
      </Section>

      {/* Core Modules */}
      <Section title="Why Choose IntegrateWise Hub?">
        <p className="text-neutral-400 mb-6 text-center max-w-3xl mx-auto">
          IntegrateWise transforms your SaaS operations with intelligent automation, unified insights, and autonomous workflows that accelerate growth and ensure compliance across all business functions.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`p-6 rounded-xl border ${link.color} hover:scale-105 transition-all block group`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{link.emoji}</span>
                  <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-lg font-semibold text-neutral-100 mb-2">{link.label}</div>
                <div className="text-sm text-neutral-400 leading-relaxed">{link.desc}</div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Integration Status */}
      <Section title="Integration Status">
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Salesforce', status: 'connected' },
            { name: 'Notion', status: 'connected' },
            { name: 'Google Drive', status: 'connected' },
            { name: 'Zoho Books', status: 'connected' },
            { name: 'MuleSoft', status: 'pending' },
            { name: 'Airtable', status: 'disconnected' },
          ].map((integration) => (
            <div
              key={integration.name}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                integration.status === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : integration.status === 'pending'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {integration.status === 'connected' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : integration.status === 'pending' ? (
                <Clock className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {integration.name}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

