import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Plus, LogOut, BarChart3, RotateCcw } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';

interface Activity {
  _id: string;
  name: string;
  category: string;
  scheduledTime: string;
  duration: number;
  isRequired: boolean;
  icon: string;
  isActive: boolean;
}

interface Routine {
  _id: string;
  userId: string;
  name: string;
  activities: Activity[];
}

interface DailyLog {
  _id: string;
  userId: string;
  routineId: string;
  date: string;
  completedActivities: Array<{ activityId: string; completedAt: string; onTime: boolean; notes: string }>;
  missedActivities: Array<{ activityId: string; reason: string }>;
  overallScore: number;
}

interface DashboardProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function Dashboard({ setIsAuthenticated }: DashboardProps) {
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const [routineRes, logsRes] = await Promise.all([
        api.get('/routines'),
        api.get('/logs', {
          params: {
            startDate: format(selectedDate, 'yyyy-MM-dd'),
            endDate: format(selectedDate, 'yyyy-MM-dd')
          }
        })
      ]);
      setRoutine(routineRes.data);
      if (logsRes.data.length > 0) {
        setTodayLog(logsRes.data[0]);
      } else {
        setTodayLog(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleCompleteActivity = async (activityId: string) => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    let logId = todayLog?._id;

    if (!todayLog) {
      try {
        const newLog = await api.post('/logs', {
          date: format(selectedDate, 'yyyy-MM-dd'),
          routineId: routine?._id
        });
        setTodayLog(newLog.data);
        logId = newLog.data._id;
      } catch (error) {
        console.error('Error creating log:', error);
        setIsActionLoading(false);
        return;
      }
    }

    try {
      await api.post('/logs/complete', {
        logId,
        activityId,
        onTime: true,
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error completing activity:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMissActivity = async (activityId: string) => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    let logId = todayLog?._id;

    if (!todayLog) {
      try {
        const newLog = await api.post('/logs', {
          date: format(selectedDate, 'yyyy-MM-dd'),
          routineId: routine?._id
        });
        setTodayLog(newLog.data);
        logId = newLog.data._id;
      } catch (error) {
        console.error('Error creating log:', error);
        setIsActionLoading(false);
        return;
      }
    }

    try {
      await api.post('/logs/miss', {
        logId,
        activityId,
        reason: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error marking activity as missed:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUndoComplete = async (activityId: string) => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    try {
      await api.post('/logs/undo-complete', {
        logId: todayLog?._id,
        activityId
      });
      fetchData();
    } catch (error) {
      console.error('Error undoing completed activity:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUndoMiss = async (activityId: string) => {
    if (isActionLoading) return;
    setIsActionLoading(true);

    try {
      await api.post('/logs/undo-miss', {
        logId: todayLog?._id,
        activityId
      });
      fetchData();
    } catch (error) {
      console.error('Error undoing missed activity:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const isActivityCompleted = (activityId: string) => {
    return todayLog?.completedActivities.some(ca => ca.activityId === activityId);
  };

  const isActivityMissed = (activityId: string) => {
    return todayLog?.missedActivities.some(ma => ma.activityId === activityId);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Daily Tracker</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/routine')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Routine</span>
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <BarChart3 size={20} />
              <span className="hidden sm:inline">Reports</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          {!routine || routine.activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No routine set up yet.</p>
              <button
                onClick={() => navigate('/routine')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your Routine
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {routine.activities
                .filter(activity => activity.isActive)
                .map((activity) => {
                  const completed = isActivityCompleted(activity._id);
                  const missed = isActivityMissed(activity._id);
                  
                  return (
                    <div
                      key={activity._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{activity.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">{activity.name}</h3>
                            <p className="text-sm text-gray-600">
                              {activity.scheduledTime} • {activity.duration} min • {activity.category}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {completed ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={24} />
                              <span className="hidden sm:inline">Done</span>
                            </div>
                            <button
                              onClick={() => handleUndoComplete(activity._id)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Undo"
                            >
                              <RotateCcw size={18} />
                            </button>
                          </div>
                        ) : missed ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle size={24} />
                              <span className="hidden sm:inline">Missed</span>
                            </div>
                            <button
                              onClick={() => handleUndoMiss(activity._id)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Undo"
                            >
                              <RotateCcw size={18} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCompleteActivity(activity._id)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CheckCircle size={20} />
                              <span className="hidden sm:inline">Done</span>
                            </button>
                            <button
                              onClick={() => handleMissActivity(activity._id)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <XCircle size={20} />
                              <span className="hidden sm:inline">Skip</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {todayLog && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Progress</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-green-600">{todayLog.completedActivities.length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{todayLog.missedActivities.length}</p>
                <p className="text-sm text-gray-600">Missed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">{todayLog.overallScore}%</p>
                <p className="text-sm text-gray-600">Score</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
