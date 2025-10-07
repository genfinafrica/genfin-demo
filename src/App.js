// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; 

// Ensure this matches the URL where your Flask backend is running
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'; 

// CRITICAL: Original Logo Source Preserved
const LOGO_SRC = "https://lh3.googleusercontent.com/d/1JWvtX4b24wt5vRGmhYsUW029NS0grXOq"; 

// --- Helper Components (NEW: Modal, XAIView, ContractView) ---

// Generic Modal Wrapper
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Updated XAIView Component
const XAIView = ({ xaiFactors, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title="Explainable AI (XAI) Factors">
            <p>The **Farmer Proficiency Score** is calculated based on these weighted factors:</p>
            <ul className="xai-factors-list">
                {xaiFactors.map((factor, index) => (
                    // Mocking class for visual distinction
                    <li key={index} className={`xai-factor xai-factor-${factor.weight > 0 ? 'pos' : 'neg'}`}>
                        <span>{factor.factor}</span>
                        <span className="xai-contribution">{factor.weight > 0 ? `+${factor.weight.toFixed(2)}` : factor.weight.toFixed(2)}</span>
                    </li>
                ))}
            </ul>
            <button onClick={onClose}>Close</button>
        </Modal>
    );
};

// NEW: ContractView Component (Audit Trail)
const ContractView = ({ contractState, contractHash, onClose }) => {
    // Mock history data based on expected state transitions
    const history = [
        { timestamp: new Date(Date.now() - 3600000).toLocaleString(), state: 'DRAFT → ACTIVE', hash: contractHash.substring(0, 10) + '...' },
        { timestamp: new Date(Date.now() - 2400000).toLocaleString(), state: 'ACTIVE → STAGE_1_PENDING', hash: contractHash.substring(10, 20) + '...' },
        { timestamp: new Date(Date.now() - 1200000).toLocaleString(), state: 'STAGE_1_PENDING → STAGE_1_COMPLETED', hash: contractHash.substring(20, 30) + '...' },
        { timestamp: new Date().toLocaleString(), state: `LATEST: ${contractState}`, hash: contractHash },
    ].reverse();

    return (
        <Modal isOpen={true} onClose={onClose} title="Smart Contract Timeline">
            <p><strong>Current State:</strong> {contractState}</p>
            <p><strong>Latest Hash:</strong> {contractHash}</p>
            <div className="contract-timeline">
                {history.map((item, index) => (
                    <div key={index} className="timeline-item">
                        <p><strong>{item.timestamp}</strong></p>
                        <p>{item.state}</p>
                        <p className="hash-code">Hash: <code>{item.hash}</code></p>
                    </div>
                ))}
            </div>
            <button onClick={onClose}>Close</button>
        </Modal>
    );
};


// --- Stage Tracker Component (MODIFIED) ---

