// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Ensure this matches the URL where your Flask backend is running
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

// This is a placeholder for your logo source
const LOGO_SRC = "https://lh3.googleusercontent.com/d/1JWvtX4b24wt5vRGmhYsUW029NS0grXOq";

// --- UTILITY COMPONENTS ---

// Generic Modal Component
const Modal = ({ show, onClose, title, children }) => {
    if (!show) {
        return null;
    }
    return (
        // onClick handles clicking outside the modal content to close
        <div className="modal" onClick={onClose}>
            {/* onClick stopPropagation prevents clicking the content from closing the modal */}
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="btn-back" onClick={onClose} style={{ float: 'right' }}>Close</button>
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    );
};

// --- DASHBOARD COMPONENTS ---

// +++ MODIFIED to accept and display real contract history +++
const FarmerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages, contractHistory }) => {
    const [showXaiModal, setShowXaiModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

    // Filter and prepare XAI data for modal table
    const xaiData = xaiFactors && xaiFactors.length > 0
        ? xaiFactors.map(f => [f.factor, f.weight.toFixed(1)])
        : [['N/A', 'N/A']];
    xaiData.unshift(['Factor', 'Contribution']);
    
    // --- REMOVED mockContractLog ---

    // Reverse stage order for display (latest first)
    const reversedStages = [...stages].reverse();

    return (
        <div className="tracker-box">
            <h3>Farmer Tracker: {farmer.name} (ID: {farmer.farmer_id})</h3>
            <div className="farmer-status-summary" style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
                <div style={{ padding: '10px', borderRight: '1px solid #ddd' }}>
                    <strong>Score: {score}</strong> <br />
                    Risk: <span style={{ color: risk === 'LOW' ? 'green' : risk === 'HIGH' ? 'red' : 'orange' }}>{risk}</span>
                    <button className="btn-view" onClick={() => setShowXaiModal(true)} style={{ marginLeft: '10px' }}>
                        View XAI
                    </button>
                </div>
                <div style={{ padding: '10px' }}>
                    <strong>Contract: {contractState}</strong> <br />
                    Hash: {contractHash.substring(0, 10)}...
                    <button className="btn-view" onClick={() => setShowContractModal(true)} style={{ marginLeft: '10px' }}>
                        View Contract
                    </button>
                </div>
            </div>

            <h4>Loan Stage Tracker</h4>
            {reversedStages.map((stage) => (
                <div
                    key={stage.stage_number}
                    className={`stage-item stage-${stage.status.toLowerCase()}`}
                >
                    <span className="stage-name">{stage.stage_name}</span>
                    <span className="stage-disbursement">${stage.disbursement_amount.toFixed(2)}</span>
                    <span style={{ fontWeight: 'bold' }}>{stage.status}</span>
                </div>
            ))}

            {/* XAI Modal */}
            <Modal show={showXaiModal} onClose={() => setShowXaiModal(false)} title="AI Proficiency Score (XAI)">
                <p><strong>Score: {score}</strong> | Risk Band: {risk}</p>
                <p>Explanation of the current score based on mocked federated learning factors:</p>
                <table>
                    <thead>
                        <tr>
                            <th>Factor</th>
                            <th>Contribution (Mock)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {xaiFactors.map((f, index) => (
                            <tr key={index}>
                                <td>{f.factor}</td>
                                <td>+{f.weight.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Modal>

            {/* Contract Modal (now uses real data) */}
            <Modal show={showContractModal} onClose={() => setShowContractModal(false)} title="Smart Contract Audit Trail">
                <p>This is a simulated immutable log of all contract state transitions.</p>
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>State Transition</th>
                            <th>Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* +++ MAPPING OVER REAL CONTRACT HISTORY PROP +++ */}
                        {contractHistory.map((entry, index) => (
                            <tr key={index}>
                                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                                <td>{entry.state}</td>
                                <td>{entry.hash.substring(0, 10)}...</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Modal>
        </div>
    );
};


// --- CHATBOT MOCK ---

const FarmerChatbotMock = ({ setView }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [farmerId, setFarmerId] = useState(null); // Start with no ID
    const [farmerStatus, setFarmerStatus] = useState(null);
    const [showUploadInput, setShowUploadInput] = useState(false);
    const [showIoTInput, setShowIoTInput] = useState(false);
    const messagesEndRef = useRef(null);

    const [chatState, setChatState] = useState('AWAITING_COMMAND');
    const [registrationData, setRegistrationData] = useState({});

    const formatBotMessage = (text) => {
        const regex = /(STATUS|REGISTER|HELP|RESET|NEXT STAGE|UPLOAD|BACK|CANCEL|TRIGGER PEST|TRIGGER INSURANCE|INGEST IOT|Full Name|Phone Number|Age|Gender|ID Document|Next of Kin|Crop|Land Size)/gi;
        return text.replace(regex, (match) => `<strong>${match}</strong>`);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(scrollToBottom, [messages]);

    const pushBotMessage = (text) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: text,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString(),
        }]);
    };

    const pushUserMessage = (text) => {
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: text,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString(),
        }]);
    };

    const fetchStatus = async (id = farmerId) => {
        if (!id) {
            pushBotMessage("Error: No Farmer ID available to check status.");
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setFarmerStatus(response.data);

            const status = response.data.current_status;
            const stages = response.data.stages;
            const completedStages = stages.filter(s => s.status === 'COMPLETED').length;
            
            let statusMessage = `✅ **Status for ${response.data.name} (ID: ${id})**\n\n`;
            statusMessage += `**Proficiency Score:** ${status.score} (${status.risk_band})\n`;
            statusMessage += `**Contract State:** ${response.data.contract_state}\n`;
            statusMessage += `**Stages:** ${completedStages} / ${stages.length} Completed\n`;
            statusMessage += `**Pest Flag:** ${status.pest_flag ? '⚠️ ACTIVE' : 'NO'}\n`;
            statusMessage += `**Total Disbursed:** $${status.total_disbursed.toFixed(2)}\n\n`;

            setChatState('AWAITING_ACTION');
            pushBotMessage(statusMessage + `\nWhat's next? Type **NEXT STAGE**, **UPLOAD**, or **STATUS**.`);
        } catch (error) {
            setChatState('AWAITING_COMMAND');
            pushBotMessage(`❌ Error fetching status for ID ${id}. Farmer ID not found or backend issue. Please check **STATUS** again or **REGISTER**.`);
            console.error(error);
        }
    };

    const handleRegistrationSteps = async (input) => {
        let nextState = chatState;
        let botMessage = '';
        let currentData = { ...registrationData };

        if (chatState === 'REG_AWAITING_NAME') {
            currentData.name = input;
            nextState = 'REG_AWAITING_PHONE';
            botMessage = "Thank you. Now, please enter your **Phone Number** (e.g., 2547XXXXXXXX).";
        } else if (chatState === 'REG_AWAITING_PHONE') {
            currentData.phone = input;
            nextState = 'REG_AWAITING_AGE';
            botMessage = "Got it. Please enter your **Age** (e.g., 35).";
        } else if (chatState === 'REG_AWAITING_AGE') {
            const age = parseInt(input);
            if (isNaN(age) || age < 18 || age > 100) {
                pushBotMessage("Invalid Age. Please enter a valid number between 18 and 100.");
                return;
            }
            currentData.age = age;
            nextState = 'REG_AWAITING_GENDER';
            botMessage = "What is your **Gender**? (e.g., Male, Female).";
        } else if (chatState === 'REG_AWAITING_GENDER') {
            currentData.gender = input;
            nextState = 'REG_AWAITING_ID';
            botMessage = "Please enter your **ID Document** number (e.g., National ID or Passport number).";
        } else if (chatState === 'REG_AWAITING_ID') {
            currentData.id_document = input;
            nextState = 'REG_AWAITING_CROP';
            botMessage = "Thank you. What **Crop** will you be growing this season (e.g., Maize, Beans)?";
        } else if (chatState === 'REG_AWAITING_CROP') {
            currentData.crop = input;
            nextState = 'REG_AWAITING_LAND_SIZE';
            botMessage = "And finally, what is your **Land Size** in hectares (e.g., 5.0)?";
        } else if (chatState === 'REG_AWAITING_LAND_SIZE') {
            const landSize = parseFloat(input);
            if (isNaN(landSize) || landSize <= 0) {
                pushBotMessage("Invalid land size. Please enter a positive number (e.g., 5.0).");
                return;
            }
            currentData.land_size = landSize;
            nextState = 'AWAITING_ACTION';
            
            try {
                const finalData = { ...currentData };
                const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, finalData);
                const newFarmerId = response.data.farmer_id;
                setFarmerId(newFarmerId);

                pushBotMessage(`✅ Registration successful! Your Farmer ID is ${newFarmerId}. You can now use commands: **STATUS**, **NEXT STAGE**, **UPLOAD**.`);
                await fetchStatus(newFarmerId);
            } catch (error) {
                pushBotMessage(`❌ Registration failed: ${error.response?.data?.message || 'A network or server error occurred.'}`);
                setChatState('AWAITING_COMMAND');
            }
        }

        setRegistrationData(currentData);
        setChatState(nextState);
        if (botMessage) {
            pushBotMessage(botMessage);
        }
    };

    const stageFileFormats = {
        1: 'csv (Soil Test Data)',
        2: 'jpg, jpeg, png, pdf (Input Purchase Evidence)',
        4: 'jpg, jpeg, png, pdf (Weeding/Maintenance Photo)',
        6: 'jpg, jpeg, png, pdf (Harvest Photo)',
        7: 'jpg, jpeg, png, pdf (Transport/Marketing Proof)',
    };
    
    // +++ UPDATED upload prompt +++
    const initiateUpload = async () => {
        if (!farmerStatus) {
            pushBotMessage("Please check **STATUS** first to load your contract data.");
            return;
        }
        
        const nextStage = farmerStatus.stages.find(s => s.status === 'UNLOCKED');
        if (!nextStage) {
            pushBotMessage("All stages are either COMPLETED or LOCKED. No upload required now.");
            return;
        }

        setShowUploadInput(true);
        const formatInfo = stageFileFormats[nextStage.stage_number] || 'jpg, pdf';
        
        let uploadInstructions = `
            Stage ${nextStage.stage_number}: ${nextStage.stage_name} is UNLOCKED.
            Please enter the full file name including extension, e.g., 'Soil_Report.csv'.
            **Acceptable formats for Stage ${nextStage.stage_number}:** ${formatInfo}.
            Type **CANCEL** to abort.
        `;
        pushBotMessage(uploadInstructions);
    };

    // +++ UPDATED file parsing logic +++
    const handleFileUpload = async (fileInput) => {
        setShowUploadInput(false);
        if (fileInput.trim().toLowerCase() === 'cancel') {
            pushBotMessage("Upload cancelled. What's next? **STATUS** or **NEXT STAGE**.");
            return;
        }

        const lastDotIndex = fileInput.lastIndexOf('.');
        if (lastDotIndex === -1 || lastDotIndex === 0 || lastDotIndex === fileInput.length - 1) {
            pushBotMessage("Invalid format. Please enter a valid file name with an extension (e.g., 'Photo_1.jpg'). Try **UPLOAD** again.");
            return;
        }
        
        const fileName = fileInput.substring(0, lastDotIndex);
        const fileType = fileInput.substring(lastDotIndex + 1).toLowerCase();

        const nextStage = farmerStatus.stages.find(s => s.status === 'UNLOCKED');
        if (!nextStage) return;

        const soilData = nextStage.stage_number === 1 ? { ph: 6.8, nitrogen: 30, moisture: 25 } : {};
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, {
                stage_number: nextStage.stage_number,
                file_type: fileType,
                file_name: fileName,
                soil_data: soilData
            });
            pushBotMessage(`✅ ${response.data.message} Type **STATUS** to view score update.`);
            await fetchStatus();
        } catch (error) {
            pushBotMessage(`❌ Upload failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleNextStage = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`);
            pushBotMessage(`✅ ${response.data.message} Type **STATUS** to check for updates.`);
        } catch (error) {
            pushBotMessage(`Stage trigger failed: ${error.response?.data?.message || error.message}. Check **STATUS** to see if a file **UPLOAD** is required or an approval is pending.`);
        }
    };
    
    // ... other handlers (handlePestTrigger, handleInsuranceTrigger, handleIotData) remain the same ...
    const handlePestTrigger = async () => { /* ... no changes ... */ };
    const handleInsuranceTrigger = async () => { /* ... no changes ... */ };
    const handleIotData = async (dataInput) => { /* ... no changes ... */ };
    
    const handleInput = async (e) => {
        e.preventDefault();
        const userText = input.trim();
        if (!userText) return;
        const command = userText.toUpperCase();
        pushUserMessage(userText);
        setInput('');

        if (command === 'RESET') {
            setChatState('AWAITING_COMMAND');
            setFarmerId(null);
            setRegistrationData({});
            setFarmerStatus(null);
            pushBotMessage("Chat state reset. Please type **STATUS**, **REGISTER**, or **HELP** to begin.");
            return;
        }

        if (showUploadInput) {
            handleFileUpload(userText);
            return;
        }
        if (showIoTInput) {
            handleIotData(userText);
            setShowIoTInput(false);
            return;
        }

        if (chatState.startsWith('REG_')) {
            await handleRegistrationSteps(userText);
            return;
        }

        if (chatState === 'AWAITING_FARMER_ID') {
            const inputId = parseInt(userText);
            if (!isNaN(inputId) && inputId > 0) {
                setFarmerId(inputId);
                setChatState('AWAITING_ACTION');
                await fetchStatus(inputId);
            } else {
                pushBotMessage("Invalid Farmer ID. Please enter a number.");
            }
            return;
        }
        
        switch (command) {
            case 'STATUS':
                if (!farmerId) {
                    setChatState('AWAITING_FARMER_ID');
                    pushBotMessage("Please enter your **Farmer ID** to check your status.");
                } else {
                    fetchStatus(farmerId);
                }
                break;
            case 'REGISTER':
                setChatState('REG_AWAITING_NAME');
                setRegistrationData({});
                pushBotMessage("To start registration, please enter your **Full Name**.");
                break;
            case 'HELP':
                pushBotMessage("You can use **STATUS** to check your loan status, **REGISTER** to sign up, or **RESET** to restart.");
                break;
            case 'NEXT STAGE':
                if (farmerId) handleNextStage(); else pushBotMessage("Please use **STATUS** with your Farmer ID first.");
                break;
            case 'UPLOAD':
                if (farmerId) await initiateUpload(); else pushBotMessage("Please use **STATUS** with your Farmer ID first.");
                break;
            case 'BACK':
                setView('welcome');
                break;
            default:
                if (chatState === 'AWAITING_COMMAND') {
                    pushBotMessage(`Unrecognized command. Please type **STATUS**, **REGISTER**, or **HELP**.`);
                } else {
                    pushBotMessage("I didn't understand that. Please try **STATUS**, **NEXT STAGE**, **UPLOAD**, or **BACK**.");
                }
        }
    };

    useEffect(() => {
        pushBotMessage(`Welcome to the GENFIN 🌱 Demo. I am your financing assistant. Please **REGISTER** to start or type **STATUS** if you already have a Farmer ID.`);
    }, []);

    return (
        <div className="chatbot-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <h2>Farmer Chatbot Interface</h2>
            
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-row ${msg.sender}`}>
                        <div className="message-bubble" dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }} />
                        <span className="timestamp">{msg.timestamp}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {(showUploadInput || showIoTInput) && (
                 <div className="mock-file-input">
                    <label htmlFor="mock-file">Enter Filename (Mock)</label>
                    <input type="text" id="mock-file" placeholder="e.g., Soil_Report.csv" disabled/>
                    <span>Type the filename in the chat box below and press Send.</span>
                 </div>
            )}
            
            <form className="chat-input-form" onSubmit={handleInput}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        chatState.includes('REG_AWAITING_') ? 'Enter registration data...' 
                        : chatState === 'AWAITING_FARMER_ID' ? 'Enter Farmer ID...' 
                        : 'Type your command (STATUS, REGISTER, etc.)...'
                    }
                />
                <button type="submit">Send</button>
            </form>
            <p className="disclaimer">For Demonstration Only. Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a></p>
        </div>
    );
};

// --- ADMIN/LENDER DASHBOARD ---

const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);

    const fetchFarmers = async () => { /* ... no changes ... */ };
    const fetchFarmerDetails = async (id) => { /* ... no changes ... */ };

    const handleDisburse = async (stageNumber) => {
        if (!farmerData) return;
        try {
            await axios.post(`${API_BASE_URL}/api/lender/disburse/${selectedFarmerId}/${stageNumber}`);
            await fetchFarmerDetails(selectedFarmerId); // Refresh data
            await fetchFarmers(); // Refresh list data too
        } catch (error) {
            alert(error.response?.data?.message || "Disbursement failed.");
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Lender/Admin Dashboard</h2>
                <p>Select a farmer to view progress and disburse funds.</p>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className="farmer-card">
                        <div>
                            <strong>{farmer.name} (ID: {farmer.id})</strong><br/>
                            <span>Completed Stages: {farmer.stages_completed} | Score: {farmer.score}</span>
                        </div>
                        <div>
                            <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Progress</button>
                            <a href={`${API_BASE_URL}/api/report/farmer/${farmer.id}`} target="_blank" rel="noopener noreferrer">
                                <button className="btn-report">Download Report</button>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
            <h2>{farmerData.name}'s Financing Tracker</h2>

            <FarmerDetailsCard 
                farmer={farmerData}
                score={farmerData.current_status.score}
                risk={farmerData.current_status.risk_band}
                xaiFactors={farmerData.current_status.xai_factors || []}
                contractHash={farmerData.contract_hash}
                contractState={farmerData.contract_state}
                stages={farmerData.stages}
                contractHistory={farmerData.contract_history || []} // +++ PASS PROP
            />

            <h4>Disbursement Actions (Lender)</h4>
            {farmerData.stages.map(stage => (
                <div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                    <span className="stage-name">{stage.stage_name}</span>
                    <span className="stage-disbursement">${stage.disbursement_amount.toFixed(2)}</span>
                    <span style={{ fontWeight: 'bold' }}>{stage.status}</span>
                    {stage.status === 'APPROVED' && (
                        <button className="btn-lender" onClick={() => handleDisburse(stage.stage_number)}>
                            Disburse Funds
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};



// +++ REFACTORED INSURER DASHBOARD TO BE DYNAMIC +++
const InsurerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);

    const fetchInsurerFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/insurer/farmers`);
            setFarmers(response.data);
        } catch (error) {
            console.error("Error fetching insurer-relevant farmers:", error);
        }
    };

    const fetchFarmerDetails = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) {
            console.error("Error fetching farmer details:", error);
            setFarmerData(null);
        }
    };
    
    const handleBindPolicy = async () => {
        if (!selectedFarmerId) return;
        try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/bind/${selectedFarmerId}`);
            alert(response.data.message);
            await fetchFarmerDetails(selectedFarmerId); 
        } catch (error) {
            alert(error.response?.data?.message || "Policy binding failed.");
        }
    };

    const handleClaimCheck = async () => {
        if (!selectedFarmerId) return;
        try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/trigger/${selectedFarmerId}`, { rainfall: 5 });
            alert(response.data.message);
            await fetchFarmerDetails(selectedFarmerId); 
        } catch (error) {
            alert(error.response?.data?.message || "Claim check failed.");
        }
    };

    useEffect(() => {
        fetchInsurerFarmers();
    }, []);

    // RENDER LIST VIEW
    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Insurer Dashboard</h2>
                <p>Select a farmer to view and manage their insurance policy.</p>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className="farmer-card">
                        <div>
                            <strong>{farmer.name} (ID: {farmer.id})</strong><br/>
                            <span>Policy Status: {farmer.policy_status} | Score: {farmer.score}</span>
                        </div>
                        <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Policy</button>
                    </div>
                ))}
            </div>
        );
    }
    
    // RENDER DETAILED VIEW
    const policyStatus = farmerData.stages.find(s => s.stage_number === 3)?.status === 'COMPLETED' ? 'ACTIVE' : 'PENDING';

    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchInsurerFarmers(); }}>← Back to List</button>
            <h2>Insurer Dashboard for {farmerData.name}</h2>
            
            <div className="policy-card">
                <h3>Weather-Index Insurance Policy</h3>
                {!farmerData.policy_id ? (
                    <p>No policy created yet. Complete Stage 3 to generate and activate the policy.</p>
                ) : (
                    <>
                        <p>Policy ID: <strong>{farmerData.policy_id}</strong></p>
                        <p>Status: 
                            <span className={`policy-status-${policyStatus.toLowerCase()}`}>
                                <strong>{policyStatus}</strong>
                            </span>
                        </p>
                        <p>Triggers: Rainfall below 10mm (Mock)</p>
                    </>
                )}
            </div>

            <div style={{ margin: '20px 0' }}>
                <h4>Insurer Actions</h4>
                <button className="btn-insurer" onClick={handleBindPolicy} disabled={policyStatus === 'ACTIVE'}>
                    Bind Policy (Manual)
                </button>
                <button className="btn-insurer" onClick={handleClaimCheck} disabled={policyStatus !== 'ACTIVE'}>
                    Check Claim Trigger (Drought)
                </button>
            </div>
            
            <FarmerDetailsCard 
                farmer={farmerData}
                score={farmerData.current_status.score}
                risk={farmerData.current_status.risk_band}
                xaiFactors={farmerData.current_status.xai_factors || []}
                contractHash={farmerData.contract_hash}
                contractState={farmerData.contract_state}
                stages={farmerData.stages}
                contractHistory={farmerData.contract_history || []} // +++ PASS PROP
            />
        </div>
    );
};

// --- WELCOME SCREEN ---

const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        <img src={LOGO_SRC} alt="eSusFarm Africa Logo" className="esusfarm-logo" />
        <h2>GENFIN 🌱 AFRICA</h2>
        <p><b>G20 TechSprint Demo</b></p>
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
        <p className="disclaimer">For Demonstration Only. Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a></p>  
    </div>
);

// --- MAIN APP COMPONENT ---

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
