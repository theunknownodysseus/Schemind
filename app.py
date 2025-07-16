import streamlit as st
import os
from src.chain import process_quiz
from src.model import generate_quiz

st.set_page_config(page_title="GeethaTeaches Quiz", page_icon="📚")

st.title("GeethaTeaches Quiz 📚")

# Get topic from environment variable or user input
topic = os.environ.get('QUIZ_TOPIC')
if not topic:
    topic = st.text_input("Enter a topic for the quiz:", placeholder="e.g., Python Programming, Machine Learning, etc.")

if topic:
    if st.button("Generate Quiz"):
        with st.spinner("Generating quiz questions..."):
            # Generate quiz questions
            quiz_data = generate_quiz(topic)
            
            # Process and display questions
            for i, question in enumerate(quiz_data, 1):
                st.subheader(f"Question {i}")
                st.write(question['question'])
                
                # Display options
                for option in question['options']:
                    if st.button(option, key=f"q{i}_{option}"):
                        # Process answer
                        result = process_quiz(question, option)
                        if result['correct']:
                            st.success("Correct! 🎉")
                            st.write(result['explanation'])
                        else:
                            st.error("Incorrect. Try again!")
                            st.write(result['explanation'])
                
                st.divider()
else:
    st.info("Please enter a topic to start the quiz.") 