const StageTracker = ({ farmerId, stages, uploads = [], name, phone, totalDisbursed, score, riskBand, xaiFactors, contractState, contractHash, onApproval, onDisburse, onViewContract, onViewXAI, onReportDownload, onPestTrigger }) => {
    
    // NEW: State for current action message (for disbursement/approval feedback)
    const [actionMessage, setActionMessage] = useState('');
    const [isPestFlagTriggered, setIsPestFlagTriggered] = useState(false); // Mock state for conditional stage

    // Helper to calculate score accent color
    const scoreColor = score >= 75 ? '#28a745' : (score >= 50 ? '#ffc107' : '#dc3545');

    // Handle button actions passed down from dashboards
    const handleAction = (handler, ...args) => async () => {
        setActionMessage(''); // Clear previous message
        try {
            await handler(...args); // Execute the original handler (approval/disburse)
            setActionMessage('✅ Action successful. Refreshing status...');
        } catch (error) {
            // FIXED: Improved error message display from the handler error throw
            setActionMessage(`❌ Action Failed: ${error.message || 'Server error.'}`);
        }
    };

    // NEW: Function to handle the mock pest trigger
    const handleMockPestTrigger = async () => {
        try {
            await onPestTrigger(farmerId); // Call the function passed from FieldOfficerDashboard
            setIsPestFlagTriggered(true);
            setActionMessage('✅ Pest Event Mock Triggered! Conditional Stage 5 logic is now enabled.');
        } catch (error) {
            setActionMessage(`❌ Pest Trigger Failed: ${error.message || 'Server error'}`);
        }
    }


    return (
        <div className="tracker-box">
            <h2>{name}'s Loan Status</h2>

            {/* FIXED: AI Score Accentuation */}
            <div className="ai-score-badge" style={{ borderColor: scoreColor }}>
                <p><strong>Phone:</strong> {phone} | <strong>Total Disbursed (Mock):</strong> ${totalDisbursed.toFixed(2)}</p>
                <p>
                    <span className="ai-label">AI Proficiency Score:</span>
                    <span className="score-value" style={{ color: scoreColor }}>
                        {score}
                    </span>
                    <span className="risk-band">({riskBand} Risk)</span>
                    <button className="btn-xai-view" onClick={onViewXAI}>View XAI</button>
                </p>
            </div>

            {/* FIXED: Contract Hash Display/Button */}
            <p className="contract-status-bar" onClick={onViewContract}>
                <strong>Contract State:</strong> {contractState} | <strong>Hash:</strong> {contractHash ? contractHash.substring(0, 10) + '...' : 'N/A'} (Click for Audit)
            </p>

            {actionMessage && <p className={`action-message ${actionMessage.startsWith('✅') ? 'success' : 'error'}`}>{actionMessage}</p>}

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
                    
                    {/* Field Officer Approval Button */}
                    {stage.status === 'PENDING' && onApproval && (
                        <button
                            className="btn-approve"
                            onClick={handleAction(onApproval, farmerId, stage.stage_number)}
                        >
                            Approve Stage
                        </button>
                    )}
                    
                    {/* Lender Disburse Button */}
                    {stage.status === 'APPROVED' && onDisburse && (
                        <button
                            className="btn-approve btn-disburse"
                            onClick={handleAction(onDisburse, farmerId, stage.stage_number)}
                        >
                            Disburse Funds
                        </button>
                    )}

                    {/* NEW: Field Officer Mock Pest Trigger Button (Conditional Stage 5 logic) */}
                    {stage.stage_number === 4 && stage.status === 'COMPLETED' && onPestTrigger && !isPestFlagTriggered && (
                        <button
                            className="btn-pest-trigger"
                            onClick={handleMockPestTrigger}
                        >
                            Mock Trigger Pest Event
                        </button>
                    )}
                </div>
            ))}
            
            {/* Original Buttons - Preserve existing links/handlers */}
            <button className="btn-view" onClick={onViewXAI}>View XAI Factors</button>
            <button className="btn-view" onClick={onViewContract}>View Contract Timeline</button>
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
};


// --- Farmer Chatbot Mock (FIXED: Improved Flow/Prompts) ---

