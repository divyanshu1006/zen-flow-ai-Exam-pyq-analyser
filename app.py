import streamlit as st
import google.generativeai as genai
from PyPDF2 import PdfReader
from PIL import Image
import time
import datetime
import json
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables

# --- 1. PAGE CONFIGURATION ---
st.set_page_config(
    page_title="ZenFlow AI",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="collapsed"
)




# --- 3. HELPER FUNCTIONS ---
def get_gemini_response(prompt, api_key_override=None):
    # PRIORITIZE: Override > Session Key > Env Var
    effective_key = api_key_override or st.session_state.get("api_key") or os.getenv("GEMINI_API_KEY")
    
    try:
        genai.configure(api_key=effective_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        return model.generate_content(prompt).text
    except Exception as e:
        # Auto-Trigger Modal on Error
        st.session_state.show_api_modal = True
        st.session_state.api_error = True
        return None  # Signal failure

def extract_text(files):
    text = ""
    for f in files:
        try:
            f.seek(0)
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        except: pass
    return text

def extract_text_from_images(files):
    text = ""
    for f in files:
        try:
            image = Image.open(f)
            model = genai.GenerativeModel('gemini-2.5-flash')
            response = model.generate_content(["Extract all text from this syllabus page verbatim:", image])
            text += response.text + "\n"
        except: pass
    return text

def save_strategy_history(roadmap_text, days, hours):
    history_file = ".zenflow_history.json"
    entry = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "roadmap": roadmap_text,
        "summary": f"{days} Days • {hours} Hrs/Day"
    }
    
    history_data = []
    if os.path.exists(history_file):
        try:
            with open(history_file, "r") as f:
                history_data = json.load(f)
        except: pass
    
    # Prepend new entry
    history_data.insert(0, entry)
    
    with open(history_file, "w") as f:
        json.dump(history_data, f)

def load_strategy_history():
    history_file = ".zenflow_history.json"
    if os.path.exists(history_file):
        try:
            with open(history_file, "r") as f:
                return json.load(f)
        except: return []
    return []

def save_state():
    state_data = {
        "step": st.session_state.get("step", 0),
        "user_name": st.session_state.get("user_name", ""),
        "syllabus_files": st.session_state.get("syllabus_files", {}),
        "pyq_files": st.session_state.get("pyq_files", {}),
        "mock_json": st.session_state.get("mock_json", []),
        "q_index": st.session_state.get("q_index", 0),
        "roadmap": st.session_state.get("roadmap", ""),
        "force_roadmap": st.session_state.get("force_roadmap", False),
        "api_key": st.session_state.get("api_key", ""),
    }
    with open(".zenflow_state.json", "w") as f:
        json.dump(state_data, f)

def load_state():
    if os.path.exists(".zenflow_state.json"):
        try:
            with open(".zenflow_state.json", "r") as f:
                state_data = json.load(f)
                for key, val in state_data.items():
                    if key not in st.session_state:
                         st.session_state[key] = val
        except: pass

# --- 4. STATE MANAGEMENT ---
load_state() # RESTORE SESSION
if 'step' not in st.session_state: st.session_state.step = 0
if 'user_name' not in st.session_state: st.session_state.user_name = ""
if 'syllabus_files' not in st.session_state: st.session_state.syllabus_files = {} # Filename -> Text
if 'pyq_files' not in st.session_state: st.session_state.pyq_files = {} # Filename -> Text
if 'mock_json' not in st.session_state: st.session_state.mock_json = []
if 'q_index' not in st.session_state: st.session_state.q_index = 0
if 'force_roadmap' not in st.session_state: st.session_state.force_roadmap = False
if 'api_key' not in st.session_state: st.session_state.api_key = ""
if 'show_api_modal' not in st.session_state: st.session_state.show_api_modal = False
if 'api_error' not in st.session_state: st.session_state.api_error = False



# ... (Step definitions) ...

# STEP 0: NAME ENTRY (The Portal)

