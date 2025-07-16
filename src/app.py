from dotenv import load_dotenv
import streamlit as st
import chain


load_dotenv()

def CG_generator_app():
   
    st.title("🎓 Carrier Counselor Generator")
    st.markdown("""
    Welcome to the **Carrier Counselor Generator App**!  
    """)
    with st.form("CG_generator"):
        field = st.text_input("📘 Eg. how to become a frontend developer")
        submitted=st.form_submit_button("Guide Me")

        if(submitted):
            response=chain.generate_CG(field)
            st.info(response)


CG_generator_app()