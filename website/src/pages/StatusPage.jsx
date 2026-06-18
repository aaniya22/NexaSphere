import React, { useEffect, useState } from 'react';
import { getApiBase } from '../utils/runtimeConfig';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, CheckCircle, Clock, ArrowLeft } from 'lucide-react';

export default function StatusPage() {
  const [statusData, setStatusData] = useState({
    status: 'operational',
    uptimePercentage: 100.0,
    incidents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = getApiBase();
    if (!base) {
      setLoading(false);
      return;
    }
    fetch(`${base}/api/monitoring/status-history`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatusData({
            status: data.status,
            uptimePercentage: data.uptimePercentage,
            incidents: data.incidents,
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load status history:', err);
        setLoading(false);
      });
  }, []);

  const isOperational = statusData.status === 'operational';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl">
        <a
          href="/"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to NexaSphere
        </a>

        {/* Status Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`rounded-2xl p-8 border backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl ${
            isOperational
              ? 'bg-[#003810]/10 border-[#00C853]/30'
              : 'bg-[#3D0A0A]/10 border-[#D50000]/30'
          }`}
        >
          <div className="flex items-center gap-4 text-center md:text-left" role="status">
            <div className="relative">
              {isOperational ? (
                <CheckCircle className="w-12 h-12 text-[#00C853]" />
              ) : (
                <ShieldAlert className="w-12 h-12 text-[#D50000]" />
              )}
              {isOperational && (
                <span className="absolute top-0 right-0 flex h-3 w-3" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00C853]"></span>
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isOperational ? 'All Systems Operational' : 'Active System Disruption'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Last checked: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6">
            <div className="text-3xl font-extrabold text-white">
              {statusData.uptimePercentage.toFixed(2)}%
            </div>
            <div className="text-gray-500 text-xs mt-1 uppercase tracking-wider font-semibold">
              90-Day Uptime Baseline
            </div>
          </div>
        </motion.div>

        {/* Uptime bars placeholder representing 90 days */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#121212]/80 border border-gray-800 rounded-2xl p-6 mt-6 shadow-xl"
        >
          <div className="flex justify-between items-center text-sm mb-4">
            <span className="font-semibold text-gray-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#CC1111]" /> System Monitor Metrics
            </span>
            <span className="text-xs text-gray-500">90 Days Ago — Today</span>
          </div>
          <div className="flex gap-[3px] h-8 justify-between">
            {Array.from({ length: 45 }, (_, i) => ({
              // Use a stable day-offset key derived from data position rather
              // than array index — prevents unnecessary React reconciliation
              // when the list is re-rendered.
              dayOffset: 45 - i,
            })).map(({ dayOffset }) => (
              <div
                key={`uptime-day-${dayOffset}`}
                className={`flex-1 rounded-sm transition-all duration-300 hover:scale-y-125 ${
                  dayOffset === 7 && !isOperational
                    ? 'bg-[#D50000] opacity-80'
                    : 'bg-[#00C853] opacity-60 hover:opacity-100'
                }`}
                title={`${dayOffset} day${dayOffset === 1 ? '' : 's'} ago: Healthy`}
              />
            ))}
          </div>
        </motion.div>

        {/* Incident Logs Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-[#121212]/80 border border-gray-800 rounded-2xl p-6 mt-6 shadow-xl"
        >
          <h2 className="text-lg font-bold text-gray-200 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" /> System Incident Log
          </h2>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : statusData.incidents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              No incidents reported in the last 30 days.
            </div>
          ) : (
            <div className="space-y-6">
              {statusData.incidents.map((incident) => (
                <div key={incident.id} className="border-l-2 border-red-500 pl-4 py-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-300">
                      Incident: {incident.error || 'Connection Timeout'}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        incident.status === 'resolved'
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                      }`}
                    >
                      {incident.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Start: {new Date(incident.startedAt).toLocaleString()}
                    {incident.resolvedAt &&
                      ` | End: ${new Date(incident.resolvedAt).toLocaleString()}`}
                  </div>
                  <div className="space-y-2 mt-2">
                    {incident.updates.map((update, idx) => (
                      <div key={idx} className="text-sm text-gray-400">
                        <span className="text-xs text-gray-600 block">
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                        {update.message}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="text-center text-xs text-gray-600 mt-12 flex justify-center gap-6">
          <span>Escalation Protocol: Twilio SMS (On-Call)</span>
          <span>•</span>
          <span>PagerDuty Voice Call</span>
          <span>•</span>
          <span>SLA: 99.9%</span>
        </div>
      </div>
    </div>
  );
}
