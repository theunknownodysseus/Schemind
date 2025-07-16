import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, TrendingUp, Users, Award } from 'lucide-react';

const Career = () => {
  return (
    <div className="pt-16 min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Career Guidance</h1>
          <p className="text-xl text-gray-400">Discover and plan your ideal career path</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-blue-500" />
              Recommended Paths
            </h2>
            <div className="space-y-4">
              {[
                {
                  role: "Software Engineer",
                  match: "95% Match",
                  skills: ["Programming", "Problem Solving", "Mathematics"]
                },
                {
                  role: "Data Scientist",
                  match: "88% Match",
                  skills: ["Statistics", "Machine Learning", "Python"]
                },
                {
                  role: "UX Designer",
                  match: "82% Match",
                  skills: ["Design", "User Research", "Psychology"]
                }
              ].map((path, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{path.role}</span>
                    <span className="text-blue-500">{path.match}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {path.skills.map((skill, i) => (
                      <span key={i} className="text-sm bg-gray-600 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-800 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-blue-500" />
              Industry Insights
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: "Tech Industry Growth",
                  stat: "+25% YoY",
                  description: "Continued expansion in software development roles"
                },
                {
                  title: "Remote Work Opportunities",
                  stat: "70%",
                  description: "Of tech companies offer remote positions"
                },
                {
                  title: "Average Starting Salary",
                  stat: "$75,000",
                  description: "For entry-level software engineering roles"
                }
              ].map((insight, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{insight.title}</span>
                    <span className="text-green-500">{insight.stat}</span>
                  </div>
                  <p className="text-sm text-gray-400">{insight.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <a
            href="#"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-lg font-semibold"
          >
            Schedule Career Counseling
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Career;