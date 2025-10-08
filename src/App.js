// src/App.js (Correctly Formatted)
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
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="btn-back" onClick={onClose} style={{ float: 'right' }}>Close</button>
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    );
};

// --- DASHBOARD COMPONENTS ---

// FarmerDetailsCard restored to its well-formatted version
const FarmerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages, contractHistory }) => {
    const [showXaiModal, setShowXaiModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

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

            {/* Contract Modal */}
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

// --------- Upgraded FarmerChatbotMock with insurance logic ---------
const FarmerChatbotMock = ({ setView }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [farmerId, setFarmerId] = useState(null);
    const [farmerStatus, setFarmerStatus] = useState(null);
    const [showUploadInput, setShowUploadInput] = useState(false);
    const [showIoTInput, setShowIoTInput] = useState(false);
    const [chatState, setChatState] = useState('AWAITING_COMMAND');
    const [registrationData, setRegistrationData] = useState({});
    const messagesEndRef = useRef(null);

    const stageFileHints = {
        1: 'Soil test (CSV)',
        2: 'Input supplier invoice (PDF / JPG)',
        3: 'Insurance: premium receipt (PDF / JPG)',
        4: 'Weeding photo (JPG / PNG)',
        5: 'Pest photo (JPG) or type NO PEST',
        6: 'Packaging photo (JPG / PNG)',
        7: 'Transport/Delivery note (PDF / JPG)',
    };

    const formatBotMessage = (text) => {
  const commands = [
    'STATUS', 'REGISTER', 'HELP', 'RESET', 'NEXT', 'NEXT STAGE',
    'UPLOAD', 'IOT', 'CANCEL', 'TRIGGER PEST', 'TRIGGER INSURANCE',
    'INGEST IOT', 'FULL NAME', 'PHONE NUMBER', 'AGE', 'GENDER',
    'ID DOCUMENT', 'NEXT OF KIN', 'CROP', 'LAND SIZE'
  ];

  return text
    .split(/(\s+)/) // Preserve spaces
    .map((word) => {
      const clean = word.replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase();
      if (commands.includes(clean)) {
        return `<strong>${word}</strong>`;
      }
      return word;
    })
    .join('');
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

    // STATUS check enhanced with Insurance details
    const fetchStatus = async (id = farmerId) => {
        if (!id) {
            pushBotMessage("Error: No Farmer ID available. Type **REGISTER** to create an account or provide your ID.");
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            const data = response.data;
            setFarmerStatus(data);

            const stages = data.stages || [];
            const uploads = data.uploads || [];

            let currentIdx = stages.findIndex(s => s.status !== 'COMPLETED');
            if (currentIdx === -1) currentIdx = stages.length - 1;
            const currentStage = stages[currentIdx] || null;

            const uploadedFiles = uploads.map(u => `Stage ${u.stage_number}: ${u.file_name}${u.file_type ? '.' + u.file_type : ''}`);

            let nextHint = 'Type **STATUS** to refresh.';
            if (currentStage) {
                const s = currentStage;
                if (s.status === 'UNLOCKED') {
                    nextHint = `Current stage unlocked: upload required. Type **UPLOAD** to submit ${stageFileHints[s.stage_number] || 'the required file'}.`;
                } else if (s.status === 'PENDING') {
                    nextHint = `Stage ${s.stage_number} is PENDING approval by the Field Officer.`;
                } else if (s.status === 'APPROVED') {
                    nextHint = `Stage ${s.stage_number} approved — awaiting lender disbursement.`;
                } else if (s.status === 'LOCKED') {
                    nextHint = `Stage ${s.stage_number} is locked. Complete previous steps.`;
                } else if (s.status === 'COMPLETED') {
                    nextHint = `Stage ${s.stage_number} completed.`;
                }
            }

            let statusMessage = `✅ **Status for ${data.name} (ID: ${id})**\n\n`;
            statusMessage += `🌱 AI Score: ${data.current_status?.score ?? 'N/A'} (Risk: ${data.current_status?.risk_band ?? 'N/A'})\n`;
            
            if (data.has_insurance) {
                const claimStatus = data.insurance_claim_status || 'UNKNOWN';
                const triggerText = data.insurance_triggered ? '⚠️ Triggered' : 'No trigger';
                statusMessage += `🌤️ Insurance Policy: Active | Claim status: ${claimStatus} | ${triggerText}\n\n`;
            } else {
                statusMessage += `🌤️ Insurance Policy: Not yet activated — complete Stage 3 to enable drought cover.\n\n`;
            }
            
            statusMessage += `📋 Stages (${stages.length}):\n`;
            stages.forEach(s => {
                const marker = s.stage_number === (currentStage?.stage_number) ? '→ ' : '   ';
                statusMessage += `${marker}Stage ${s.stage_number}: ${s.stage_name} — ${s.status}\n`;
            });
            statusMessage += `\n📂 Uploaded files: ${uploadedFiles.length ? uploadedFiles.join(', ') : 'None'}\n`;
            statusMessage += `\n➡️ ${nextHint}\n\nType **UPLOAD**, **IOT** for sensor data, or **HELP**.`;

            setChatState('AWAITING_ACTION');
            pushBotMessage(statusMessage);

            const completedStage4 = stages.some(s => s.stage_number === 4 && s.status === 'COMPLETED');
            if (completedStage4 && data.has_insurance && !data.insurance_triggered) {
                pushBotMessage("🌦️ Stage 4 complete! Check for drought risk by typing **IOT** to upload sensor readings.");
            }

        } catch (error) {
            setChatState('AWAITING_COMMAND');
            pushBotMessage(`❌ Error fetching status for ID ${id}. Farmer ID not found or backend issue.`);
            console.error('fetchStatus error', error?.response?.data || error.message || error);
        }
    };

    const handleRegistrationSteps = async (inputText) => {
        let nextState = chatState;
        let botMessage = '';
        let currentData = { ...registrationData };
        if (chatState === 'REG_AWAITING_NAME') {
            currentData.name = inputText;
            nextState = 'REG_AWAITING_PHONE';
            botMessage = "Thanks! Now enter your **Phone Number** (e.g., +27 72 XXX XXXXX).";
        } else if (chatState === 'REG_AWAITING_PHONE') {
            currentData.phone = inputText;
            nextState = 'REG_AWAITING_AGE';
            botMessage = "Got it. Enter your **Age** (e.g., 35).";
        } else if (chatState === 'REG_AWAITING_AGE') {
            const age = parseInt(inputText);
            if (isNaN(age) || age < 18 || age > 100) {
                pushBotMessage("Invalid age. Please enter a number between 18 and 100.");
                return;
            }
            currentData.age = age;
            nextState = 'REG_AWAITING_GENDER';
            botMessage = "What is your **Gender**? (e.g., Male, Female).";
        } else if (chatState === 'REG_AWAITING_GENDER') {
            currentData.gender = inputText;
            nextState = 'REG_AWAITING_ID';
            botMessage = "Please enter your **ID Document** number.";
        } else if (chatState === 'REG_AWAITING_ID') {
            currentData.id_document = inputText;
            nextState = 'REG_AWAITING_CROP';
            botMessage = "Which **Crop** will you grow this season? (e.g., Maize).";
        } else if (chatState === 'REG_AWAITING_CROP') {
            currentData.crop = inputText;
            nextState = 'REG_AWAITING_LAND_SIZE';
            botMessage = "Finally, what's your **Land Size** in hectares (e.g., 2.5)?";
        } else if (chatState === 'REG_AWAITING_LAND_SIZE') {
            const landSize = parseFloat(inputText);
            if (isNaN(landSize) || landSize <= 0) {
                pushBotMessage("Invalid land size. Enter a positive number (e.g., 2.5).");
                return;
            }
            currentData.land_size = landSize;
            nextState = 'AWAITING_ACTION';
            try {
                const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, currentData);
                const newFarmerId = response.data.farmer_id;
                setFarmerId(newFarmerId);
                pushBotMessage(`✅ Registration successful! Your Farmer ID is ${newFarmerId}.`);
                await fetchStatus(newFarmerId);
            } catch (error) {
                pushBotMessage(`❌ Registration failed: ${error.response?.data?.message || error.message}`);
                setChatState('AWAITING_COMMAND');
            }
        }
        setRegistrationData(currentData);
        setChatState(nextState);
        if (botMessage) pushBotMessage(botMessage);
    };

    const initiateUpload = async () => {
        if (!farmerStatus) {
            pushBotMessage("Please run **STATUS** first to know which stage is unlocked.");
            return;
        }
        const nextStage = farmerStatus.stages.find(s => s.status === 'UNLOCKED');
        if (!nextStage) {
            pushBotMessage("No UNLOCKED stage found. You might be waiting for approval.");
            return;
        }
        setShowUploadInput(true);
        const formatInfo = stageFileHints[nextStage.stage_number] || 'Acceptable formats: PDF / JPG';
        pushBotMessage(`Stage ${nextStage.stage_number}: ${nextStage.stage_name} is UNLOCKED. Please type the filename to mock-upload.\nExpected: ${formatInfo}\nType **CANCEL** to abort.`);
    };
    const handleFileUpload = async (fileInput) => {
        setShowUploadInput(false);
        if (!fileInput || fileInput.trim().toUpperCase() === 'CANCEL') {
            pushBotMessage("Upload cancelled.");
            return;
        }
        const trimmed = fileInput.trim();
        const lastDot = trimmed.lastIndexOf('.');
        let fileName = lastDot > 0 ? trimmed.substring(0, lastDot) : trimmed;
        let fileType = lastDot > 0 ? trimmed.substring(lastDot + 1).toLowerCase() : 'pdf';
        
        const nextStage = farmerStatus?.stages?.find(s => s.status === 'UNLOCKED');
        if (!nextStage) {
            pushBotMessage("No unlocked stage found; upload aborted.");
            return;
        }
        const soilData = nextStage.stage_number === 1 ? { ph: 6.8, nitrogen: 30, moisture: 25 } : {};
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, {
                stage_number: nextStage.stage_number,
                file_type: fileType,
                file_name: fileName,
                soil_data: soilData
            });
            pushBotMessage(`✅ ${response.data.message}`);
            await fetchStatus();
        } catch (error) {
            pushBotMessage(`❌ Upload failed: ${error.response?.data?.message || error.message}`);
            console.error('upload error', error?.response?.data || error);
        }
    };

    const initiateIoTPrompt = async () => {
        if (!farmerStatus) {
            pushBotMessage("Please check **STATUS** first.");
            return;
        }
        setShowIoTInput(true);
        pushBotMessage("Please type simple sensor readings (e.g. `temperature:36, moisture:12, ph:6.5`) or type **CANCEL**.");
    };
    const handleIotData = async (dataInput) => {
        setShowIoTInput(false);
        const raw = dataInput.trim();
        if (!raw || raw.toUpperCase() === 'CANCEL') {
            pushBotMessage("IoT upload cancelled.");
            return;
        }
        const parsed = {};
        try {
            raw.split(',').forEach(part => {
                const [k, v] = part.split(':').map(s => s?.trim());
                if (k && v) parsed[k] = isNaN(Number(v)) ? v : Number(v);
            });
        } catch (err) {
            console.warn('IoT parse error', err);
        }
        
        try {
            const resp = await axios.post(`${API_BASE_URL}/api/iot/ingest?farmer_id=${farmerId}`, parsed);
            const data = resp.data;
            if (data.drought_flag) {
                pushBotMessage(`💧 Drought risk detected (moisture=${data.moisture}). An insurance claim has been filed for review.`);
            } else {
                pushBotMessage(`✅ Moisture levels appear normal (moisture=${data.moisture}). No claim filed.`);
            }
            await fetchStatus();
        } catch (err) {
            pushBotMessage("⚠️ IoT upload failed. Please try again later.");
            console.error('IoT ingest failed', err?.response?.data || err);
        }
    };

    const handlePestTrigger = async () => {
        if (!farmerId) { pushBotMessage("No Farmer ID."); return; }
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${farmerId}`);
            pushBotMessage(`✅ ${response.data.message}`);
            await fetchStatus();
        } catch (err) {
            pushBotMessage(`Pest trigger failed: ${err.response?.data?.message || err.message}`);
        }
    };
    const handleInput = async (e) => {
        e.preventDefault();
        const userText = input.trim();
        if (!userText) return;
        const command = userText.toUpperCase();
        pushUserMessage(userText);
        setInput('');
        if (showUploadInput) { await handleFileUpload(userText); return; }
        if (showIoTInput) { await handleIotData(userText); return; }
        if (chatState.startsWith('REG_')) { await handleRegistrationSteps(userText); return; }
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
            case 'RESET':
                setChatState('AWAITING_COMMAND');
                setFarmerId(null);
                setRegistrationData({});
                setFarmerStatus(null);
                pushBotMessage("Chat reset. Type **REGISTER** or **STATUS**.");
                break;
            case 'STATUS':
                if (!farmerId) {
                    setChatState('AWAITING_FARMER_ID');
                    pushBotMessage("Please enter your **Farmer ID** to check your status.");
                } else {
                    await fetchStatus(farmerId);
                }
                break;
            case 'REGISTER':
                setChatState('REG_AWAITING_NAME');
                setRegistrationData({});
                pushBotMessage("To register, please enter your **Full Name**.");
                break;
            case 'HELP':
                pushBotMessage("Commands:\n• **STATUS**\n• **UPLOAD**\n• **IOT**\n• **REGISTER**\n• **RESET**");
                break;
            case 'UPLOAD':
                if (!farmerId) pushBotMessage("Use **STATUS** first.");
                else await initiateUpload();
                break;
            case 'IOT':
                if (!farmerId) pushBotMessage("Use **STATUS** first.");
                else await initiateIoTPrompt();
                break;
            case 'TRIGGER PEST':
                await handlePestTrigger();
                break;
            default:
                pushBotMessage("I didn't understand that. Type **HELP** for a list of commands.");
        }
    };

    useEffect(() => {
        pushBotMessage("Welcome to the GENFIN 🌱 demo. I am your financing assistant. Type **REGISTER** to sign up or **STATUS** if you have a Farmer ID.");
    }, []);

    return (
        <div className="chatbot-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <p><b>Whatsapp Farmer Chatbot Mock-up</b></p>
            <div className="chat-window" style={{ minHeight: 300, maxHeight: 420, overflowY: 'auto' }}>
                {messages.map((msg, index) => (
                    <div key={index} className={`message-row ${msg.sender}`} style={{ marginBottom: 8 }}>
                        <div className="message-bubble" dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }} />
                        <span className="timestamp" style={{ fontSize: 10 }}>{msg.timestamp}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            {showUploadInput && <div className="mock-file-input" style={{ marginTop: 8 }}><label>Mock Upload — Enter filename in chat or type CANCEL</label></div>}
            {showIoTInput && <div style={{ marginTop: 8 }}><small>IoT input open — type `temperature:36, moisture:12, ph:6.5`</small></div>}
            <form className="chat-input-form" onSubmit={handleInput} style={{ marginTop: 8 }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={'Type a command: STATUS, UPLOAD, IOT, REGISTER, HELP'}
                    style={{ padding: 8, flex: 1 }}
                />
                <button type="submit" style={{ marginLeft: 8 }}>Send</button>
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

    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
        } catch (error) {
            console.error("Error fetching farmers:", error);
        }
    };
    const fetchFarmerDetails = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) {
            console.error("Error fetching farmer details:", error);
        }
    };
    const handleDisburse = async (stageNumber) => {
        if (!farmerData) return;
        try {
            await axios.post(`${API_BASE_URL}/api/lender/disburse/${selectedFarmerId}/${stageNumber}`);
            await fetchFarmerDetails(selectedFarmerId);
            await fetchFarmers();
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
                contractHistory={farmerData.contract_history || []}
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

// --- FIELD OFFICER DASHBOARD ---
const FieldOfficerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);
    const fetchFarmers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
            setFarmers(response.data);
        } catch (error) {
            console.error("Error fetching farmers:", error);
        }
    };
    const fetchFarmerDetails = async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) {
            console.error("Error fetching farmer details:", error);
        }
    };
    const handleApprove = async (stageNumber) => {
        if (!farmerData) return;
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/approve/${selectedFarmerId}/${stageNumber}`);
            alert(response.data.message);
            await fetchFarmerDetails(selectedFarmerId);
            await fetchFarmers();
        } catch (error) {
            alert(error.response?.data?.message || "Approval failed.");
        }
    };
    const handlePestTrigger = async () => {
        if (!farmerData) return;
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${selectedFarmerId}`);
            alert(response.data.message);
            await fetchFarmerDetails(selectedFarmerId);
        } catch (error) {
            alert(error.response?.data?.message || "Trigger failed.");
        }
    };
    useEffect(() => {
        fetchFarmers();
    }, []);
    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Field Officer Dashboard</h2>
                <p>Select a farmer to view milestones and approve stages.</p>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className="farmer-card">
                        <div>
                            <strong>{farmer.name} (ID: {farmer.id})</strong><br/>
                            <span>Completed Stages: {farmer.stages_completed} | Score: {farmer.score}</span>
                        </div>
                        <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Stages</button>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
            <h2>{farmerData.name}'s Stage Approvals</h2>
            <div style={{ margin: '15px 0', padding: '10px', border: '1px solid #dc3545', borderRadius: '5px' }}>
                <p style={{ margin: '0 0 10px 0' }}>**Field Officer Action** (Simulate manual trigger):</p>
                <button className="btn-insurer" onClick={handlePestTrigger}>
                    Trigger Pest Event (Unlock Stage 5)
                </button>
                <span style={{ marginLeft: '15px', color: farmerData.current_status.pest_flag ? 'red' : 'green' }}>
                    Pest Flag Status: {farmerData.current_status.pest_flag ? 'ACTIVE' : 'NO EVENT'}
                </span>
            </div>
            <h4>Milestone Checkpoints</h4>
            {farmerData.stages.map(stage => (
                <div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                    <span className="stage-name">{stage.stage_name}</span>
                    <span className="stage-uploads">
                        Uploads: {farmerData.uploads.filter(u => u.stage_number === stage.stage_number).map(u => u.file_name).join(', ') || 'None'}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>{stage.status}</span>
                    {stage.status === 'PENDING' && (
                        <button className="btn-approve" onClick={() => handleApprove(stage.stage_number)}>
                            Approve
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

// --- INSURER DASHBOARD ---
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

    const handleReview = async (action) => {
        if (!selectedFarmerId) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/api/insurance/${selectedFarmerId}/review`, { action });
            alert(res.data.message);
            await fetchFarmerDetails(selectedFarmerId);
            await fetchInsurerFarmers();
        } catch (err) {
            alert(err.response?.data?.message || 'Review failed');
        }
    };

    useEffect(() => {
        fetchInsurerFarmers();
    }, []);

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
    
    const claimStatus = farmerData.insurance_claim_status || 'NONE';

    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchInsurerFarmers(); }}>← Back to List</button>
            <h2>Insurer Dashboard for {farmerData.name}</h2>
            <div className="policy-card">
                <h3>Weather-Index Insurance Policy</h3>
                <p>Policy ID: <strong>{farmerData.policy_id || 'Not Active'}</strong></p>
                <p>Status: <strong style={{color: farmerData.has_insurance ? 'green' : 'orange'}}>{farmerData.has_insurance ? 'ACTIVE' : 'PENDING'}</strong></p>
                <p>Claim Status: <strong>{claimStatus}</strong></p>
            </div>
            
            {claimStatus === 'CLAIM_PENDING' && (
              <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ffc107', borderRadius: '5px' }}>
                  <h4>Claim Review Required</h4>
                  <p>A drought event was triggered via IoT sensor data for this farmer.</p>
                  <button className="btn-approve" onClick={() => handleReview('APPROVE')}>Approve Claim</button>
                  <button className="btn-insurer" onClick={() => handleReview('REJECT')}>Reject Claim</button>
              </div>
            )}
            
            <FarmerDetailsCard 
                farmer={farmerData}
                score={farmerData.current_status.score}
                risk={farmerData.current_status.risk_band}
                xaiFactors={farmerData.current_status.xai_factors || []}
                contractHash={farmerData.contract_hash}
                contractState={farmerData.contract_state}
                stages={farmerData.stages}
                contractHistory={farmerData.contract_history || []}
            />
        </div>
    );
};

// --- WELCOME SCREEN ---
const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        <img src={LOGO_SRC} alt="eSusFarm Africa Logo" className="esusfarm-logo" />
        <h2>GENFIN 🌱 AFRICA</h2>
        <p><b>G20 TechSprint 2025 Demo</b></p>
        <p>Select a user role to begin the stage-based financing flow demonstration.</p>
        <div className="role-buttons">
            <button className="btn-farmer" onClick={() => setView('farmer')}>Farmer Chatbot Mock</button>
            <button className="btn-lender" onClick={() => setView('lender')}>Lender/Admin Dashboard</button>
            <button className="btn-field-officer" onClick={() => setView('fieldOfficer')}>Field Officer Dashboard</button>
            <button className="btn-insurer" onClick={() => setView('insurer')}>Insurer Dashboard</button>
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
