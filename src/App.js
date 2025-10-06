// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// --- Configuration ---
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
            <button className="btn-field-officer" onClick={() => setView('fieldOfficer')}>
                Field Officer Dashboard
            </button>
        </div>
        <p className="disclaimer">For Demonstration Only. Powered by eSusFarm Africa.</p>  // Updated: Disclaimer
    </div>
);

// Component 2: Displays the stage data for a single farmer
const StageTracker = ({ farmerId, stages, uploads, name, phone, totalDisbursed, score, onApproval }) => (  // Updated: Added uploads, score
    <div className="tracker-box">
        <h2>{name}'s Loan Status</h2>
        <p><strong>Phone:</strong> {phone} | <strong>Total Disbursed (Mock):</strong> ${totalDisbursed.toFixed(2)} | <strong>Score:</strong> {score}</p>  // Updated: Added score
        
        {stages.map(stage => (
            <div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                <span className="stage-icon">{
                    stage.status === 'COMPLETED' ? '✅' :
                    stage.status === 'UNLOCKED' ? '🔓' : '🔒'
                }</span>
                <span className="stage-name">Stage {stage.stage_number}: {stage.stage_name}</span>
                <span className="stage-disbursement">(${stage.disbursement_amount.toFixed(2)})</span>
                <span className="stage-uploads">  // New: Display uploads
                    Uploads: {uploads.filter(u => u.stage_number === stage.stage_number).map(u => u.file_type).join(', ') || 'None'}
                </span>
                {stage.status === 'UNLOCKED' && (
                    <button 
                        className="btn-approve" 
                        onClick={() => onApproval(farmerId, stage.stage_number)}>
                        Approve Stage
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

// --- Lender Dashboard Implementation ---
const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);

    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
            setSelectedFarmer(null);
        } catch (error) {
            console.error("Failed to fetch farmer list:", error);
            alert("Failed to fetch farmers. Please try again.");
        }
    };
    
    const fetchFarmerDetails = async (id) => {
        try {
            console.log(`Fetching details for farmer ID: ${id}`); // New: Debug logging
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            console.log(`Farmer details response:`, response.data); // New: Debug logging
            setSelectedFarmer(response.data);
        } catch (error) {
            console.error(`Failed to fetch farmer details for ID ${id}:`, error);
            alert(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleApproval = async (farmerId, stageNumber) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`);
            alert(`SUCCESS: ${response.data.message}`);
            fetchFarmerDetails(farmerId);
            fetchFarmers();
        } catch (error) {
            alert(`Approval Failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    React.useEffect(() => {
        fetchFarmers();
    }, []);

    if (selectedFarmer) {
        return (
            <div className="dashboard-detail">
                <button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button>
                <StageTracker
                    farmerId={selectedFarmer.farmer_id}
                    stages={selectedFarmer.stages}
                    uploads={selectedFarmer.uploads}  // New: Pass uploads
                    name={selectedFarmer.name}
                    phone={selectedFarmer.phone}
                    totalDisbursed={selectedFarmer.current_status.total_disbursed}
                    score={selectedFarmer.current_status.score}  // New: Pass score
                    onApproval={handleApproval}
                />
            </div>
        );
    }

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
                            <p>ID: {farmer.id} | Progress: {farmer.stages_completed} | Score: {farmer.score}</p>  // Updated: Added score
                            <button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// New: Field Officer Dashboard
const FieldOfficerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [error, setError] = useState(null); // New: Error handling

    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            console.log("Field Officer: Fetched farmers:", response.data); // New: Debug logging
            setFarmers(response.data);
            setSelectedFarmer(null);
            setError(null);
        } catch (error) {
            console.error("Field Officer: Failed to fetch farmer list:", error);
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`);
        }
    };
    
    const fetchFarmerDetails = async (id) => {
        try {
            console.log(`Field Officer: Fetching details for farmer ID: ${id}`); // New: Debug logging
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            console.log(`Field Officer: Farmer details response:`, response.data); // New: Debug logging
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

    React.useEffect(() => {
        fetchFarmers();
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
            {error && <p className="error">{error}</p>}  // New: Display errors
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

// --- Farmer Chatbot Mock Implementation ---
const FarmerChatbotMock = ({ setView }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState('');
    const [flowState, setFlowState] = useState('INTRO');
    const [farmerData, setFarmerData] = useState({});
    const [farmerId, setFarmerId] = useState(null);

    const botMessage = (text) => setChatHistory(prev => [...prev, { sender: 'BOT', text, time: new Date() }]);
    const addMessage = (sender, text) => {
        setChatHistory(prev => [...prev, { sender, text, time: new Date() }]);
    };

    const startFlow = () => {
        setChatHistory([]);
        setFarmerId(null);
        botMessage("Welcome to the GENFIN-AFRICA demo chat (For Demonstration Only)! Type 'REGISTER' or 'STATUS'.");  // Updated: Disclaimer
        setFlowState('INTRO');
    };

    React.useEffect(() => {
        startFlow();
    }, []);

    const handleRegistration = async () => {
        const payload = {
            name: farmerData.name,
            phone: farmerData.phone,
            crop: farmerData.crop,
            land_size: Number(farmerData.land_size)  // New: Ensure land_size is a number
        };
        console.log("Sending registration payload:", payload);  // New: Debug logging
        addMessage('BOT', "Submitting registration...");
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            const newId = response.data.farmer_id;
            setFarmerId(newId);
            setFlowState('UPLOAD');
            addMessage('BOT', `✅ Success! You are registered. Your ID is ${newId}. Stage 1 (Soil Test) is UNLOCKED.`);
            addMessage('BOT', `Please upload a soil test file for Stage 1. Type 'UPLOAD'.`);
        } catch (error) {
            console.error("Registration error:", error.response?.data);  // New: Debug logging
            addMessage('BOT', `❌ Registration failed: ${error.response?.data?.message || 'Server error'}`);
            setFlowState('INTRO');
        }
        setFarmerData({});
    };

    // New: Handle file uploads
    const handleUpload = async (stageNumber, fileType, fileName) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, {
                stage_number: stageNumber,
                file_type: fileType,
                file_name: fileName
            }, {
                headers: { 'Content-Type': 'application/json' }
            });
            addMessage('BOT', `✅ ${response.data.message}`);
            addMessage('BOT', `Type 'TRIGGER' to submit Stage ${stageNumber} for approval, or 'STATUS' to check progress.`);
            setFlowState('READY');
        } catch (error) {
            addMessage('BOT', `❌ Upload failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleTrigger = async () => {
        try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`);
            const nextStage = statusResponse.data.stages.find(s => s.status === 'UNLOCKED');

            if (!nextStage) {
                addMessage('BOT', "No stages are currently UNLOCKED. You must wait for Field Officer approval!");
                return;
            }

            addMessage('BOT', `Submitting Stage ${nextStage.stage_number} (${nextStage.stage_name}) for approval...`);

            const approvalResponse = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`);
            addMessage('BOT', `🎉 SUCCESS: ${approvalResponse.data.message}`);
            if (approvalResponse.data.next_stage_unlocked) {
                const newStage = approvalResponse.data.next_stage_unlocked;
                if (newStage === 3 || newStage === 4) {
                    addMessage('BOT', `Please upload photo evidence for Stage ${newStage}. Type 'UPLOAD'.`);
                    setFlowState('UPLOAD');
                } else {
                    addMessage('BOT', `Type 'TRIGGER' for the next step or 'STATUS' to check progress.`);
                    setFlowState('READY');
                }
            } else {
                addMessage('BOT', `Farmer journey complete! Type 'STATUS' to review.`);
                setFlowState('READY');
            }
        } catch (error) {
            addMessage('BOT', `❌ Trigger Failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleStatus = async () => {
        try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`);
            const stagesText = statusResponse.data.stages.map(s =>
                `${s.status === 'COMPLETED' ? '✅' : s.status === 'UNLOCKED' ? '🔓' : '🔒'} Stage ${s.stage_number}: ${s.stage_name} - ${s.status}`).join('\n');
            const uploadsText = statusResponse.data.uploads.map(u =>
                `Stage ${u.stage_number}: ${u.file_type} (${u.file_name})`).join('\n') || 'None';
            addMessage('BOT', `--- YOUR STATUS ---\nScore: ${statusResponse.data.current_status.score}\n${stagesText}\nTotal Disbursed: $${statusResponse.data.current_status.total_disbursed.toFixed(2)}\nUploads:\n${uploadsText}`);  // Updated: Added score, uploads
        } catch (error) {
            addMessage('BOT', `❌ Failed to fetch status. Are you sure your ID is correct?`);
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
                botMessage("Type 'TRIGGER' to submit a stage, 'UPLOAD' to submit files, or 'STATUS' to check progress.");
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
            botMessage("What is your land size in acres?");
            setFlowState('REGISTER_LAND_SIZE');
        } else if (flowState === 'REGISTER_LAND_SIZE') {
            const landSize = parseFloat(text);
            if (isNaN(landSize) || landSize < 0) {
                botMessage("Invalid land size. Please enter a non-negative number.");
            } else {
                setFarmerData(prev => ({ ...prev, land_size: landSize }));
                console.log("Farmer data before registration:", { ...farmerData, land_size: landSize });  // New: Debug logging
                handleRegistration();
            }
        } else if (flowState === 'UPLOAD') {
            if (text.toUpperCase() === 'UPLOAD') {
                axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`).then(res => {
                    const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED');
                    if (!nextStage) {
                        addMessage('BOT', "No stages are currently UNLOCKED for upload.");
                        setFlowState('READY');
                        return;
                    }
                    if (nextStage.stage_number === 1) {
                        botMessage("Enter mock soil test file name (e.g., soil_test.csv):");
                        setFlowState('UPLOAD_SOIL_TEST');
                    } else if (nextStage.stage_number in [3, 4]) {
                        botMessage(`Enter mock photo file name for Stage ${nextStage.stage_number} (e.g., photo.jpg):`);
                        setFlowState('UPLOAD_PHOTO');
                    } else {
                        botMessage(`No file upload required for Stage ${nextStage.stage_number}. Type 'TRIGGER' to submit.`);
                        setFlowState('READY');
                    }
                }).catch(error => {
                    addMessage('BOT', `❌ Failed to check status: ${error.response?.data?.message || 'Server error'}`);
                });
            } else {
                botMessage("Please type 'UPLOAD' to submit a file, 'TRIGGER' to submit a stage, or 'STATUS' to check progress.");
            }
        } else if (flowState === 'UPLOAD_SOIL_TEST') {
            handleUpload(1, 'soil_test', text);
        } else if (flowState === 'UPLOAD_PHOTO') {
            axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`).then(res => {
                const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED');
                handleUpload(nextStage.stage_number, 'photo_evidence', text);
            }).catch(error => {
                addMessage('BOT', `❌ Failed to check status: ${error.response?.data?.message || 'Server error'}`);
            });
        } else if (flowState === 'READY') {
            if (text.toUpperCase() === 'TRIGGER') {
                handleTrigger();
            } else if (text.toUpperCase() === 'STATUS') {
                handleStatus();
            } else if (text.toUpperCase() === 'UPLOAD') {
                axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`).then(res => {
                    const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED');
                    if (!nextStage) {
                        addMessage('BOT', "No stages are currently UNLOCKED for upload.");
                        return;
                    }
                    if (nextStage.stage_number === 1) {
                        botMessage("Enter mock soil test file name (e.g., soil_test.csv):");
                        setFlowState('UPLOAD_SOIL_TEST');
                    } else if (nextStage.stage_number in [3, 4]) {
                        botMessage(`Enter mock photo file name for Stage ${nextStage.stage_number} (e.g., photo.jpg):`);
                        setFlowState('UPLOAD_PHOTO');
                    } else {
                        botMessage(`No file upload required for Stage ${nextStage.stage_number}. Type 'TRIGGER' to submit.`);
                    }
                }).catch(error => {
                    addMessage('BOT', `❌ Failed to check status: ${error.response?.data?.message || 'Server error'}`);
                });
            } else {
                botMessage("Type 'TRIGGER', 'STATUS', or 'UPLOAD'.");
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
    const [view, setView] = useState('welcome');

    const renderView = () => {
        switch (view) {
            case 'farmer':
                return <FarmerChatbotMock setView={setView} />;
            case 'lender':
                return <LenderDashboard setView={setView} />;
            case 'fieldOfficer':  // New: Field officer view
                return <FieldOfficerDashboard setView={setView} />;
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
