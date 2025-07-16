from langchain_groq import ChatGroq
import os
from dotenv import load_dotenv

load_dotenv()

def create_chat_groq():
    '''
    function to initialize chat groq

    Returns : 
        ChatGroq
    '''
    return ChatGroq(
        model="gemma2-9b-it",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
        api_key=os.getenv('GROQ_API_KEY')
    )

def generate_quiz(topic):
    """
    Generate quiz questions for a given topic
    
    Args:
        topic (str): The topic to generate questions for
        
    Returns:
        list: List of quiz questions with options
    """
    llm = create_chat_groq()
    
    prompt = f"""Generate 5 multiple choice questions about {topic}. 
    For each question, provide 4 options with one correct answer.
    Format the response as a JSON array where each question has:
    - question: the question text
    - options: array of 4 possible answers
    - correctAnswer: the correct answer from the options
    
    Example format:
    [
        {{
            "question": "What is...",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": "Option 1"
        }},
        ...
    ]
    """
    
    response = llm.invoke(prompt)
    try:
        import json
        return json.loads(response.content)
    except json.JSONDecodeError:
        # Fallback if JSON parsing fails
        return [
            {
                "question": "What is the main concept of " + topic + "?",
                "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                "correctAnswer": "Option 1"
            }
        ]

def process_quiz(question, answer):
    """
    Process a quiz answer and provide feedback
    
    Args:
        question (dict): The question object with question text, options, and correct answer
        answer (str): The user's answer
        
    Returns:
        dict: Result containing if the answer was correct and explanation
    """
    llm = create_chat_groq()
    
    prompt = f"""Given the question: "{question['question']}"
    Options: {', '.join(question['options'])}
    Correct answer: {question['correctAnswer']}
    User's answer: {answer}
    
    Provide feedback in JSON format:
    {{
        "correct": true/false,
        "explanation": "Detailed explanation of why the answer is correct/incorrect",
        "correctAnswer": "The correct answer"
    }}
    """
    
    response = llm.invoke(prompt)
    try:
        import json
        return json.loads(response.content)
    except json.JSONDecodeError:
        return {
            "correct": answer == question['correctAnswer'],
            "explanation": "The correct answer is " + question['correctAnswer'],
            "correctAnswer": question['correctAnswer']
        }