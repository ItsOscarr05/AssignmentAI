import React, { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useToast } from '../contexts/ToastContext';
import { api } from '../lib/api';

interface Session {
  id: string;
  device: string;
  ip: string;
  lastActive: string;
  expiresAt: string;
  analytics?: SessionAnalytics;
}

interface SessionAnalytics {
  session_info: {
    created_at: string;
    last_activity: string;
    ip_address: string;
    user_agent: string;
  };
  metrics: {
    page_views: number;
    api_calls: number;
    errors: number;
    total_duration: number;
    last_interaction: string;
  };
  activity_log: Array<{
    timestamp: string;
    type: string;
    details: Record<string, any>;
    metrics: Record<string, any>;
  }>;
  summary: {
    total_page_views: number;
    total_api_calls: number;
    error_rate: number;
    average_session_duration: number;
  };
}

interface ActiveSessionsProps {
  onSessionRevoked?: () => void;
}

export const ActiveSessions: React.FC<ActiveSessionsProps> = ({ onSessionRevoked }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null);
  const { showToast } = useToast();

  const fetchSessions = async () => {
    try {
      const response = await api.get('/auth/sessions');
      setSessions(response.data);
    } catch (error) {
      showToast('Failed to fetch sessions', 'error');
    }
  };

  const fetchSessionAnalytics = async (sessionId: string) => {
    try {
      const response = await api.get(`/auth/sessions/${sessionId}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      showToast('Failed to fetch session analytics', 'error');
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionAnalytics(selectedSession);
    }
  }, [selectedSession]);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      showToast('Session revoked successfully', 'success');
      fetchSessions();
      if (onSessionRevoked) {
        onSessionRevoked();
      }
    } catch (error) {
      showToast('Failed to revoke session', 'error');
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      await api.delete('/auth/sessions');
      showToast('All sessions revoked successfully', 'success');
      fetchSessions();
      if (onSessionRevoked) {
        onSessionRevoked();
      }
    } catch (error) {
      showToast('Failed to revoke all sessions', 'error');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Active Sessions</h2>
        {sessions.length > 0 && (
          <button
            onClick={handleRevokeAllSessions}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Revoke All Sessions
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500">No active sessions</p>
      ) : (
        <div className="space-y-4">
          {sessions.map(session => (
            <div
              key={session.id}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{session.device}</p>
                  <p className="text-sm text-gray-600">IP: {session.ip}</p>
                  <p className="text-sm text-gray-600">
                    Last active: {new Date(session.lastActive).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires: {new Date(session.expiresAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => setSelectedSession(session.id)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {selectedSession === session.id ? 'Hide Analytics' : 'Show Analytics'}
                  </button>
                </div>
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Revoke
                </button>
              </div>

              {selectedSession === session.id && analytics && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Session Analytics</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-white rounded shadow">
                      <p className="text-sm text-gray-600">Total Page Views</p>
                      <p className="text-xl font-semibold">{analytics.summary.total_page_views}</p>
                    </div>
                    <div className="p-3 bg-white rounded shadow">
                      <p className="text-sm text-gray-600">Total API Calls</p>
                      <p className="text-xl font-semibold">{analytics.summary.total_api_calls}</p>
                    </div>
                    <div className="p-3 bg-white rounded shadow">
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className="text-xl font-semibold">
                        {analytics.summary.error_rate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded shadow">
                      <p className="text-sm text-gray-600">Avg. Session Duration</p>
                      <p className="text-xl font-semibold">
                        {formatDuration(analytics.summary.average_session_duration)}
                      </p>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={analytics.activity_log.map(log => ({
                          time: new Date(log.timestamp).toLocaleTimeString(),
                          pageViews: log.metrics.page_views,
                          apiCalls: log.metrics.api_calls,
                          errors: log.metrics.errors,
                        }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pageViews" stroke="#8884d8" />
                        <Line type="monotone" dataKey="apiCalls" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="errors" stroke="#ff7300" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
