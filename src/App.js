// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // You'll need to create a simple CSS file

// --- Configuration ---
// The URL is read from the environment variable (Vercel injection)
const API_BASE_URL = process.env.REACT_APP_API_URL;

// --- Helper Components ---

// Component 1: The unified landing page
const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        <h1>🌱 GENFIN-AFRICA Demo System</h1>
        <p>Select a user role to begin the stage-based financing flow demonstration.</p>
        <div className="role-buttons">
            <button className="btn-farmer" onClick={() => setView('farmer')}>
                Farmer Chatbot Mock
            </button>
            <button className="btn-lender" onClick={() => setView('lender')}>
                Lender/Admin Dashboard
            </button>
        </div>
        <p className="disclaimer">Backend hosted securely on PythonAnywhere.</p>
    </div>
);

// Component 2: Displays the stage data for a single farmer (used by Lender Detail)
const StageTracker = ({ farmerId, stages, name, phone, totalDisbursed, onApproval }) => (
    <div className="tracker-box">
        <h2>{name}'s Loan Status</h2>
        <p><strong>Phone:</strong> {phone} | <strong>Total Disbursed (Mock):</strong> ${totalDisbursed.toFixed(2)}</p>
        
        {stages.map(stage => (
            <div key={stage.number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                <span className="stage-icon">{
                    stage.status === 'COMPLETED' ? '✅' :
                    stage.status === 'UNLOCKED' ? '🔓' : '🔒'
                }</span>
                <span className="stage-name">Stage {stage.number}: {stage.name}</span>
                <span className="stage-disbursement">(${stage.disbursement_mock.toFixed(2)})</span>
                
                {/* Lender Action: Show Approve button ONLY if stage is UNLOCKED */}
                {stage.status === 'UNLOCKED' && (
                    <button 
                        className="btn-approve" 
                        onClick={() => onApproval(farmerId, stage.number)}>
                        Approve Stage
                    </button>
                )}
            </div>
        ))}

        <a 
            href={`${API_BASE_URL}/report/${farmerId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-report"
        >
            Export PDF Report 📄
        </a>
    </div>
);


// --- Lender Dashboard Implementation ---
const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);

    // 1. Fetch the list of all farmers
    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmers/list`);
            setFarmers(response.data);
            setSelectedFarmer(null); // Clear detail view
        } catch (error) {
            console.error("Failed to fetch farmer list:", error);
        }
    };
    
    // 2. Fetch details for a single farmer
    const fetchFarmerDetails = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/status/${id}`);
            setSelectedFarmer(response.data);
        } catch (error) {
            console.error("Failed to fetch farmer details:", error);
        }
    };

    // 3. Approval action (Lender/Admin)
    const handleApproval = async (farmerId, stageNumber) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/stage/approve/${farmerId}/${stageNumber}`);
            alert(`SUCCESS: ${response.data.message}`);
            // After successful approval, re-fetch details to update UI
            fetchFarmerDetails(farmerId); 
            fetchFarmers(); // Refresh the list summary
        } catch (error) {
            alert(`Approval Failed: ${error.response.data.message}`);
        }
    };

    // Initial load
    React.useEffect(() => {
        fetchFarmers();
    }, []);

    if (selectedFarmer) {
        // Detail View
        return (
            <div className="dashboard-detail">
                <button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button>
                <StageTracker
                    farmerId={selectedFarmer.farmer.id}
                    stages={selectedFarmer.stages}
                    name={selectedFarmer.farmer.name}
                    phone={selectedFarmer.farmer.phone}
                    totalDisbursed={selectedFarmer.total_disbursed}
                    onApproval={handleApproval}
                />
            </div>
        );
    }

    // List View
    return (
        <div className="dashboard-list-container">
            <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
            <h1>Lender/Admin Dashboard</h1>
            <p>Monitor progress and approve stage-based disbursements. <button onClick={fetchFarmers}>Refresh</button></p>
            <div className="farmer-list">
                {farmers.length === 0 ? (
                    <p>No farmers registered. Use the Farmer Mock-up to register one!</p>
                ) : (
                    farmers.map(farmer => (
                        <div key={farmer.id} className="farmer-card">
                            <h3>{farmer.name}</h3>
                            <p>ID: {farmer.id} | Progress: {farmer.progress}</p>
                            <button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Farmer Chatbot Mock Implementation ---
const FarmerChatbotMock = ({ setView }) => {
    // This component will handle registration and stage triggering 
    // to mock the user interaction from the BRS.
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState('');
    const [flowState, setFlowState] = useState('INTRO'); // INTRO, REGISTER_NAME, REGISTER_PHONE, REGISTER_CROP, READY, GET_ID
    const [farmerData, setFarmerData] = useState({});
    const [farmerId, setFarmerId] = useState(null);

    const botMessage = (text) => setChatHistory(prev => [...prev, { sender: 'BOT', text, time: new Date() }]);
    const userMessage = (text) => setChatHistory(prev => [...prev, { sender: 'USER', text, time: new Date() }]);

    const addMessage = (sender, text) => {
        setChatHistory(prev => [...prev, { sender, text, time: new Date() }]);
        // Scroll to bottom functionality would be implemented here in a real chat box
    };

    const startFlow = () => {
        setChatHistory([]);
        setFarmerId(null);
        botMessage("Welcome to the GENFIN-AFRICA demo chat! Type 'REGISTER' or 'STATUS'.");
        setFlowState('INTRO');
    };

    React.useEffect(() => {
        startFlow();
    }, []);

    // Function to handle farmer registration API call
    const handleRegistration = async () => {
        addMessage('BOT', "Submitting registration...");
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, {
                ...farmerData,
                land_size: 5.0 // Hardcode land size for simplicity
            });
            const newId = response.data.farmer_id;
            setFarmerId(newId);
            setFlowState('READY');
            addMessage('BOT', `✅ Success! You are registered. Your ID is ${newId}. Stage 1 (Soil Test) is UNLOCKED.`);
            addMessage('BOT', `Type 'TRIGGER' to submit a stage milestone or 'STATUS' to check progress.`);
        } catch (error) {
            addMessage('BOT', `❌ Registration failed: ${error.response.data.message}`);
            setFlowState('INTRO'); // Go back to start
        }
        setFarmerData({}); // Clear buffer
    };

    // Function to handle stage triggering API call
    const handleTrigger = async () => {
        // First, check what the UNLOCKED stage is
        const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/status/${farmerId}`);
        const nextStage = statusResponse.data.stages.find(s => s.status === 'UNLOCKED');

        if (!nextStage) {
            addMessage('BOT', "No stages are currently UNLOCKED. You must wait for Admin approval!");
            return;
        }

        addMessage('BOT', `Received confirmation for Stage ${nextStage.number} (${nextStage.name}). Submitting to Field Officer for review...`);

        try {
            // Note: For this mock, the farmer triggering immediately results in approval (simulating rapid admin action)
            const approvalResponse = await axios.post(`${API_BASE_URL}/api/stage/approve/${farmerId}/${nextStage.number}`);
            
            addMessage('BOT', `🎉 SUCCESS: ${approvalResponse.data.message}`);
            addMessage('BOT', `Type 'TRIGGER' for the next step or 'STATUS' to check progress.`);
        } catch (error) {
            addMessage('BOT', `❌ Trigger Failed: ${error.response.data.message}`);
        }
    };
    
    // Function to handle status check API call
    const handleStatus = async () => {
        try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/status/${farmerId}`);
            const stagesText = statusResponse.data.stages.map(s => 
                `${s.status === 'COMPLETED' ? '✅' : s.status === 'UNLOCKED' ? '🔓' : '🔒'} Stage ${s.number}: ${s.name} - ${s.status}`).join('\n');
            
            addMessage('BOT', `--- YOUR STATUS ---\n${stagesText}\nTotal Disbursed: $${statusResponse.data.total_disbursed.toFixed(2)}`);
        } catch (error) {
             addMessage('BOT', `❌ Failed to fetch status. Are you sure your ID is correct?`);
        }
    };

    // Main input handler (The Chatbot Brain)
    const handleInput = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;
        
        addMessage('USER', text);
        setInput('');

        // Logic based on flowState
        if (flowState === 'INTRO') {
            if (text.toUpperCase() === 'REGISTER') {
                botMessage("What is your full name?");
                setFlowState('REGISTER_NAME');
            } else if (text.toUpperCase() === 'STATUS') {
                 botMessage("Please enter your Farmer ID.");
                 setFlowState('GET_ID');
            } else {
                botMessage("Please type 'REGISTER' or 'STATUS'.");
            }
        } else if (flowState === 'GET_ID') {
            const id = parseInt(text);
            if (!isNaN(id)) {
                setFarmerId(id);
                setFlowState('READY');
                handleStatus();
                botMessage("Type 'TRIGGER' for the next step or 'STATUS' to check progress.");
            } else {
                 botMessage("Invalid ID. Please enter a number.");
            }
        } else if (flowState === 'REGISTER_NAME') {
            setFarmerData(prev => ({ ...prev, name: text }));
            botMessage("What is your phone number? (e.g., 2547...)");
            setFlowState('REGISTER_PHONE');
        } else if (flowState === 'REGISTER_PHONE') {
            setFarmerData(prev => ({ ...prev, phone: text }));
            botMessage("Which crop will you be growing?");
            setFlowState('REGISTER_CROP');
        } else if (flowState === 'REGISTER_CROP') {
            setFarmerData(prev => ({ ...prev, crop: text }));
            handleRegistration(); // Final step of registration
        } else if (flowState === 'READY') {
            if (text.toUpperCase() === 'TRIGGER') {
                handleTrigger();
            } else if (text.toUpperCase() === 'STATUS') {
                handleStatus();
            } else {
                botMessage("Type 'TRIGGER' or 'STATUS'.");
            }
        }
    };


    return (
        <div className="chatbot-container">
            <div className="chat-header">
                <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
                <h2>WhatsApp Chatbot Mock</h2>
            </div>
            <div className="chat-window">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`message-row ${msg.sender.toLowerCase()}`}>
                        <div className="message-bubble">
                            {msg.sender === 'BOT' ? '🤖' : '🧑‍🌾'} {msg.text}
                            <span className="timestamp">{msg.time.toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
                {/* Scroll to bottom element would go here */}
            </div>
            <form onSubmit={handleInput} className="chat-input-form">
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder="Type your message..." 
                    disabled={!flowState}
                />
                <button type="submit" disabled={!flowState}>Send</button>
            </form>
        </div>
    );
};


// --- Main App Component ---
function App() {
    const [view, setView] = useState('welcome'); // welcome, farmer, or lender

    const renderView = () => {
        switch (view) {
            case 'farmer':
                return <FarmerChatbotMock setView={setView} />;
            case 'lender':
                return <LenderDashboard setView={setView} />;
            case 'welcome':
            default:
                return <WelcomeScreen setView={setView} />;
        }
    };

    return (
        <div className="App">
            {renderView()}
        </div>
    );
}

export default App;
  
