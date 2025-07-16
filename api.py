from flask import Flask, request, jsonify
from flask_cors import CORS
from model import generate_quiz
from chain import process_quiz

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/quiz/generate', methods=['POST'])
def generate_quiz_endpoint():
    try:
        data = request.get_json()
        topic = data.get('topic')
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
            
        # Generate quiz questions
        quiz_data = generate_quiz(topic)
        return jsonify({'quiz': quiz_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/quiz/check', methods=['POST'])
def check_answer():
    try:
        data = request.get_json()
        question = data.get('question')
        answer = data.get('answer')
        
        if not question or not answer:
            return jsonify({'error': 'Question and answer are required'}), 400
            
        # Process the answer
        result = process_quiz(question, answer)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 