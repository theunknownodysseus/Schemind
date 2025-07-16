import React, { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer?: string;
}

interface QuizResult {
  correct: boolean;
  explanation: string;
  correctAnswer: string;
}

const Quiz: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [results, setResults] = useState<Record<number, QuizResult>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get topic from localStorage if available
  useEffect(() => {
    const savedTopic = localStorage.getItem('currentTopic');
    if (savedTopic) {
      setTopic(savedTopic);
    }
  }, []);

  const generateQuiz = async () => {
    if (!topic) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const data = await response.json();
      if (!data.quiz || !Array.isArray(data.quiz)) {
        throw new Error('Invalid quiz data received');
      }

      setQuiz(data.quiz);
      setCurrentQuestion(0);
      setResults({});
      setShowExplanation(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = async (answer: string) => {
    if (!quiz[currentQuestion]) return;

    try {
      const response = await fetch('http://localhost:5000/api/quiz/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: quiz[currentQuestion],
          answer,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check answer');
      }

      const result = await response.json();
      setResults(prev => ({
        ...prev,
        [currentQuestion]: result,
      }));
      setShowExplanation(true);
    } catch (error) {
      console.error('Error checking answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to check answer. Please try again.');
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setShowExplanation(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Take a Quiz</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic"
            className="flex-1 p-2 rounded bg-gray-800 text-white outline-none"
          />
          <button
            onClick={generateQuiz}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" size={16} />
                <span>Generating...</span>
              </div>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500 text-red-500 rounded">
            {error}
          </div>
        )}
      </div>

      {quiz.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">
              Question {currentQuestion + 1} of {quiz.length}
            </h3>
            <p className="text-lg text-white">{quiz[currentQuestion].question}</p>
          </div>

          <div className="space-y-3">
            {quiz[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                onClick={() => checkAnswer(option)}
                disabled={showExplanation}
                className={`w-full p-3 text-left rounded transition-colors ${
                  showExplanation
                    ? results[currentQuestion]?.correct
                      ? option === results[currentQuestion].correctAnswer
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                      : option === results[currentQuestion].correctAnswer
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="mt-6">
              <p className="text-white mb-4">
                {results[currentQuestion].explanation}
              </p>
              {currentQuestion < quiz.length - 1 && (
                <button
                  onClick={nextQuestion}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Next Question
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz; 