import streamlit as st
import sys
import os

def run_streamlit_app(topic=None):
    # Set the topic as an environment variable
    if topic:
        os.environ['QUIZ_TOPIC'] = topic
    
    # Run the Streamlit app
    os.system('streamlit run app.py')

if __name__ == "__main__":
    # Get topic from command line argument if provided
    topic = sys.argv[1] if len(sys.argv) > 1 else None
    run_streamlit_app(topic) 