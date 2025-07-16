from src.model import create_chat_groq, generate_quiz, process_quiz
import prompt

def generate_CG(field):
    prompt_template = prompt.CG_generator_prompt()
    llm = create_chat_groq()
    chain = prompt_template | llm
    response = chain.invoke({
        "field": field
    })
    return response.content

def process_quiz_answer(question, answer):
    """
    Process a quiz answer and provide feedback
    
    Args:
        question (dict): The question object
        answer (str): The user's answer
        
    Returns:
        dict: Result containing if the answer was correct and explanation
    """
    return process_quiz(question, answer)