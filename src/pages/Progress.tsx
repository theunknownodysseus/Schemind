import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Clock, Star } from 'lucide-react';

const Progress = () => {
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Your Progress</h1>
          <p className="text-xl text-gray-400">Track your learning journey and achievements</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Trophy, label: "Study Streak", value: "7 Days" },
            { icon: Target, label: "Goals Completed", value: "12/15" },
            { icon: Clock, label: "Study Time", value: "24h 30m" },
            { icon: Star, label: "Total Points", value: "1,250" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-xl p-6 text-center"
            >
              <stat.icon className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="text-gray-400 mb-1">{stat.label}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Recent Activities</h2>
            <div className="space-y-4">
              {[
                {
                  activity: "Completed Calculus Quiz",
                  time: "2 hours ago",
                  score: "95%"
                },
                {
                  activity: "Physics Study Session",
                  time: "5 hours ago",
                  score: "1h 30m"
                },
                {
                  activity: "Chemistry Notes Review",
                  time: "Yesterday",
                  score: "Completed"
                }
              ].map((activity, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{activity.activity}</p>
                    <p className="text-sm text-gray-400">{activity.time}</p>
                  </div>
                  <span className="text-blue-500">{activity.score}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6">Achievements</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                "Quick Learner",
                "Problem Solver",
                "Study Streak: 7 Days",
                "Math Master",
                "Science Whiz",
                "Perfect Score"
              ].map((achievement, index) => (
                <div
                  key={index}
                  className="bg-gray-700 p-4 rounde

d-lg text-center"
                >
                  <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Progress;