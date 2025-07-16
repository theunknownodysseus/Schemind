import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import { Brain, BookOpen, Trophy, Rocket, Users, Star, ChevronDown, Zap, Globe, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import { useChat } from '../context/ChatContext';

const Home = () => {
  const controls = useAnimation();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const { openChat } = useChat();
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  const testimonials = [
    {
      name: "Rohith",
      role: "Computer Science Student",
      image: "https://media.licdn.com/dms/image/v2/D5603AQG5EdS8OjfyQw/profile-displayphoto-shrink_400_400/B56ZVxQCRIHQAk-/0/1741361785314?e=1758153600&v=beta&t=UoVTXJlRpgZ2PvnrzfM0FHZoSgzYKhv5ZR9ZLHY8AfQ",
      quote: "Youniq transformed my learning experience. The AI-powered guidance helped me master complex topics efficiently."
    },
    {
      name: "Varun",
      role: "Computer Science Student",
      image: "https://media.licdn.com/dms/image/v2/D5603AQEHVLujzZJVAg/profile-displayphoto-shrink_400_400/B56ZUaPTSIGsAg-/0/1739901974571?e=1758153600&v=beta&t=UftBMi1R1CmPo8hOLznJpPsYzK-YP3A2z5B3xTS-C3s",
      quote: "The personalized roadmaps and instant doubt resolution have been game-changers in my academic journey."
    },
    {
      name: "Dharaneesh",
      role: "Computer Science Student",
      image: "https://media.licdn.com/dms/image/v2/D5603AQEE2ehHRI8r7g/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1731778442654?e=1758153600&v=beta&t=IEj3KMlwCJ-FXviIzw2Re59AgbotDy94TgItGfDg19s",
      quote: "Having Schemind's Youniq as my AI tutor available 24/7 has significantly improved my study efficiency and understanding."
    }
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0"
          style={{ opacity, scale }}
        >
          <img
            src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80"
            alt="Study background"
            className="w-full h-full object-cover opacity-20"
          />
        </motion.div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500"
          >
            Your AI-Powered
            <br />
            Study Companion
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
          >
            Personalized learning paths, instant doubt resolution, and career guidance
            powered by advanced AI technology.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/roadmap"
              className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-lg font-semibold flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
            <button
              onClick={openChat}
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full hover:bg-white/10 transition-colors text-lg font-semibold flex items-center justify-center gap-2"
            >
              <MessageCircle size={20} />
              Try AI Chat
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "50K+", label: "Active Students", icon: Users },
              { number: "95%", label: "Success Rate", icon: Trophy },
              { number: "24/7", label: "AI Support", icon: Zap },
              { number: "150+", label: "Countries", icon: Globe }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">{stat.number}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Key Features
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Brain,
                title: "Smart Learning Paths",
                description: "AI-generated study plans tailored to your goals and learning style"
              },
              {
                icon: BookOpen,
                title: "Instant Help",
                description: "24/7 AI tutor for immediate doubt resolution and subject assistance"
              },
              {
                icon: Trophy,
                title: "Progress Tracking",
                description: "Gamified learning with achievements and progress visualization"
              },
              {
                icon: Rocket,
                title: "Career Guidance",
                description: "Data-driven career recommendations and skill development paths"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-900 p-6 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Student Success Stories
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-800 p-6 rounded-xl"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300">"{testimonial.quote}"</p>
                <div className="mt-4 flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Learning Journey?</h2>
            <p className="text-xl mb-8 text-gray-100">
              Join thousands of students who are already experiencing the future of education.
            </p>
            <a
              href="/roadmap"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Now
            </a>
          </motion.div>
        </div>
      </section>

      {/* ChatBot Component */}
      <ChatBot />
    </div>
  );
};

export default Home;