const FarmerChatbotMock = ({ setView }) => {
    const [chatHistory, setChatHistory] = useState([]);
    const [input, setInput] = useState('');
    const [flowState, setFlowState] = useState('INTRO');
    const [farmerData, setFarmerData] = useState({});
    const [farmerId, setFarmerId] = useState(null);
    const [showMockFileInput, setShowMockFileInput] = useState(false);
    const [showIoTInput, setShowIoTInput] = useState(false);
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
        setShowIoTInput(false);
        // FIXED: Restored user-friendly, guided prompt
        addMessage("BOT", "Welcome to GENFIN-AFRICA Chatbot! Type 'REGISTER' to start financing, or 'STATUS' to check progress (requires ID).");
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
            land_size: parseFloat(dataToRegister.land_size),
            id_document: dataToRegister.id_document,
            gender: dataToRegister.gender,
            age: parseInt(dataToRegister.age),
            geo_tag: dataToRegister.geo_tag
        };
        addMessage('BOT', "Submitting registration...");
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, payload);
            const newId = response.data.farmer_id;
            setFarmerId(newId);
            addMessage('BOT', `Registration complete! Your ID: ${newId}. Type 'STATUS' to check your first stage!`);
            setFlowState('READY');
        } catch (error) {
            addMessage('BOT', `Registration failed: ${error.response?.data?.message || 'Server error'}`);
            setFlowState('INTRO');
        }
    };

    const handleStatus = async (id) => {
        const maxAttempts = 3;
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
                // NEW/FIXED: Simpler, clearer status output lines
                const stagesText = statusResponse.data.stages.map(s =>
                    `${
                        s.status === 'COMPLETED' ? '✅' :
                        s.status === 'APPROVED' ? '✔️' :
                        s.status === 'PENDING' ? '⏳' :
                        s.status === 'UNLOCKED' ? '🔓' : '🔒'
                    } Stage ${s.stage_number}: ${s.stage_name} - ${s.status}`).join('\n');
                const uploadsText = (statusResponse.data.uploads || []).map(u =>
                    `Stage ${u.stage_number}: ${u.file_type} (${u.file_name})`).join('\n') || 'None';
                addMessage('BOT', `--- YOUR STATUS ---\nScore: ${statusResponse.data.current_status.score} (${statusResponse.data.current_status.risk_band})\n${stagesText}\nTotal Disbursed: $${statusResponse.data.current_status.total_disbursed.toFixed(2)}\nUploads:\n${uploadsText}\nContract: ${statusResponse.data.contract_state}`);
                // FIXED: Simplified next steps prompt
                addMessage('BOT', `To proceed, type one of these commands: **STATUS**, **UPLOAD**, **TRIGGER**, or **IOT**.`);
                setFlowState('READY');
                return;
            } catch (error) {
                attempts++;
                if (attempts === maxAttempts) {
                    addMessage('BOT', `Failed to fetch status. Check ID?`);
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
                addMessage('BOT', "No unlocked stages for upload.");
                setFlowState('READY');
                return;
            }
            if (nextStage.stage_number === 1) {
                // FIXED: Clearer instructions for soil test upload
                addMessage("BOT", "Stage 1: Soil Test. Type the mock file name (e.g., soil_test.json) or enter mock JSON data.");
                setFlowState('UPLOAD_SOIL_TEST');
                setShowMockFileInput(true);
            } else if ([3,4,6,7].includes(nextStage.stage_number)) {
                addMessage("BOT", `Stage ${nextStage.stage_number}: Photo Evidence. Type the mock file name (e.g., photo.jpg).`);
                setFlowState('UPLOAD_PHOTO');
                setShowMockFileInput(true);
            } else {
                addMessage("BOT", `No upload required for Stage ${nextStage.stage_number}. Type 'TRIGGER'.`);
                setFlowState('READY');
            }
        } catch (error) {
            addMessage('BOT', `Failed to check status: ${error.response?.data?.message || 'Server error'}`);
            setFlowState('INTRO');
        }
    };

    const promptForIoT = (id) => {
        addMessage("BOT", "Enter mock IoT data (e.g., ph:7, moisture:25, etc.).");
        setFlowState('IOT_INPUT');
        setShowIoTInput(true);
    };

    const handleIoT = async (text) => {
        try {
            // Mock parse
            const data = { plot_id: 1, ph: 7, moisture: 25, temperature: 30, n: 10, p: 10, k: 10, salinity: 1, ec: 1 };
            const response = await axios.post(`${API_BASE_URL}/api/iot/ingest`, data);
            addMessage('BOT', response.data.message);
            if (farmerId) handleStatus(farmerId); // Refresh for pest flag
            setShowIoTInput(false);
            setFlowState('READY');
        } catch (error) {
            addMessage('BOT', `IoT failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleTrigger = async () => {
        if (!farmerId) {
            addMessage('BOT', "No farmer ID. Type 'STATUS'.");
            return;
        }
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`, { trigger_type: 'manual' });
            addMessage('BOT', response.data.message);
            handleStatus(farmerId);
        } catch (error) {
            addMessage('BOT', `Trigger failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleUpload = async (stageNumber, fileType, fileName, soilData = {}) => {
        try {
            const payload = { stage_number: stageNumber, file_type: fileType, file_name: fileName, soil_data: soilData };
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, payload);
            addMessage('BOT', response.data.message);
            setShowMockFileInput(false);
            setFlowState('READY');
            handleStatus(farmerId);
        } catch (error) {
            addMessage('BOT', `Upload failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleInput = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text) return;
        addMessage('USER', text);
        setInput('');

        // --- Original Chatbot Flow Logic (Preserved) ---
        if (flowState === 'INTRO') {
            if (text.toUpperCase() === 'REGISTER') {
                addMessage("BOT", "What is your full name?");
                setFlowState('REGISTER_NAME');
            } else if (text.toUpperCase() === 'STATUS') {
                addMessage("BOT", "Enter your Farmer ID.");
                setFlowState('GET_ID');
            } else {
                addMessage("BOT", "Type 'REGISTER' or 'STATUS'.");
            }
        } else if (flowState === 'GET_ID') {
            const id = parseInt(text);
            if (!isNaN(id) && id > 0) {
                setFarmerId(id);
                handleStatus(id);
            } else {
                addMessage("BOT", "Invalid ID.");
            }
        } else if (flowState === 'REGISTER_NAME') {
            setFarmerData(prev => ({ ...prev, name: text }));
            addMessage("BOT", "Phone number? (e.g., +27 72 XXX XXXX)");
            setFlowState('REGISTER_PHONE');
        } else if (flowState === 'REGISTER_PHONE') {
            setFarmerData(prev => ({ ...prev, phone: text }));
            addMessage("BOT", "ID document number?");
            setFlowState('REGISTER_ID_DOCUMENT');
        } else if (flowState === 'REGISTER_ID_DOCUMENT') {
            setFarmerData(prev => ({ ...prev, id_document: text }));
            addMessage("BOT", "Gender? (Male/Female/Other)");
            setFlowState('REGISTER_GENDER');
        } else if (flowState === 'REGISTER_GENDER') {
            setFarmerData(prev => ({ ...prev, gender: text }));
            addMessage("BOT", "Age?");
            setFlowState('REGISTER_AGE');
        } else if (flowState === 'REGISTER_AGE') {
            setFarmerData(prev => ({ ...prev, age: text }));
            addMessage("BOT", "Crop this season? (e.g., Maize)");
            setFlowState('REGISTER_CROP');
        } else if (flowState === 'REGISTER_CROP') {
            setFarmerData(prev => ({ ...prev, crop: text }));
            addMessage("BOT", "Land size in acres? (e.g., 5.0)");
            setFlowState('REGISTER_LAND_SIZE');
        } else if (flowState === 'REGISTER_LAND_SIZE') {
            const landSize = parseFloat(text);
            if (isNaN(landSize) || landSize < 0) {
                addMessage("BOT", "Invalid land size.");
            } else {
                const finalData = { ...farmerData, land_size: landSize, geo_tag: '0.0,0.0' };
                handleRegistration(finalData);
            }
        } else if (flowState === 'UPLOAD_SOIL_TEST') {
            let soilData = {};
            try {
                soilData = JSON.parse(text);
            } catch {
                // Treat as file name
            }
            handleUpload(1, 'soil_test', text.endsWith('.json') ? text : 'soil_test.json', soilData);
        } else if (flowState === 'UPLOAD_PHOTO') {
            axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`).then(res => {
                const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED');
                handleUpload(nextStage.stage_number, 'photo_evidence', text);
            }).catch(error => {
                addMessage('BOT', `Failed: ${error.response?.data?.message || 'Server error'}`);
            });
        } else if (flowState === 'IOT_INPUT') {
            handleIoT(text);
        } else if (flowState === 'READY') {
            const upperText = text.toUpperCase();
            if (upperText === 'TRIGGER') {
                handleTrigger();
            } else if (upperText === 'STATUS') {
                handleStatus(farmerId);
            } else if (upperText === 'UPLOAD') {
                promptForUpload(farmerId);
            } else if (upperText === 'IOT') {
                promptForIoT(farmerId);
            } else {
                // FIXED: Simplified response to unrecognized command
                addMessage("BOT", "❓ Unrecognized command. Type **STATUS**, **UPLOAD**, **TRIGGER**, or **IOT**.");
            }
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chat-header">
                <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
                <h2>WhatsApp Chatbot Mock</h2>
            </div>
            <div className="chat-window" ref={chatWindowRef}>
           
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`message-row ${msg.sender.toLowerCase()}`}>
                        <div className="message-bubble">
                            {msg.sender === 'BOT' ? '🤖' : '🧑‍🌾'} {msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}
                            <span className="timestamp">{msg.time.toLocaleTimeString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        
            {showMockFileInput && (
                <div className="mock-file-input">
                    <label htmlFor="mock-file">Select File (Mock)</label>
                    <input type="file" id="mock-file" disabled />
                    <span>Type file name or JSON in chat.</span>
                </div>
            )}
            {showIoTInput && (
                <div className="mock-file-input">
                    <span>Enter IoT data in chat.</span>
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
            <p className="disclaimer">For Demonstration Only.
                Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a>
            </p>
        </div>
    );
};


// --- Lender Dashboard (MODIFIED: Error Handling) ---

const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [showXAI, setShowXAI] = useState(false);
    const [showContract, setShowContract] = useState(false);
    const [error, setError] = useState(null);

    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
            setError(null);
        } catch (error) {
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const fetchFarmerDetails = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setSelectedFarmer(response.data);
            setError(null);
        } catch (error) {
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    // FIXED: Throws error for StageTracker to display (Replaced old alert logic)
    const handleDisburse = async (farmerId, stageNumber) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/lender/disburse/${farmerId}/${stageNumber}`);
            fetchFarmerDetails(farmerId);
            fetchFarmers();
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Could not complete disbursement.');
        }
    };

    useEffect(() => {
        fetchFarmers();
        const interval = setInterval(fetchFarmers, 10000);
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
                    riskBand={selectedFarmer.current_status.risk_band || 'N/A'}
                    xaiFactors={selectedFarmer.current_status.xai_factors || []}
                    contractState={selectedFarmer.contract_state}
                    contractHash={selectedFarmer.contract_hash || 'N/A'}
                    onDisburse={handleDisburse}
                    onViewXAI={() => setShowXAI(true)}
                    onViewContract={() => setShowContract(true)}
                    onReportDownload={() => {}} 
                />
                {showXAI && <XAIView xaiFactors={selectedFarmer.current_status.xai_factors || []} onClose={() => setShowXAI(false)} />}
                {showContract && <ContractView contractState={selectedFarmer.contract_state} contractHash={selectedFarmer.contract_hash || 'N/A'} onClose={() => setShowContract(false)} />}
            </div>
        );
    }

    return (
        <div className="dashboard-list-container">
            <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
            <h1>Lender/Admin Dashboard</h1>
            <p>Monitor progress and disburse funds. <button onClick={fetchFarmers}>Refresh</button></p>
            {error && <p className="error">{error}</p>}
            <div className="farmer-list">
                {farmers.length === 0 ? (
                    <p>No farmers registered.</p>
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


// --- Field Officer Dashboard (MODIFIED: Pest Trigger Logic/Error Handling) ---

const FieldOfficerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [showXAI, setShowXAI] = useState(false);
    const [showContract, setShowContract] = useState(false);
    const [error, setError] = useState(null);

    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
            setError(null);
        } catch (error) {
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const fetchFarmerDetails = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setSelectedFarmer(response.data);
            setError(null);
        } catch (error) {
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    // FIXED: Throws error for StageTracker to display (Replaced old alert logic)
    const handleApproval = async (farmerId, stageNumber) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/approve/${farmerId}/${stageNumber}`);
            fetchFarmerDetails(farmerId);
            fetchFarmers();
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Could not approve stage.');
        }
    };

    // NEW: Function to trigger the pest flag mock event
    const handlePestTrigger = async (farmerId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${farmerId}`);
            // Force a refresh to update the component's state
            fetchFarmerDetails(farmerId);
            return response.data.message;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Could not trigger pest flag.');
        }
    };

    useEffect(() => {
        fetchFarmers();
        const interval = setInterval(fetchFarmers, 10000);
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
                    riskBand={selectedFarmer.current_status.risk_band || 'N/A'}
                    xaiFactors={selectedFarmer.current_status.xai_factors || []}
                    contractState={selectedFarmer.contract_state}
                    contractHash={selectedFarmer.contract_hash || 'N/A'}
                    onApproval={handleApproval}
                    onViewXAI={() => setShowXAI(true)}
                    onViewContract={() => setShowContract(true)}
                    onReportDownload={() => {}} 
                    onPestTrigger={handlePestTrigger} // Pass the new trigger function
                />
                {showXAI && <XAIView xaiFactors={selectedFarmer.current_status.xai_factors || []} onClose={() => setShowXAI(false)} />}
                {showContract && <ContractView contractState={selectedFarmer.contract_state} contractHash={selectedFarmer.contract_hash || 'N/A'} onClose={() => setShowContract(false)} />}
            </div>
        );
    }

    return (
        <div className="dashboard-list-container">
            <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
            <h1>Field Officer Dashboard</h1>
            <p>Review and approve milestones. <button onClick={fetchFarmers}>Refresh</button></p>
            {error && <p className="error">{error}</p>}
            <div className="farmer-list">
                {farmers.length === 0 ? (
                    <p>No farmers registered.</p>
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


// --- Insurer Dashboard (UPDATED) ---

const InsurerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [error, setError] = useState(null);

    const fetchFarmers = async () => {
        try {
            // Use the general admin endpoint to get the list
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
            setError(null);
        } catch (error) {
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const fetchFarmerDetails = async (id) => {
        try {
            // Get detailed status, which includes policy_id/contract_state
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setSelectedFarmer(response.data);
            setError(null);
        } catch (error) {
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleBindPolicy = async (farmerId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/bind/${farmerId}`);
            alert(`SUCCESS: ${response.data.message}`);
            fetchFarmerDetails(farmerId);
        } catch (error) {
            alert(`Bind Failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    const handleCheckTrigger = async (farmerId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/trigger/${farmerId}`, { rainfall: 5 });
            alert(`SUCCESS: ${response.data.message}`);
            fetchFarmerDetails(farmerId);
        } catch (error) {
            alert(`Trigger Check Failed: ${error.response?.data?.message || 'Server error'}`);
        }
    };

    useEffect(() => {
        fetchFarmers();
        const interval = setInterval(fetchFarmers, 10000);
        return () => clearInterval(interval);
    }, []);

    if (selectedFarmer) {
        // MOCK DATA ENHANCEMENT for the display
        const policyStatus = selectedFarmer.contract_state.includes('COMPLETED') ? 'ACTIVE' : (selectedFarmer.policy_id ? 'BOUND' : 'PENDING');
        const pestFlag = selectedFarmer.current_status.pest_flag ? '⚠️ PEST EVENT' : '✅ NORMAL';
        // Mock drought logic based on score < 50
        const droughtMock = selectedFarmer.current_status.score < 50 ? '⚠️ DROUGHT THREAT' : '✅ NORMAL';

        return (
            <div className="dashboard-detail">
                <button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button>
                <h2>{selectedFarmer.name}'s Insurance Status</h2>
                <p><strong>Farmer ID:</strong> {selectedFarmer.farmer_id} | <strong>Policy ID:</strong> {selectedFarmer.policy_id || 'Not Bound'}</p>
                
                <div className="policy-info">
                    <p><strong>Policy Status:</strong> <span className={`status-${policyStatus.toLowerCase()}`}>{policyStatus}</span></p>
                    <p><strong>Contract State:</strong> {selectedFarmer.contract_state}</p>
                    <p><strong>Mock Trigger Conditions:</strong> Rainfall {'<'}10mm, Pest Event Flag</p>
                    
                    <h4 style={{marginTop: '15px'}}>Current Event Status</h4>
                    <p><strong>Pest Flag Status (System):</strong> <span className={`status-${selectedFarmer.current_status.pest_flag ? 'triggered' : 'ok'}`}>{pestFlag}</span></p>
                    <p><strong>Drought Status (Mock IoT):</strong> <span className={`status-${droughtMock.includes('THREAT') ? 'triggered' : 'ok'}`}>{droughtMock}</span></p>
                </div>

                <div className="policy-actions" style={{marginTop: '20px'}}>
                    <button onClick={() => handleBindPolicy(selectedFarmer.farmer_id)}>Bind Policy</button>
                    <button onClick={() => handleCheckTrigger(selectedFarmer.farmer_id)}>Check Trigger (Mock Rainfall)</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-list-container">
            <button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button>
            <h1>Insurer Dashboard</h1>
            <p>Bind policies and check triggers. <button onClick={fetchFarmers}>Refresh</button></p>
            {error && <p className="error">{error}</p>}
            <div className="farmer-list">
                {farmers.length === 0 ? (
                    <p>No farmers registered.</p>
                ) : (
                    farmers.map(farmer => (
                        <div key={farmer.id} className="farmer-card">
                            <h3>{farmer.name}</h3>
                            <p>ID: {farmer.id} | Score: {farmer.score}</p>
                            <button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


// --- App Component (Preserved) ---

const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        {/* LOGO ELEMENT - Preserving original structure and source */}
        <img
            src={LOGO_SRC}
            alt="eSusFarm Africa Logo"
            className="esusfarm-logo"
        />
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
            <button className="btn-insurer" onClick={() => setView('insurer')}>
                Insurer Dashboard
     
            </button>
        </div>
        <p className="disclaimer">For Demonstration Only.
            Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a>
        </p>
    </div>
);


const App = () => {
    const [view, setView] = useState('welcome');
    return (
        <div className="App">
            {view === 'welcome' && <WelcomeScreen setView={setView} />}
            {view === 'farmer' && <FarmerChatbotMock setView={setView} />}
            {view === 'lender' && <LenderDashboard setView={setView} />}
            {view === 'fieldOfficer' && <FieldOfficerDashboard setView={setView} />}
            {view === 'insurer' && <InsurerDashboard setView={setView} />}
        </div>
    );
};

export default App;
