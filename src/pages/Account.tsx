import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../context/UserContext';
import { BookOpen, Bell, Clock, Target, Trophy, Calendar, TrendingUp } from 'lucide-react';

const Account: React.FC = () => {
  const { user } = useUser();
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [studyTime, setStudyTime] = useState<number>(0);
  const [weeklyProgress, setWeeklyProgress] = useState<number[]>([]);

  useEffect(() => {
    // Get current topic from localStorage
    const topic = localStorage.getItem('currentTopic');
    setCurrentTopic(topic);

    // Mock data for study time and weekly progress
    setStudyTime(120); // 2 hours
    setWeeklyProgress([2, 3, 1, 4, 2, 3, 5]); // Hours studied each day
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Please log in to view your account</h1>
          <p className="text-gray-400">Your learning progress and settings will be available here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-gray-400">Track your learning journey</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Trophy className="text-yellow-500" size={24} />
                <div>
                  <p className="text-sm text-gray-400">Current Streak</p>
                  <p className="text-xl font-bold">{user.streak} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Current Topic Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="text-blue-500" size={24} />
              <h2 className="text-xl font-semibold">Current Topic</h2>
            </div>
            {currentTopic ? (
              <div>
                <p className="text-lg font-medium mb-2">{currentTopic}</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock size={16} />
                  <span>{studyTime} hours studied</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No active topic</p>
            )}
          </motion.div>

          {/* Notification Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Bell className="text-green-500" size={24} />
              <h2 className="text-xl font-semibold">Daily Reminders</h2>
            </div>
            {user.notificationPreferences?.enabled ? (
              <div>
                <p className="text-lg font-medium mb-2">Active</p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock size={16} />
                  <span>{user.notificationPreferences.time}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{user.notificationPreferences.message}</p>
              </div>
            ) : (
              <p className="text-gray-400">No active reminders</p>
            )}
          </motion.div>

          {/* Learning Goals Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-purple-500" size={24} />
              <h2 className="text-xl font-semibold">Learning Goals</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Weekly Target</p>
                <p className="text-lg font-medium">10 hours</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </motion.div>

          {/* Weekly Progress Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-xl p-6 md:col-span-2 lg:col-span-3"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-orange-500" size={24} />
              <h2 className="text-xl font-semibold">Weekly Progress</h2>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
              {weeklyProgress.map((hours, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-400"
                    style={{ height: `${(hours / Math.max(...weeklyProgress)) * 100}%` }}
                  ></div>
                  <p className="text-sm text-gray-400 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Study Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800 rounded-xl p-6 md:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-pink-500" size={24} />
              <h2 className="text-xl font-semibold">Study Calendar</h2>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm
                    ${i < 15 ? 'bg-blue-500' : 'bg-gray-700'}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Account;