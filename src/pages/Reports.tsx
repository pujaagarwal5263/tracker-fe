import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../lib/api';
import { format, startOfWeek, endOfWeek, startOfMonth, addWeeks, addMonths, subWeeks, subMonths } from 'date-fns';

export default function Reports() {
  const navigate = useNavigate();
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchReports();
  }, [selectedDate, view]);

  const fetchReports = async () => {
    try {
      const startDate = selectedDate.toISOString().split('T')[0];
      const [weekly, monthly] = await Promise.all([
        api.get(`/reports/weekly?startDate=${startDate}`),
        api.get(`/reports/monthly?startDate=${startDate}`)
      ]);
      setWeeklyData(weekly.data);
      setMonthlyData(monthly.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (view === 'weekly') {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (view === 'weekly') {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const getPeriodLabel = () => {
    if (view === 'weekly') {
      const start = startOfWeek(selectedDate);
      const end = endOfWeek(selectedDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      const start = startOfMonth(selectedDate);
      return `${format(start, 'MMMM yyyy')}`;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const currentData = view === 'weekly' ? weeklyData : monthlyData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <div className="w-20" />
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setView('weekly')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Monthly
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                {getPeriodLabel()}
              </h2>
            </div>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>

          {currentData && (
            <>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{currentData.completedActivities}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{currentData.missedActivities}</p>
                  <p className="text-sm text-gray-600">Missed</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{currentData.averageScore.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>

              {currentData.dailyData && currentData.dailyData.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    Daily Progress
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={currentData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                      />
                      <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                      <Bar dataKey="missed" fill="#ef4444" name="Missed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {currentData.dailyData && currentData.dailyData.length > 0 && (
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-600" />
                    Score Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={currentData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(new Date(value), 'MMM d')}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                      />
                      <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Score %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {!currentData || !currentData.dailyData || currentData.dailyData.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <p>No data available for this period.</p>
              <p className="text-sm mt-2">Start tracking your daily activities to see reports here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
