import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Clock, Tag } from 'lucide-react';
import api from '../lib/api';

interface Activity {
  _id?: string;
  name: string;
  category: string;
  startTime: string;
  endTime: string;
  duration: number;
  isRequired: boolean;
  icon: string;
  isActive: boolean;
}

export default function Routine() {
  const navigate = useNavigate();
  const [routine, setRoutine] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const taskOptions = [
    { name: 'Food', icon: '🍽️' },
    { name: 'Food & rest', icon: '🍽️😴' },
    { name: 'Sleep', icon: '😴' },
    { name: 'Study', icon: '📚' },
    { name: 'Phone', icon: '📱' },
    { name: 'Family time', icon: '👨‍👩' },
    { name: 'Brisk walk', icon: '🚶' },
    { name: 'Play', icon: '⚽' },
    { name: "Home's work", icon: '🏠' },
    { name: 'Excercise', icon: '💪' },
    { name: 'Cleaning', icon: '🧹' }
  ];

  useEffect(() => {
    fetchRoutine();
  }, []);

  const fetchRoutine = async () => {
    try {
      const response = await api.get('/routines');
      if (response.data && response.data.activities) {
        setRoutine(response.data);
        // Map scheduledTime to startTime for backward compatibility
        const mappedActivities = response.data.activities.map((activity: any) => ({
          ...activity,
          startTime: activity.scheduledTime || activity.startTime,
          endTime: activity.endTime || calculateEndTime(activity.scheduledTime || activity.startTime, activity.duration)
        }));
        setActivities(mappedActivities);
      }
    } catch (error) {
      console.error('Error fetching routine:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes - startTotalMinutes;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hr${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''}`;
      }
    }
  };

  const addActivity = () => {
    setActivities([
      ...activities,
      {
        name: '',
        category: 'Health',
        startTime: '07:00',
        endTime: '07:30',
        duration: 30,
        isRequired: true,
        icon: '�️',
        isActive: true
      }
    ]);
  };

  const updateActivity = (index: number, field: keyof Activity, value: any) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = { ...updatedActivities[index], [field]: value };
    
    // Auto-calculate duration when start or end time changes
    if (field === 'startTime' || field === 'endTime') {
      const activity = updatedActivities[index];
      if (activity.startTime && activity.endTime) {
        activity.duration = calculateDuration(activity.startTime, activity.endTime);
      }
    }
    
    setActivities(updatedActivities);
  };

  const handleTaskSelect = (index: number, taskIcon: string) => {
    const updatedActivities = [...activities];
    updatedActivities[index] = {
      ...updatedActivities[index],
      icon: taskIcon
    };
    setActivities(updatedActivities);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const saveRoutine = async () => {
    setSaving(true);
    try {
      // Convert startTime/endTime back to scheduledTime/duration for backend compatibility
      const activitiesForBackend = activities.map(activity => ({
        ...activity,
        scheduledTime: activity.startTime,
        duration: calculateDuration(activity.startTime, activity.endTime)
      }));
      
      if (routine) {
        await api.put('/routines', { activities: activitiesForBackend });
      } else {
        await api.post('/routines', { activities: activitiesForBackend });
      }
      navigate('/');
    } catch (error: any) {
      console.error('Error saving routine:', error);
      alert(error.response?.data?.error || 'Failed to save routine');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={24} />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Configure Routine</h1>
          <div className="w-20" />
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Daily Activities</h2>
          
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No activities added yet. Click "Add Activity" to start.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        placeholder="Task name"
                        value={activity.name}
                        onChange={(e) => updateActivity(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Tag size={16} className="inline mr-1" />
                          Type
                        </label>
                        <select
                          value={activity.icon}
                          onChange={(e) => handleTaskSelect(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {taskOptions.map(task => (
                            <option key={task.name} value={task.icon}>{task.icon} {task.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Clock size={16} className="inline mr-1" />
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={activity.startTime}
                            onChange={(e) => updateActivity(index, 'startTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Clock size={16} className="inline mr-1" />
                            End Time
                          </label>
                          <input
                            type="time"
                            value={activity.endTime}
                            onChange={(e) => updateActivity(index, 'endTime', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (auto-calculated)
                        </label>
                        <input
                          type="text"
                          value={formatDuration(activity.duration)}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={activity.isRequired}
                            onChange={(e) => updateActivity(index, 'isRequired', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={activity.isActive}
                            onChange={(e) => updateActivity(index, 'isActive', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={() => removeActivity(index)}
                      className="ml-4 text-red-600 hover:text-red-800 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={addActivity}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Activity
          </button>
        </div>

        <button
          onClick={saveRoutine}
          disabled={saving || activities.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Routine'}
        </button>
      </div>
    </div>
  );
}
