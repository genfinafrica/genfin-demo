// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Ensure this matches the URL where your Flask backend is running
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        <h2>GENFIN 🌱 AFRICA</h2>
        <p><b>G20 TechSprint 2025 Demo</b></p>
        <p>Select a user role to begin the stage-based financing flow demonstration.</p>
        <div className="role-buttons">
            <button className="btn-farmer" onClick={() => setView('farmer')}>
                Farmer Chatbot Mock
            </button>
            <button className="btn-lender" onClick={() => setView('lender')}>
                Lender/Admin Dashboard
            </button>
            <button className="btn-field-officer" onClick={() => setView('fieldOfficer')}>
                Field Officer Dashboard
            </button>
        </div>
        
    </div>
);

const StageTracker = ({ farmerId, stages, uploads = [], name, phone, totalDisbursed, score, onApproval, onDisburse }) => (
    <div className="tracker-box">
        <h2>{name}'s Loan Status</h2>
        <p><strong>Phone:</strong> {phone} | <strong>Total Disbursed (Mock):</strong> ${totalDisbursed.toFixed(2)} | <strong>Score:</strong> {score}</p>
        
        {stages.map(stage => (
            <div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                <span className="stage-icon">{
                    stage.status === 'COMPLETED' ? '✅' :
                    stage.status === 'APPROVED' ? '✔️' :
                    stage.status === 'PENDING' ? '⏳' :
                    stage.status === 'UNLOCKED' ? '🔓' : 
                    '🔒'
                }</span>
                <span className="stage-name">Stage {stage.stage_number}: {stage.stage_name}</span>
                <span className="stage-disbursement">(${stage.disbursement_amount.toFixed(2)})</span>
                <div className="stage-uploads">
                    Uploads: {uploads.filter(u => u.stage_number === stage.stage_number).map(u => u.file_name).join(', ') || 'None'}
                </div>
                {stage.status === 'PENDING' && onApproval && (
                    <button 
                        className="btn-approve" 
                        onClick={() => onApproval(farmerId, stage.stage_number)}>
                        Approve Stage
                    </button>
                )}
                {stage.status === 'APPROVED' && onDisburse && (
                    <button 
                        className="btn-approve" 
                        onClick={() => onDisburse(farmerId, stage.stage_number)}>
                        Disburse Funds
                    </button>
                )}
            </div>
        ))}

        <a 
            href={`${API_BASE_URL}/api/report/farmer/${farmerId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-report"
        >
            Export PDF Report 📄
        </a>
    </div>
);

const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [error, setError] = useState(null);

    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
            setError(null);
        } catch (error) {
            console.error("Failed to fetch farmer list:", error);
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const fetchFarmerDetails = async (id) => {
        try {
            console.log(`Lender: Fetching details for farmer ID: ${id}`);
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setSelectedFarmer(response.data);
            setError(null);
        } catch (error) {
            console.error(`Lender: Failed to fetch farmer details for ID ${id}:`, error);
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleDisburse = async (farmerId, stageNumber) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/lender/disburse/${farmerId}/${stageNumber}`);
            alert(`SUCCESS: ${response.data.message}`);
            fetchFarmerDetails(farmerId);
            fetchFarmers();
        } catch (error) {
            alert(`Disbursement Failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    useEffect(() => {
        fetchFarmers();
        const interval = setInterval(fetchFarmers, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    if (selectedFarmer) {
        return (
            <div className="dashboard-detail">
                <button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button>
                <StageTracker
                    farmerId={selectedFarmer.farmer_id}
                    stages={selectedFarmer.stages}
                    uploads={selectedFarmer.uploads}
                    name={selectedFarmer.name}
                    phone={selectedFarmer.phone}
                    totalDisbursed={selectedFarmer.current_status.total_disbursed}
                    score={selectedFarmer.current_status.score}
                    onDisburse={handleDisburse}
                />
            </div>
        );
    }

    return (
        <div className="dashboard-list-container">
            <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
            <h1>Lender/Admin Dashboard</h1>
            <p>Monitor progress and disburse funds for approved stages. <button onClick={fetchFarmers}>Refresh</button></p>
            {error && <p className="error">{error}</p>}
            <div className="farmer-list">
                {farmers.length === 0 ? (
                    <p>No farmers registered. Use the Farmer Mock-up to register one!</p>
                ) : (
                    farmers.map(farmer => (
                        <div key={farmer.id} className="farmer-card">
                            <h3>{farmer.name}</h3>
                            <p>ID: {farmer.id} | Progress: {farmer.stages_completed} | Score: {farmer.score}</p>
                            <button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const FieldOfficerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [error, setError] = useState(null);

    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
            setError(null);
        } catch (error) {
            console.error("Field Officer: Failed to fetch farmer list:", error);
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const fetchFarmerDetails = async (id) => {
        try {
            console.log(`Field Officer: Fetching details for farmer ID: ${id}`);
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setSelectedFarmer(response.data);
            setError(null);
        } catch (error) {
            console.error(`Field Officer: Failed to fetch farmer details for ID ${id}:`, error);
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleApproval = async (farmerId, stageNumber) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/approve/${farmerId}/${stageNumber}`);
            alert(`SUCCESS: ${response.data.message}`);
            fetchFarmerDetails(farmerId);
            fetchFarmers();
        } catch (error) {
            alert(`Approval Failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    useEffect(() => {
        fetchFarmers();
        const interval = setInterval(fetchFarmers, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    if (selectedFarmer) {
        return (
            <div className="dashboard-detail">
                <button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button>
                <StageTracker
                    farmerId={selectedFarmer.farmer_id}
                    stages={selectedFarmer.stages}
                    uploads={selectedFarmer.uploads}
                    name={selectedFarmer.name}
                    phone={selectedFarmer.phone}
                    totalDisbursed={selectedFarmer.current_status.total_disbursed}
                    score={selectedFarmer.current_status.score}
                    onApproval={handleApproval}
                />
            </div>
        );
    }

    return (
        <div className="dashboard-list-container">
            <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
            <h1>Field Officer Dashboard</h1>
            <p>Review uploads and approve stage-based milestones. <button onClick={fetchFarmers}>Refresh</button></p>
            {error && <p className="error">{error}</p>}
            <div className="farmer-list">
                {farmers.length === 0 ? (
                    <p>No farmers registered. Use the Farmer Mock-up to register one!</p>
                ) : (
                    farmers.map(farmer => (
                        <div key={farmer.id} className="farmer-card">
                            <h3>{farmer.name}</h3>
                            <p>ID: {farmer.id} | Progress: {farmer.stages_completed} | Score: {farmer.score}</p>
                            <button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const FarmerChatbotMock = ({ setView }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState('');
    const [flowState, setFlowState] = useState('INTRO');
    const [farmerData, setFarmerData] = useState({});
    const [farmerId, setFarmerId] = useState(null);
    const [showMockFileInput, setShowMockFileInput] = useState(false);
    const chatWindowRef = useRef(null);

    const addMessage = (sender, text) => {
        setChatHistory(prev => [...prev, { sender, text, time: new Date() }]);
    };
    
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const startFlow = () => {
        setChatHistory([]);
        setFarmerId(null);
        setShowMockFileInput(false);
        addMessage("BOT", "Welcome to the GENFIN-AFRICA demo chat! I am your financing assistant. Type 'REGISTER' to start a new loan, or 'STATUS' if you already have an ID.");
        setFlowState('INTRO');
    };

    useEffect(() => {
        startFlow();
    }, []);

    const handleRegistration = async (dataToRegister) => {
        const payload = {
            name: dataToRegister.name,
            phone: dataToRegister.phone,
            crop: dataToRegister.crop,
            land_size: parseFloat(dataToRegister.land_size)
        };
        console.log("Sending registration payload:", JSON.stringify(payload));
        addMessage('BOT', "Submitting registration...");
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, payload);
            const newId = response.data.farmer_id;
            setFarmerId(newId);
            setFlowState('READY');
            addMessage('BOT', `✅ Success! You are registered. Your ID is ${newId}. Stage 1 (Soil Test) is UNLOCKED.`);
            addMessage('BOT', `Type 'UPLOAD' to submit your soil test, or 'STATUS' to check progress.`);
        } catch (error) {
            console.error("Registration error:", error.response?.data || error);
            addMessage('BOT', `❌ Registration failed: ${error.response?.data?.message || 'Server error'}`);
            setFlowState('INTRO');
        }
        setFarmerData({});
    };

    const handleUpload = async (stageNumber, fileType, fileName) => {
        // FIX: Corrected `endsWith` typo and logic for checking multiple file extensions.
        if (fileType === 'soil_test' && !fileName.toLowerCase().endsWith('.csv')) {
            addMessage('BOT', 'File name must end with .csv for soil test. Please try again.');
            setShowMockFileInput(true);
            return;
        }
        if (fileType === 'photo_evidence' && !['.jpg', '.jpeg', '.png'].some(ext => fileName.toLowerCase().endsWith(ext))) {
            addMessage('BOT', 'File name must end with .jpg, .jpeg, or .png for photo evidence. Please try again.');
            setShowMockFileInput(true);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, {
                stage_number: stageNumber,
                file_type: fileType,
                file_name: fileName
            });
            console.log(`Upload successful: ${JSON.stringify(response.data)}`);
            addMessage('BOT', `✅ ${response.data.message}`);
            addMessage('BOT', `Type 'TRIGGER' to submit Stage ${stageNumber} for Field Officer review, or 'STATUS' to check progress.`);
            setFlowState('READY');
            setShowMockFileInput(false);
        } catch (error) {
            console.error("Upload error:", error.response?.data || error);
            addMessage('BOT', `❌ Upload failed: ${error.response?.data?.message || 'Server error'}`);
            setShowMockFileInput(true);
        }
    };

    const handleTrigger = async () => {
        try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`);
            const nextStage = statusResponse.data.stages.find(s => s.status === 'UNLOCKED');

            if (!nextStage) {
                addMessage('BOT', "No stages are currently UNLOCKED. You must wait for Field Officer approval or Lender disbursement!");
                return;
            }

            addMessage('BOT', `Submitting Stage ${nextStage.stage_number} (${nextStage.stage_name}) for Field Officer review...`);
            const triggerResponse = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`);
            console.log(`Trigger response: ${JSON.stringify(triggerResponse.data)}`);
            addMessage('BOT', `🎉 ${triggerResponse.data.message}`);
            addMessage('BOT', `Waiting for Field Officer approval. Type 'STATUS' to check progress.`);
            setFlowState('READY');
        } catch (error) {
            console.error("Trigger error:", error.response?.data || error);
            addMessage('BOT', `❌ Trigger Failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleStatus = async (id) => {
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
            try {
                const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
                console.log(`Status response for farmer ${id}: ${JSON.stringify(statusResponse.data)}`);
                const stagesText = statusResponse.data.stages.map(s =>
                    `${
                        s.status === 'COMPLETED' ? '✅' :
                        s.status === 'APPROVED' ? '✔️' :
                        s.status === 'PENDING' ? '⏳' :
                        s.status === 'UNLOCKED' ? '🔓' : '🔒'
                    } Stage ${s.stage_number}: ${s.stage_name} - ${s.status}`).join('\n');
                
                const uploadsText = (statusResponse.data.uploads || []).map(u =>
                    `Stage ${u.stage_number}: ${u.file_type} (${u.file_name})`).join('\n') || 'None';

                addMessage('BOT', `--- YOUR STATUS ---\nScore: ${statusResponse.data.current_status.score}\n${stagesText}\nTotal Disbursed: $${statusResponse.data.current_status.total_disbursed.toFixed(2)}\nUploads:\n${uploadsText}`);
                addMessage('BOT', `Type 'TRIGGER' to submit a stage, 'UPLOAD' to submit files, or 'STATUS' to check progress.`);
                setFlowState('READY');
                return; // Success, exit the loop
            } catch (error) {
                attempts++;
                console.error(`Status fetch attempt ${attempts} failed for farmer ${id}:`, error.response?.data || error);
                if (attempts === maxAttempts) {
                    addMessage('BOT', `❌ Failed to fetch status after ${maxAttempts} attempts. Are you sure your ID is correct?`);
                    setFlowState('GET_ID'); 
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    };

    const promptForUpload = async (id) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED');
            if (!nextStage) {
                addMessage('BOT', "No stages are currently UNLOCKED for upload.");
                setFlowState('READY');
                return;
            }
            if (nextStage.stage_number === 1) {
                addMessage("BOT", "Type a mock soil test file name (e.g., soil_test.csv) in the chat input.");
                setFlowState('UPLOAD_SOIL_TEST');
                setShowMockFileInput(true);
            } else if ([3, 4].includes(nextStage.stage_number)) {
                addMessage("BOT", `Type a mock photo file name for Stage ${nextStage.stage_number} (e.g., photo.jpg) in the chat input.`);
                setFlowState('UPLOAD_PHOTO');
                setShowMockFileInput(true);
            } else {
                addMessage("BOT", `No file upload required for Stage ${nextStage.stage_number}. Type 'TRIGGER' to submit.`);
                setFlowState('READY');
            }
        } catch (error) {
            console.error("Status check for upload failed:", error.response?.data || error);
            addMessage('BOT', `❌ Failed to check status: ${error.response?.data?.message || 'Server error'}`);
            setFlowState('INTRO');
        }
    };
    
    const handleInput = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;

        addMessage('USER', text);
        setInput('');

        if (flowState === 'INTRO') {
            if (text.toUpperCase() === 'REGISTER') {
                addMessage("BOT", "Great! Let's get you set up. What is your full name?");
                setFlowState('REGISTER_NAME');
            } else if (text.toUpperCase() === 'STATUS') {
                addMessage("BOT", "Please enter your Farmer ID.");
                setFlowState('GET_ID');
            } else {
                addMessage("BOT", "Please type 'REGISTER' or 'STATUS'.");
            }
        } else if (flowState === 'GET_ID') {
            const id = parseInt(text);
            if (!isNaN(id) && id > 0) {
                setFarmerId(id);
                handleStatus(id);
            } else {
                addMessage("BOT", "Invalid ID. Please enter a positive number.");
            }
        } else if (flowState === 'REGISTER_NAME') {
            setFarmerData(prev => ({ ...prev, name: text }));
            addMessage("BOT", "What is your phone number? (e.g., +27 72 XXX XXXX)");
            setFlowState('REGISTER_PHONE');
        } else if (flowState === 'REGISTER_PHONE') {
            setFarmerData(prev => ({ ...prev, phone: text }));
            addMessage("BOT", "Which crop will you be growing this season? (e.g., Maize)");
            setFlowState('REGISTER_CROP');
        } else if (flowState === 'REGISTER_CROP') {
            setFarmerData(prev => ({ ...prev, crop: text }));
            addMessage("BOT", "What is your land size in acres? (e.g., 5.0)");
            setFlowState('REGISTER_LAND_SIZE');
        } else if (flowState === 'REGISTER_LAND_SIZE') {
            const landSize = parseFloat(text);
            if (isNaN(landSize) || landSize < 0) {
                addMessage("BOT", "Invalid land size. Please enter a non-negative number (e.g., 5.0).");
            } else {
                // FIX: Create a complete data object and pass it directly to the registration handler
                // to avoid the async state update issue.
                const finalFarmerData = { ...farmerData, land_size: landSize };
                setFarmerData(finalFarmerData); // Update state for completeness, though not strictly needed for the call
                handleRegistration(finalFarmerData);
            }
        } else if (flowState === 'UPLOAD_SOIL_TEST') {
            handleUpload(1, 'soil_test', text);
        } else if (flowState === 'UPLOAD_PHOTO') {
            axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`).then(res => {
                const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED');
                handleUpload(nextStage.stage_number, 'photo_evidence', text);
            }).catch(error => {
                console.error("Status check for photo upload failed:", error.response?.data || error);
                addMessage('BOT', `❌ Failed to check status: ${error.response?.data?.message || 'Server error'}`);
            });
        } else if (flowState === 'READY') {
            if (text.toUpperCase() === 'TRIGGER') {
                handleTrigger();
            } else if (text.toUpperCase() === 'STATUS') {
                handleStatus(farmerId);
            } else if (text.toUpperCase() === 'UPLOAD') {
                promptForUpload(farmerId);
            } else {
                addMessage("BOT", "Type 'TRIGGER', 'STATUS', or 'UPLOAD'.");
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
            </div>
            {showMockFileInput && (
                <div className="mock-file-input">
                    <label htmlFor="mock-file">Select File (Mock)</label>
                    <input type="file" id="mock-file" disabled />
                    <span>Type the file name in the chat input below.</span>
                </div>
            )}
            <form className="chat-input-form" onSubmit={handleInput}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                />
                <button type="submit">Send</button>
            </form>
            <p className="disclaimer">For Demonstration Only. Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a></p>           
        </div>
    );
};

const App = () => {
    const [view, setView] = useState('welcome');

    return (
        <div className="App">
            {view === 'welcome' && <WelcomeScreen setView={setView} />}
            {view === 'farmer' && <FarmerChatbotMock setView={setView} />}
            {view === 'lender' && <LenderDashboard setView={setView} />}
            {view === 'fieldOfficer' && <FieldOfficerDashboard setView={setView} />}
        </div>
    );
};

export default App;