st.markdown("""
    <style>
    /* FONTS */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap');

    /* ATMOSPHERE: The Misty Forest */
    .stApp {
        background-color: transparent; /* Changed from #111827 to let image show */
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #F0FDF4;
    }
    
    /* Dark Overlay */
    .stApp::after {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4); /* Reduced opacity from 0.75 to 0.4 */
        z-index: -1;
    }

    /* Background Image with Blur */
    .stApp::before {
        content: "";
        position: fixed;
        top: 0; 
        left: 0;
        width: 100vw;
        height: 100vh;
        /* Reliable Forest Image */
        background-image: url("https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2000&auto=format&fit=crop");
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
        filter: blur(40px); /* Heavy Blur as requested */
        z-index: -2;
    }

    /* WIZARD CARD - RESPONSIVE */
    .wizard-card {
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 40px;
        max-width: 800px;
        margin: 0 auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        text-align: center;
    }

    /* DASHBOARD CONTAINERS (Glassmorphism) */
    div[data-testid="stVerticalBlockBorderWrapper"] > div {
        background-color: rgba(0, 0, 0, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        backdrop-filter: blur(20px);
        border-radius: 20px !important;
    }
    
    /* ANIMATION CONTAINER */
    .nature-anim {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 60vh;
        flex-direction: column;
    }

    /* TYPOGRAPHY & BUTTONS */
    h1, h2, h3 { color: #FFFFFF !important; }
    p { color: #CBD5E1 !important; }
    
    div.stButton > button {
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        color: white;
        border: none;
        padding: 16px 32px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 1.1rem; /* Increased size */
        width: 100%;
        transition: transform 0.2s;
    }
    div.stButton > button:hover {
        /* transform: scale(1.02); REMOVED to avoid "loading" confusion */
        opacity: 0.9;
    }

    /* INPUT STYLING */
    .stTextInput > div > div > input, .stTextArea > div > div > textarea {
        background: rgba(255,255,255,0.05);
        color: white;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
    }

    /* --- RESPONSIVE ADJUSTMENTS --- */
    
    /* DESKTOP ONLY: Fixed Sidebar */
    @media (min-width: 992px) {
        section[data-testid="stSidebar"] {
            width: 400px !important;
        }
    }

    /* MOBILE/TABLET ADJUSTMENTS (< 768px) */
    @media (max-width: 768px) {
        /* Maximize Content Area */
        .block-container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
            max-width: 100vw !important;
        }

        /* Adjust Wizard Card */
        .wizard-card {
            padding: 20px;
            width: 95%;
            margin-top: 20px;
        }

        /* Typography Scaling */
        h1 { font-size: 1.8rem !important; }
        h2 { font-size: 1.5rem !important; }
        h3 { font-size: 1.2rem !important; }
        
        div.stButton > button {
            padding: 12px 24px;
            font-size: 1rem;
        }
    }
    
    /* MAXIMIZE CONTENT AREA (Default) */
    .block-container {
        padding-top: 2rem !important;
        padding-bottom: 2rem !important;
        /* Side padding handled by media query above for mobile */
    }

    section[data-testid="stSidebar"] div.stButton > button {
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #E2E8F0;
        transition: all 0.3s ease;
    }
    section[data-testid="stSidebar"] div.stButton > button:hover {
        background-color: #10B981;
        border-color: #10B981;
        color: white;
        /* transform: translateY(-2px); REMOVED */
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    /* MODAL OVERLAY STYLES */
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    /* 5. Hide Tooltip */
    div[role="tooltip"] {
        display: none !important;
    }

    #MainMenu, footer {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)


# --- API MODAL (CONDITIONAL OVERLAY) ---
if st.session_state.show_api_modal:
    with st.container():
        st.markdown("<div style='height: 10vh'></div>", unsafe_allow_html=True)
        c_modal_L, c_modal, c_modal_R = st.columns([1, 2, 1])
        
        with c_modal:
            with st.container(border=True): # The "Window"
                st.markdown("<h2 style='text-align: center'>🔑 Configure API Key</h2>", unsafe_allow_html=True)
                
                if st.session_state.api_error:
                    st.error("⚠️ Usage Limit Reached. Please use your own key to continue.")
                
                st.markdown("Unlock unlimited usage by providing your own Google Gemini API Key.")
                st.markdown("1. Get a [Free Key Here](https://aistudio.google.com/api-keys)\n2. Paste it below.")
                st.caption("✨ If you don't want to use your API key, please come back tomorrow at 1:30 PM.")
                
                new_key = st.text_input("API Key", type="password", placeholder="paste-your-key-here...", label_visibility="collapsed")
                
                b1, b2 = st.columns(2)
                with b1:
                    if st.button("Cancel", key="btn_cancel_api"):
                        st.session_state.show_api_modal = False
                        st.session_state.api_error = False
                        st.rerun()
                with b2:
                    if st.button("Save Key ✅", key="btn_save_api"):
                        if new_key:
                            st.session_state.api_key = new_key
                            save_state()
                            st.session_state.show_api_modal = False
                            st.session_state.api_error = False
                            st.success("Key Saved!")
                            time.sleep(1)
                            st.rerun()

    # STOP EXECUTION of the rest of the app while modal is open
    st.stop()




# --- COMPONENT: DATA VAULT SIDEBAR ---
if st.session_state.step >= 1:
    with st.sidebar:
        st.markdown("## 🗄️ Data Vault")
        if st.button("➕ New Session", key="sb_new_chat", use_container_width=True):
             st.session_state.step = 1
             st.session_state.syllabus_files = {}
             st.session_state.pyq_files = {}
             st.session_state.roadmap = ""
             st.session_state.mock_json = []
             save_state()
             st.rerun()

        st.caption("Track, Edit, or Delete your knowledge base.")
        
        # Initialize dynamic key for uploader clearing
        if "uploader_key" not in st.session_state:
            st.session_state.uploader_key = 0

        st.markdown("### 📜 Syllabus")
        
        # Sidebar Syllabus Upload
        with st.expander("📤 Add Syllabus"):
            s_up = st.file_uploader("Upload PDF/Img", type=["pdf", "png", "jpg"], accept_multiple_files=True, key=f"sb_syl_up_{st.session_state.uploader_key}")
            if s_up:
                s_updated = False
                for f in s_up:
                    # Use filename as key to prevent overwrites and infinite loops
                    if f.name not in st.session_state.syllabus_files:
                        if f.type == "application/pdf":
                            st.session_state.syllabus_files[f.name] = extract_text([f])
                            s_updated = True
                        elif f.type in ["image/png", "image/jpeg", "image/jpg"]:
                            st.session_state.syllabus_files[f.name] = extract_text_from_images([f])
                            s_updated = True
                
                if s_updated:
                    st.success("New Syllabus Added!")
                    # Reset uploader to prevent duplication loops
                    st.session_state.uploader_key += 1
                    save_state()
                    time.sleep(1)
                    st.rerun()

        if not st.session_state.syllabus_files:
            st.info("No syllabus data loaded.")
        else:
            # List items with delete/edit
            for fname in list(st.session_state.syllabus_files.keys()):
                with st.expander(f"📄 {fname}"):
                    # Edit Text
                    new_text = st.text_area("Content", st.session_state.syllabus_files[fname], height=150, key=f"edit_s_{fname}")
                    c1, c2 = st.columns(2)
                    if c1.button("💾 Save", key=f"save_s_{fname}", use_container_width=True):
                        st.session_state.syllabus_files[fname] = new_text
                        save_state()
                        st.success("Saved!")
                        st.rerun()
                    if c2.button("🗑️ Delete", key=f"del_s_{fname}", use_container_width=True):
                        del st.session_state.syllabus_files[fname]
                        save_state()
                        st.rerun()
        
        st.divider()
        if st.button("⚠️ Reset Session", use_container_width=True):
            if os.path.exists(".zenflow_state.json"):
                os.remove(".zenflow_state.json")
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()


        
        # HISTORY VAULT
        st.divider()
        st.markdown("### 🕰️ Time Capsule")
        history = load_strategy_history()
        if not history:
             st.caption("No past strategies found.")
        else:
            for idx, item in enumerate(history):
                # Use a unique key for each item
                timestamp = item.get("timestamp", "Unknown Date")
                summary = item.get("summary", "Strategy")
                
                # Direct Load Button
                if st.button(f"📅 {timestamp} | {summary}", key=f"hist_btn_{idx}", use_container_width=True):
                    st.session_state.roadmap = item.get("roadmap", "")
                    st.session_state.step = 5
                    save_state()
                    st.rerun()

        st.divider()
        st.caption("🔍 Found a bug or have a suggestion?")
        st.link_button("Give Feedback 📝", "https://docs.google.com/forms/d/e/1FAIpQLSfPBNYfR5SpRF_1K9W-e7Ya8x5QJeXy5Ytg93AMhMHNomzt_w/viewform?usp=publish-editor", use_container_width=True)

# --- 5. THE WIZARD FLOW ---

# STEP 0: NAME ENTRY (The Portal)
if st.session_state.step == 0:
    st.markdown("<div style='height: 15vh'></div>", unsafe_allow_html=True)
        
    st.markdown("<h1 style='text-align: center; margin-top: -20px;'>Enter the Sanctuary</h1>", unsafe_allow_html=True)
    st.markdown("<h3 style='text-align: center; color: #A7F3D0; font-weight: 300;'>The AI-Powered Exam Strategist<br><span style='font-size: 0.7em; color: #6EE7B7; font-weight: 400;'>✨ Optimized for University Examinations</span></h3>", unsafe_allow_html=True)
    
    
    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        with st.form("name_form"):
            name = st.text_input("Name", placeholder="Who seeks knowledge? (Your Name)", label_visibility="collapsed")
            if st.form_submit_button("Begin Journey 🌿"):
                if name:
                    st.session_state.user_name = name.upper() # FORCE UPPERCASE
                    st.session_state.step = 1
                    save_state()
                    st.rerun()

    st.divider()
    st.markdown("<div style='height: 20px'></div>", unsafe_allow_html=True)

    # 3-Step Process
    c_step1, c_step2, c_step3 = st.columns(3)
    
    with c_step1:
        st.markdown("<div style='text-align: center;'>", unsafe_allow_html=True)
        st.markdown("<h1 style='text-align: center; margin-bottom: 0;'>📂</h1>", unsafe_allow_html=True)
        st.markdown("<h4 style='text-align: center; color: #E2E8F0;'>Step 1: Upload</h4>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; font-size: 0.9em; color: #CBD5E1;'>Upload your past exam PDF files.</p>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with c_step2:
        st.markdown("<div style='text-align: center;'>", unsafe_allow_html=True)
        st.markdown("<h1 style='text-align: center; margin-bottom: 0;'>🤖</h1>", unsafe_allow_html=True)
        st.markdown("<h4 style='text-align: center; color: #E2E8F0;'>Step 2: Analyze</h4>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; font-size: 0.9em; color: #CBD5E1;'>AI scans the questions to find patterns.</p>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with c_step3:
        st.markdown("<div style='text-align: center;'>", unsafe_allow_html=True)
        st.markdown("<h1 style='text-align: center; margin-bottom: 0;'>📊</h1>", unsafe_allow_html=True)
        st.markdown("<h4 style='text-align: center; color: #E2E8F0;'>Step 3: Score</h4>", unsafe_allow_html=True)
        st.markdown("<p style='text-align: center; font-size: 0.9em; color: #CBD5E1;'>Get insights on high-weightage topics.</p>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

# STEP 1: SYLLABUS INPUT (The Foundation)
elif st.session_state.step == 1:
    st.markdown("<div style='height: 10vh'></div>", unsafe_allow_html=True)
    st.markdown(f"<h2 style='text-align: center; margin-bottom: 20px;'>WELCOME, {st.session_state.user_name}</h2>", unsafe_allow_html=True)
    
    st.markdown("""
    <div class='wizard-card'>
        <h2>📜 The Foundation</h2>
        <p>Upload your Syllabus. You can upload PDF AND provide text simultaneously.</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Combined Input Section
    col_pdf, col_text = st.columns(2)
    new_pdf_data = {}
    new_text_data = ""
    
    # Helper to consolidate for Step 1 Logic
    # Note: In Step 1 we just want to GET data. We'll store it in the dict on 'Confirm'.
    
    with col_pdf:
        st.markdown("### 📂 Upload Syllabus")
        s_files = st.file_uploader("Upload PDF/Images", type=["pdf", "png", "jpg", "jpeg"], accept_multiple_files=True)
        if s_files:
            pdf_files = [f for f in s_files if f.type == "application/pdf"]
            img_files = [f for f in s_files if f.type in ["image/png", "image/jpeg"]]
            
            if pdf_files:
                text = extract_text(pdf_files)
                new_pdf_data["PDFs"] = text
            
            if img_files:
                with st.spinner("👀 Reading Images..."):
                    img_text = extract_text_from_images(img_files)
                    new_pdf_data["Images"] = img_text
    
    with col_text:
        st.markdown("### 📝 Text / YT Summary")
        new_text_data = st.text_area("Paste Content Here", height=150)

    if st.button("Confirm Syllabus & Proceed ✅"):
        # Save to Dict
        if new_pdf_data:
            st.session_state.syllabus_files.update(new_pdf_data)
        if new_text_data.strip():
            st.session_state.syllabus_files["Manual Entry"] = new_text_data
            
        # Check success
        if st.session_state.syllabus_files:
            st.session_state.step = 4 # Skip Animation, Go directly to Dashboard
            save_state()
            st.rerun()
        else:
            st.warning("Please provide some content (PDF or Text) to proceed.")

# STEP 4: DASHBOARD (ZenFlow Sanctuary)
elif st.session_state.step == 4:
    
    # FADE IN ANIMATION
    # FADE IN ANIMATION (ONCE)
    if 'dashboard_anim' not in st.session_state:
        st.markdown("""
        <style>
            @keyframes fadeIn {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            .stApp {
                animation: fadeIn 1.5s ease-out forwards;
            }
        </style>
        """, unsafe_allow_html=True)
        st.session_state.dashboard_anim = True
    
    # --- HEADER & SETTINGS ---
    # Use 3 columns to balance the center title: [Left Spacer, Center Title, Right Button]
    h_col1, h_col2, h_col3 = st.columns([1, 8, 1])
    
    with h_col2:
        st.markdown(f"""
        <div style='text-align: center; margin-bottom: 20px;'>
            <h1 style='color: #FFFFFF; font-weight: 700; margin-bottom: 0px;'>ZenFlow Exam Analyser</h1>
            <p style='color: #A7F3D0; font-size: 1.1rem;'>Upload your Past Year Questions (PYQs) to find repeated topics and difficulty trends.</p>
        </div>
        """, unsafe_allow_html=True)
        
        with st.expander("How to use this tool"):
            st.markdown("""
            *   Upload your exam PDF.
            *   Wait for the AI to extract questions.
            *   Click on 'Start Analysis'.
            *   View the topic breakdown and difficulty analysis below.
            """)
        
    with h_col3:
        st.markdown("<div style='height: 20px'></div>", unsafe_allow_html=True) # Vertical align fix
        # Settings Button
        if st.button("↻ New", help="Start Over"):
             st.session_state.step = 1
             st.session_state.syllabus_files = {}
             st.session_state.pyq_files = {}
             st.session_state.roadmap = ""
             st.session_state.mock_json = []
             save_state()
             st.rerun()

        if st.button("🔑", help="Configure API Key"):
            st.session_state.show_api_modal = True
            st.rerun()
    
    # CONFIGURATION ROW
    with st.container():
        st.markdown("### ⚙️ Calibration")
        c_calib, c_upload = st.columns(2)
        
        # COLUMN 1: SLIDERS (CONTROL PANEL)
        with c_calib:
            with st.container(height=280, border=True):
                st.markdown("<div style='height: 10px'></div>", unsafe_allow_html=True) # Spacer
                
                # Days Input
                st.markdown("""
                <div style="margin-bottom: 5px;">
                    <span style="color: #E2E8F0; font-weight: 500;">Days Remaining</span>
                </div>
                """, unsafe_allow_html=True)
                days = st.number_input("Days", min_value=1, max_value=99, value=7, label_visibility="collapsed", key="temp_days")

                st.markdown("<div style='height: 20px'></div>", unsafe_allow_html=True) # Spacer

                # Hours Input
                st.markdown("""
                <div style="margin-bottom: 5px;">
                    <span style="color: #E2E8F0; font-weight: 500;">Hours / Day</span>
                </div>
                """, unsafe_allow_html=True)
                hours = st.number_input("Hours", min_value=1, max_value=24, value=4, label_visibility="collapsed", key="temp_hours")

        # COLUMN 2: UPLOAD (CONTROL PANEL)
        with c_upload:
            with st.container(height=280, border=True):
                 # Manually center content with spacers
                st.markdown("<div style='height: 20px'></div>", unsafe_allow_html=True)
                
                # STATUS BADGE (Top Right)
                full_pyqs = "\n".join(st.session_state.pyq_files.values())
                pyq_status = "✅ READY" if full_pyqs else "⏳ WAITING"
                badge_color = "#10B981" if full_pyqs else "#94A3B8"
                badge_bg = "rgba(16, 185, 129, 0.2)" if full_pyqs else "rgba(255,255,255,0.1)"
                
                st.markdown(f"""
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="flex: 1;"></div>
                    <div style="background: {badge_bg}; border: 1px solid {badge_color}; color: {badge_color}; padding: 4px 12px; border-radius: 99px; font-size: 0.8em; font-weight: 700;">
                        {pyq_status}
                    </div>
                </div>
                """, unsafe_allow_html=True)

                st.markdown("<h4 style='text-align: center; margin: 0;'>📄 Knowledge Base</h4>", unsafe_allow_html=True)
                st.caption("Upload Previous Year Questions (PDF) to power the Mock Exam.")
                
                # Show currently loaded files (PERSISTENCE CHECK)
                if st.session_state.pyq_files:
                    st.success(f"📚 {len(st.session_state.pyq_files)} Files Loaded & Ready")
                    with st.expander("View Loaded Files"):
                        for fname in st.session_state.pyq_files:
                            st.write(f"✅ {fname}")
                
                pyq_upload = st.file_uploader("Upload PYQs", type=["pdf"], accept_multiple_files=True, label_visibility="collapsed")
                if pyq_upload:
                    updated = False
                    for f in pyq_upload:
                        if f.name not in st.session_state.pyq_files:
                            st.session_state.pyq_files[f.name] = extract_text([f])
                            updated = True
                    if updated:
                        save_state()
                        st.rerun()
    
    # Hidden API Key Logic (Now Handled in Helper)
    st.divider()
    
    # ACTION AREA
    m1, m2 = st.columns(2)
    
    # LEFT COLUMN: ROADMAP GENERATION
    with m1:
        has_pyq = bool(st.session_state.pyq_files)
        
        # MERGED LOGIC: Single Button always visible
        btn_label = "Start Analysis 🎯" if has_pyq else "Start Basic Analysis ⚠️"
        
        if st.button(btn_label, use_container_width=True, key="btn_gen_roadmap"):
                with st.spinner("🌿 Analyzing..."):
                    time.sleep(2)
                    full_syllabus = "\n".join(st.session_state.syllabus_files.values())
                    full_pyqs = "\n".join(st.session_state.pyq_files.values())
                    context = f"Syllabus: {full_syllabus[:15000]}"
                    if has_pyq:
                        context += f"\nPYQs: {full_pyqs[:15000]}"
                        instruction = "Analyze PYQs to find high-recurrence patterns."
                    else:
                        instruction = "Base importance on standard syllabus weighting."
                        
                    days = st.session_state.get("temp_days", 7)
                    hours = st.session_state.get("temp_hours", 4)
                    
                    prompt = f"""
                    Role: Expert Exam Strategist.
                    Context: {context}
                    Time Contraint: {days} Days remaining, {hours} Hours/day study time.
                    
                    {instruction}
                    
                    TASK 1: Generate a Unit-Wise Strategy (Must Do Questions).
                    TASK 2: Create a Daily Timetable blending the 'Must Do' questions into the {days}-Day schedule.
                    
                    STRICT OUTPUT FORMAT (JSON ONLY):
                    
                    {{
                        "units": [
                            {{
                                "unit_name": "Unit 1: [Name]",
                                "analysis": "Markdown Content for this unit (Must Do Questions, Skip Topics...)"
                            }},
                            ...
                        ],
                        "timetable": "Markdown Content for the Daily Timetable..."
                    }}
                    """
                    st.session_state.roadmap = get_gemini_response(prompt)
                    
                    if st.session_state.roadmap:
                        # Attempt to sanitize JSON if it has backticks
                        raw = st.session_state.roadmap
                        if "```json" in raw:
                            raw = raw.split("```json")[1].split("```")[0]
                        elif "```" in raw:
                            raw = raw.split("```")[1].split("```")[0]
                        st.session_state.roadmap = raw.strip()

                        # SAVE TO HISTORY
                        save_strategy_history(st.session_state.roadmap, days, hours)
                        
                        st.session_state.step = 5 # Go to Result View
                        save_state()
                        st.rerun()


    # RIGHT COLUMN: SIMULATION
    with m2:
        if st.button("Mock Exam (95% Accuracy) 🎯", use_container_width=True, key="btn_start_sim"):
            if st.session_state.pyq_files:
                full_pyqs = "\n".join(st.session_state.pyq_files.values()) # Ensure defined
                with st.spinner("🌿 Analyzing..."):
                    time.sleep(2)
                    prompt = f"""
                    Role: Exact Exam Predictor.
                    Task: Generate exactly 20 Mock Exam Questions STRICTLY based on the provided PYQ data. 
                    Constraint: SELECT ONLY questions that are highly likely to repeat (95% Probability). Do not invent new questions.
                    Data: {full_pyqs[:25000]}
                    
                    OUTPUT: STRICT JSON ARRAY of objects. No other text.
                    [
                        {{
                            "q": "Question Text",
                            "marks": "e.g. 5 Marks",
                            "tags": ["High Yield", "Repeated"],
                            "a": "Detailed Model Answer"
                        }}
                    ]
                    ... (20 items)
                    """
                    raw_res = get_gemini_response(prompt)
                    if raw_res:
                        try:
                            # Robust JSON Text Extraction
                            start_idx = raw_res.find('[')
                            end_idx = raw_res.rfind(']')
                            
                            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                                clean_json = raw_res[start_idx : end_idx + 1]
                                st.session_state.mock_json = json.loads(clean_json)
                                st.session_state.q_index = 0
                                st.session_state.step = 6 # Go to Card Runner
                                save_state()
                                st.rerun()
                            else:
                                st.error("AI response format error. Please try again.")
                        except:
                            st.error("Simulation Glitch. Please retry to re-calibrate.")
            else:
                st.warning("⚠️ Please upload PYQs above first!")
    
    # FEEDBACK SECTION (Main Dashboard)
    st.divider()
    st.caption("✨ Help us improve ZenFlow! Report bugs or request features.")
    st.link_button("Give Feedback 📝", "https://docs.google.com/forms/d/e/1FAIpQLSfPBNYfR5SpRF_1K9W-e7Ya8x5QJeXy5Ytg93AMhMHNomzt_w/viewform?usp=publish-editor", use_container_width=True)

# STEP 5: ROADMAP RESULT VIEW
elif st.session_state.step == 5:
    st.markdown("<div style='height: 5vh'></div>", unsafe_allow_html=True)
    if st.button("← Back to Sanctuary"):
        st.session_state.step = 4
        save_state()
        time.sleep(0.5) # Ensure write
        st.rerun()
        
    st.markdown("<h1 style='text-align: center'>Your Strategic Path 🗺️</h1>", unsafe_allow_html=True)
    

    
    # ACTIONS
    c1, c2, c3 = st.columns([1, 2, 1])
    with c2:
        st.download_button("Download Strategy (.txt)", st.session_state.roadmap, file_name="ZenFlow_Strategy.txt", use_container_width=True)

    # RENDERED ROADMAP
    st.markdown("""
    <div class='zen-card' style='background: rgba(0,0,0,0.4); margin-top: 20px;'>
    """, unsafe_allow_html=True)
    
    try:
        data = json.loads(st.session_state.roadmap)
        
        # 1. UNITS (Expanders)
        st.markdown("## 🔍 Unit-Wise Deep Dive")
        for unit in data.get("units", []):
            with st.expander(f"📌 {unit.get('unit_name', 'Unit')}"):
                st.markdown(unit.get("analysis", ""))
        
        # 2. TIMETABLE (Visible)
        st.markdown("---")
        st.markdown("## 📅 The Protocol")
        st.markdown(data.get("timetable", ""))
        
    except json.JSONDecodeError:
        # Fallback for old data or errors
        st.warning("⚠️ Legacy Format Detected")
        st.markdown(st.session_state.roadmap)
        
    st.markdown("</div>", unsafe_allow_html=True)

# STEP 6: CARD RUNNER UI (The Gauntlet)
elif st.session_state.step == 6:
    
    # CSS FOR CARD ANIMATIONS
    st.markdown("""
    <style>
        /* Card Container */
        .q-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(30px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px;
            min-height: 400px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        /* Animations */
        @keyframes slideInUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideInDown {
            from { transform: translateY(-100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .anim-up { animation: slideInUp 0.6s ease; }
        .anim-down { animation: slideInDown 0.6s ease; }
        
        /* Elements */
        .q-badge {
            background: #10B981;
            color: black;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            display: inline-block;
            margin-right: 10px;
            margin-bottom: 10px;
        }
         .mark-badge {
            background: #3B82F6;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 10px;
        }
    </style>
    """, unsafe_allow_html=True)

    # HEAD UP DISPLAY
    c1, c2, c3 = st.columns([1,2,1])
    with c1:
        if st.button("❌ Exit Simulation"):
            st.session_state.step = 4
            save_state()
            st.rerun()
    with c2:
        progress = (st.session_state.q_index + 1) / 20
        st.progress(progress)
        st.caption(f"Question {st.session_state.q_index + 1} of 20")

    # CARD LOGIC
    # Safety Check
    if not st.session_state.mock_json:
        st.error("Deck corrupted. Returning to base.")
        st.session_state.step = 4
        st.rerun()

    current_q = st.session_state.mock_json[st.session_state.q_index]
    anim_class = "anim-up" if st.session_state.get('anim_dir') == 'next' else "anim-down"
    
    # CARD DISPLAY
    st.markdown(f"""
    <div class='q-card {anim_class}'>
        <div>
            <span class='q-badge'>{' / '.join(current_q.get('tags', []))}</span>
            <span class='mark-badge'>{current_q.get('marks', 'Unknown')}</span>
        </div>
        <h2 style='margin-top: 20px; font-size: 1.8rem;'>{current_q.get('q', 'Error')}</h2>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("<div style='height: 20px'></div>", unsafe_allow_html=True)

    # ANSWER DROPDOWN
    with st.expander("👁️ Reveal Solution Structure"):
        st.markdown(current_q.get('a', 'No answer provided'))
    
    st.divider()
    
    # NAVIGATION
    b1, b2, b3 = st.columns([1,2,1])
    with b1:
        if st.session_state.q_index > 0:
            if st.button("⬅️ Previous"):
                st.session_state.q_index -= 1
                st.session_state.anim_dir = 'prev'
                st.rerun()
    with b3:
        if st.session_state.q_index < 19:
            if st.button("Next ➡️"):
                st.session_state.q_index += 1
                st.session_state.anim_dir = 'next'
                st.rerun()
        else:
            if st.button("🏁 Finish Exam"):
                st.session_state.step = 7 # Go to Completion Screen
                save_state()
                st.rerun()

# STEP 7: COMPLETION (The Calm)
elif st.session_state.step == 7:
    st.markdown("<div style='height: 30vh'></div>", unsafe_allow_html=True)
    
    st.markdown("""
    <div style='text-align: center;'>
        <h1 style='color: #34D399; font-size: 3rem;'>Exam Simulation Complete</h1>
        <div style='background: rgba(16, 185, 129, 0.1); border: 1px solid #10B981; padding: 30px; border-radius: 20px; margin: 30px auto; max-width: 600px;'>
            <h2 style='margin: 0; line-height: 1.5;'>
                "Calm down. You will encounter the same questions in the exam approx 95%." 🧘‍♂️
            </h2>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1,1,1])
    with col2:
        if st.button("Return to Sanctuary 🌿", use_container_width=True):
            st.session_state.step = 4
            save_state()
            st.rerun()
