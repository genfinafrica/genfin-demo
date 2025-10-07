// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

// Ensure this matches the URL where your Flask backend is running
// If you changed the port to 5001, update this line:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'; 

// This is the logo source from your Google Drive link
const LOGO_SRC = "https://lh3.googleusercontent.com/d/1JWvtX4b24wt5vRGmhYsUW029NS0grXOq";

// --- UTILITY COMPONENTS ---

// Generic Modal Component (FIX for XAI/Contract Popups)
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

// Helper function to format bot message text with action styling (FIX for Bolding)
const formatBotMessage = (text) => {
    // The regex matches the command words and replaces them with a styled span.
    const regex = /(STATUS|NEXT STAGE|UPLOAD|REGISTER)/g;
    return text.replace(regex, '<span class="chatbot-action-prompt">$&</span>');
};

// --- DASHBOARD COMPONENTS ---

const FarmerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages }) => {
    const [showXaiModal, setShowXaiModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

    // Filter and prepare XAI data for modal table
    const xaiData = xaiFactors && xaiFactors.length > 0
        ? xaiFactors.map(f => [f.factor, f.weight.toFixed(1)])
        : [['N/A', 'N/A']];
    xaiData.unshift(['Factor', 'Contribution']);

    // Mock Contract Log Data (Needs to be fetched from API for real data, here we mock it)
    const mockContractLog = [
        ['2025-01-01 10:00', 'DRAFT', contractHash.substring(0, 10) + '...'],
        ['2025-01-01 11:30', 'ACTIVE', 'A5B7C2D9E0...'],
        ['2025-01-08 09:00', 'STAGE_1_COMPLETED', 'F8G2H4I6J7...'],
        ['2025-02-15 14:00', contractState, contractHash.substring(0, 10) + '...']
    ];
    mockContractLog.unshift(['Timestamp', 'State Transition', 'Hash']);
    
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

            {/* XAI Modal (FIX: Rendered as a Popup) */}
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

            {/* Contract Modal (FIX: Rendered as a Popup) */}
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
                        {mockContractLog.slice(1).map((row, index) => (
                            <tr key={index}>
                                <td>{row[0]}</td>
                                <td>{row[1]}</td>
                                <td>{row[2]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Modal>
        </div>
    );
};


// --- CHATBOT MOCK (Updated to fix Status Display, Registration Flow, Upload, and Formatting) ---

const FarmerChatbotMock = ({ setView }) => {
    // Existing State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [farmerId, setFarmerId] = useState(1);
    const [farmerStatus, setFarmerStatus] = useState(null);
    const [showUploadInput, setShowUploadInput] = useState(false);
    const [showIoTInput, setShowIoTInput] = useState(false);
    const messagesEndRef = useRef(null);

    // --- NEW STATE FOR FLOW CONTROL ---
    const [chatState, setChatState] = useState('AWAITING_COMMAND'); // Controls multi-step interactions
    const [registrationData, setRegistrationData] = useState({}); // Stores data during registration flow
    // ---------------------------------

    // --- UTILITIES (KEEPING ALL EXISTING UTILITIES) ---
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'; 
    
    // Helper function for consistent message formatting (bolding commands)
    const formatBotMessage = (text) => {
        const regex = /(STATUS|REGISTER|HELP|RESET|NEXT STAGE|UPLOAD|BACK|CANCEL|TRIGGER PEST|TRIGGER INSURANCE|INGEST IOT|Full Name|Phone Number|Age|Gender|ID Document|Next of Kin|Crop|Land Size)/gi;
        return text.replace(regex, (match) => {
            // Apply different styling if needed, currently just bolding
            return `<strong>${match}</strong>`; 
        });
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
    
    // --- MAIN FLOW FUNCTIONS ---

    // Refactored to embed status message directly into chat (Fix 1)
    const fetchStatus = async (id = farmerId) => {
        if (!id) {
            pushBotMessage("Error: No Farmer ID available to check status.");
            return;
        }
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            setFarmerStatus(response.data); // Keep state updated for other functions

            const status = response.data.current_status;
            const stages = response.data.stages;
            const completedStages = stages.filter(s => s.status === 'COMPLETED').length;
            
            // Generate detailed status message for the chat bubble
            let statusMessage = `✅ **Status for ${response.data.name} (ID: ${id})**\n\n`;
            statusMessage += `**Proficiency Score:** ${status.score} (${status.risk_band})\n`;
            statusMessage += `**Contract State:** ${response.data.contract_state}\n`;
            statusMessage += `**Stages:** ${completedStages} / ${stages.length} Completed\n`;
            statusMessage += `**Pest Flag:** ${status.pest_flag ? '⚠️ ACTIVE' : 'NO'}\n`;
            statusMessage += `**Total Disbursed:** $${status.total_disbursed.toFixed(2)}\n\n`;
            
            setChatState('AWAITING_ACTION'); // Move to general command state after status check
            pushBotMessage(statusMessage + `\nWhat's next? Type **NEXT STAGE**, **UPLOAD**, or **STATUS**.`);
        } catch (error) {
            setChatState('AWAITING_COMMAND'); // Return to start on error
            pushBotMessage(`❌ Error fetching status for ID ${id}. Farmer ID not found or backend issue. Please check **STATUS** again or **REGISTER**.`);
            console.error(error);
        }
    };
    
    // --- MULTI-STEP REGISTRATION HANDLER (Fix 3: Added Age, Gender, ID, Next of Kin) ---
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
            nextState = 'REG_AWAITING_AGE'; // New Step
            botMessage = "Got it. Please enter your **Age** (e.g., 35).";
        } else if (chatState === 'REG_AWAITING_AGE') {
            const age = parseInt(input);
            if (isNaN(age) || age < 18 || age > 100) {
                pushBotMessage("Invalid Age. Please enter a valid number between 18 and 100.");
                return;
            }
            currentData.age = age;
            nextState = 'REG_AWAITING_GENDER'; // New Step
            botMessage = "What is your **Gender**? (Type M for Male or F for Female).";
        } else if (chatState === 'REG_AWAITING_GENDER') {
            const gender = input.trim().toUpperCase();
            if (gender !== 'M' && gender !== 'F') {
                pushBotMessage("Invalid entry. Please type M for Male or F for Female.");
                return;
            }
            currentData.gender = (gender === 'M' ? 'Male' : 'Female');
            nextState = 'REG_AWAITING_ID'; // New Step
            botMessage = "Please enter your **ID Document** number (e.g., National ID or Passport number).";
        } else if (chatState === 'REG_AWAITING_ID') {
            currentData.id_document = input;
            nextState = 'REG_AWAITING_NEXTOFKIN'; // New Step
            botMessage = "Please enter the **Full Name** of your **Next of Kin**.";
        } else if (chatState === 'REG_AWAITING_NEXTOFKIN') {
            currentData.next_of_kin = input;
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
            
            // --- FINAL API CALL ---
            try {
                // The final data contains all the required KYC/XAI fields
                const finalData = { ...currentData };
                
                // Assuming backend route is /api/farmer/register
                const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, finalData); 
                const newFarmerId = response.data.farmer_id;
                setFarmerId(newFarmerId);
                
                pushBotMessage(`✅ Registration successful! Your Farmer ID is ${newFarmerId}. You can now use commands: **STATUS**, **NEXT STAGE**, **UPLOAD**.`);
                await fetchStatus(newFarmerId); 
            } catch (error) {
                pushBotMessage(`❌ Registration failed: ${error.response?.data?.message || 'A network or server error occurred.'}`); 
                setChatState('AWAITING_COMMAND'); // Return to start on failure
            }
            // --- END FINAL API CALL ---
        }

        setRegistrationData(currentData);
        setChatState(nextState);
        if (botMessage) {
            pushBotMessage(botMessage);
        }
    };
    
    // --- UPLOAD HANDLERS (Fix 2: Improved File Input Parsing and Validation) ---
    
    // Mapping acceptable formats to stages
    const stageFileFormats = {
        1: 'csv (Soil Test Data)',
        2: 'jpg, jpeg, png, pdf (Input Purchase Evidence)',
        3: 'pdf (Insurance Premium Proof)',
        4: 'jpg, jpeg, png, pdf (Weeding/Maintenance Photo)',
        6: 'jpg, jpeg, png, pdf (Harvest Photo)',
        7: 'jpg, jpeg, png, pdf (Transport/Marketing Proof)',
    };
    
    const initiateUpload = async () => {
        if (!farmerStatus) {
            // Ensure status is fetched first
            await fetchStatus(farmerId); 
            // If still no status, cannot proceed
            if (!farmerStatus) {
                 pushBotMessage("Please check **STATUS** first to load your contract data.");
                 return;
            }
        }
        
        const nextStage = farmerStatus.stages.find(s => s.status === 'UNLOCKED' || s.status === 'PENDING');
        if (!nextStage) {
            pushBotMessage("All stages are either COMPLETED or LOCKED. No upload required now.");
            return;
        }

        // ... Conditional Stage 5 logic check (keeping existing logic) ...
        
        setShowUploadInput(true);
        const formatInfo = stageFileFormats[nextStage.stage_number] || 'jpg, pdf';
        
        let uploadInstructions = `
            Stage ${nextStage.stage_number}: ${nextStage.stage_name} is UNLOCKED.
            Please enter the **file name** and **file type** separated by a comma, e.g., 'Soil_Report,csv'.
            **Acceptable formats for Stage ${nextStage.stage_number}:** ${formatInfo}.
            Type **CANCEL** to abort.
        `;
        pushBotMessage(uploadInstructions);
    };

    const handleFileUpload = async (fileInput) => {
        // Fix 2: Better parsing and validation for 'filename,type'
        const parts = fileInput.split(',').map(s => s.trim().toLowerCase());
        const fileName = parts[0];
        const fileType = parts.length > 1 ? parts[1] : ''; 
        
        if (fileName === 'cancel') {
            pushBotMessage("Upload cancelled. What's next? **STATUS** or **NEXT STAGE**.");
            return;
        }
        
        if (!fileName || !fileType || parts.length > 2) {
            pushBotMessage("Invalid format. Please enter **file name** and **file type** separated by a **single comma**, e.g., 'Photo_1,jpg'. Try **UPLOAD** again.");
            return;
        }

        const nextStage = farmerStatus.stages.find(s => s.status === 'UNLOCKED' || s.status === 'PENDING');
        if (!nextStage) return; // Should not happen if initiateUpload was called correctly

        // Mock Soil Test Data (for stage 1)
        const soilData = nextStage.stage_number === 1 ?
        { ph: 6.8, nitrogen: 30, moisture: 25 } : {};
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, {
                stage_number: nextStage.stage_number,
                file_type: fileType,
                file_name: fileName,
                soil_data: soilData 
            });
            pushBotMessage(`✅ ${response.data.message} Status updated to PENDING for Field Officer approval. Type **STATUS** to view score update.`);
        } catch (error) {
            pushBotMessage(`❌ Upload failed: ${error.response?.data?.message || error.message}`);
        }
    };
    
    // --- OTHER COMMAND HANDLERS (Keeping existing logic) ---
    
    const handleNextStage = async () => {
        // ... (existing logic) ...
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`);
            pushBotMessage(`✅ ${response.data.message} Type **STATUS** to check for updates.`);
        } catch (error) {
            pushBotMessage(`Stage trigger failed: ${error.response?.data?.message || error.message}. Check **STATUS** to see if a file **UPLOAD** is required.`);
        }
    };

    const handlePestTrigger = async () => {
        // ... (existing logic) ...
         try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${farmerId}`);
            pushBotMessage(`✅ ${response.data.message}`);
        } catch (error) {
             pushBotMessage(`❌ Pest trigger failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleInsuranceTrigger = async () => {
        // ... (existing logic) ...
         try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/trigger/${farmerId}`, { rainfall: 5 });
            pushBotMessage(`✅ ${response.data.message}`);
        } catch (error) {
             pushBotMessage(`❌ Insurance trigger failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleIotData = async (dataInput) => {
         // ... (existing logic) ...
         if (dataInput.toUpperCase() === 'CANCEL') {
            pushBotMessage("IoT data ingestion cancelled. What's next? **STATUS** or **NEXT STAGE**.");
            return;
        }

        const data = dataInput.split(',').reduce((acc, part) => {
            const [key, value] = part.trim().split(' ');
            if (key && value) {
                 acc[key.toLowerCase()] = parseFloat(value);
            }
            return acc;
        }, {});
        
        try {
            const response = await axios.post(`${API_BASE_URL}/api/iot/ingest`, data);
            pushBotMessage(`✅ ${response.data.message} Type **STATUS** to check for updates.`);
        } catch (error) {
             pushBotMessage(`❌ IoT ingestion failed: ${error.response?.data?.message || error.message}`);
        }
    };
    
    // --- MAIN INPUT HANDLER ---
    const handleInput = async (e) => {
        e.preventDefault();
        const userText = input.trim();
        const command = userText.toUpperCase();
        pushUserMessage(userText);
        setInput('');

        // 1. Handle command RESET globally
        if (command === 'RESET') {
            setChatState('AWAITING_COMMAND');
            setFarmerId(null);
            setRegistrationData({});
            setFarmerStatus(null); // Clear status card/data
            pushBotMessage("Chat state reset. Please type **STATUS**, **REGISTER**, or **HELP** to begin.");
            return;
        }
        
        // 2. Initial Command Check (AWAITING_COMMAND)
        if (chatState === 'AWAITING_COMMAND') {
            if (command === 'STATUS') {
                setChatState('AWAITING_FARMER_ID');
                pushBotMessage("Please enter your **Farmer ID** to check your status.");
                return;
            } else if (command === 'REGISTER') {
                setChatState('REG_AWAITING_NAME');
                setRegistrationData({});
                pushBotMessage("To start registration, please enter your **Full Name**.");
                return;
            } else if (command === 'HELP') {
                 pushBotMessage("You can use **STATUS** to check your loan status, **REGISTER** to sign up for a new account, or **RESET** to restart the conversation.");
                 return;
            }
             pushBotMessage(`Unrecognized command: ${userText}. Please type **STATUS**, **REGISTER**, or **HELP**.`);
             return;
        }

        // 3. Status Flow: Awaiting Farmer ID input
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

        // 4. Registration Flow: Awaiting multi-step inputs
        if (chatState.startsWith('REG_')) {
            await handleRegistrationSteps(userText);
            return;
        }
        
        // 5. Existing specialized handlers (Upload/IoT data input)
        if (showUploadInput) {
            handleFileUpload(userText); 
            setShowUploadInput(false);
            return;
        }

        if (showIoTInput) {
            handleIotData(userText);
            setShowIoTInput(false);
            return;
        }

        // 6. General Command Switch (AWAITING_ACTION state)
        switch (command) {
            case 'STATUS':
                // Re-initiate flow to ask for ID if not already set, otherwise fetch
                if (!farmerId) {
                    setChatState('AWAITING_FARMER_ID');
                    pushBotMessage("Please enter your **Farmer ID** to check your status.");
                } else {
                    fetchStatus(farmerId);
                }
                break;
            
            case 'NEXT STAGE':
                handleNextStage();
                break;
                
            case 'UPLOAD':
                await initiateUpload();
                break;

            case 'TRIGGER PEST': 
                handlePestTrigger();
                break;

            case 'TRIGGER INSURANCE': 
                handleInsuranceTrigger();
                break;

            case 'INGEST IOT': 
                setShowIoTInput(true);
                pushBotMessage("Please enter mock IoT data (e.g., pH 6.8, Moisture 20, Temp 30) or type **CANCEL**.");
                break;
            case 'BACK':
                setView('welcome');
                break;
            default:
                pushBotMessage("I didn't understand that. Please try **STATUS**, **NEXT STAGE**, **UPLOAD**, or **BACK**.");
        }
    };
    
    // --- INITIALIZATION ---
    useEffect(() => {
        pushBotMessage(`Welcome to the GENFIN 🌱 Demo. I am your financing assistant. Please **REGISTER** to start or type **STATUS** if you already have a Farmer ID.`);
    }, []);
    
    // --- RENDER ---
    return (
        <div className="chatbot-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <h2>Farmer Chatbot Interface</h2>
            
            {/* FIX 1: REMOVED FarmerDetailsCard render here to embed status in chat */}
            {/* The FarmerDetailsCard is typically for Lender/Field Officer dashboards. */}
            
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-row ${msg.sender}`}>
                        <div className="message-bubble" dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }} />
                        <span className="timestamp">{msg.timestamp}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Registration instruction updated to reflect current state */}
            {chatState.startsWith('REG_') && (
                <div className="mock-file-input">
                    <span>Registration in progress: Enter the requested information above.</span>
                </div>
            )}
            
            {(showUploadInput || showIoTInput) && (
                 <div className="mock-file-input">
                    <label htmlFor="mock-file">Select File (Mock)</label>
                    <input type="file" id="mock-file" disabled />
                    <span>Specify file name and type (e.g., 'Soil_Report,csv', 'Photo,jpg') and press Send.</span>
                </div>
            )}
            
            <form className="chat-input-form" onSubmit={handleInput}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        chatState.includes('REG_AWAITING_') 
                        ? 'Enter registration data...' 
                        : chatState === 'AWAITING_FARMER_ID' 
                        ? 'Enter Farmer ID...' 
                        : 'Type your command (STATUS, REGISTER, NEXT STAGE, etc.)...'
                    }
                />
                <button type="submit">Send</button>
            </form>
            <p className="disclaimer">For Demonstration Only.
            Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a></p>
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
            const response = await axios.post(`${API_BASE_URL}/api/lender/disburse/${selectedFarmerId}/${stageNumber}`);
            alert(response.data.message);
            // Re-fetch details after disbursement
            fetchFarmerDetails(selectedFarmerId); 
        } catch (error) {
            alert(error.response?.data?.message || "Disbursement failed.");
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);
    
    // Render list of farmers
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
    
    // Render detailed view
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
            fetchFarmerDetails(selectedFarmerId); 
        } catch (error) {
            alert(error.response?.data?.message || "Approval failed.");
        }
    };

    const handlePestTrigger = async () => {
        if (!farmerData) return;
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${selectedFarmerId}`);
            alert(response.data.message);
            fetchFarmerDetails(selectedFarmerId);
        } catch (error) {
            alert(error.response?.data?.message || "Trigger failed.");
        }
    };


    useEffect(() => {
        fetchFarmers();
    }, []);

    // Render list of farmers
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
    
    // Render detailed view
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
            <h2>{farmerData.name}'s Stage Approvals</h2>
            
            {/* Pest Trigger Action */}
            <div style={{ margin: '15px 0', padding: '10px', border: '1px solid #dc3545', borderRadius: '5px' }}>
                <p style={{ margin: '0 0 10px 0' }}>**Field Officer Action** (Simulate manual or IoT confirmation):</p>
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
    const [farmerData, setFarmerData] = useState(null);
    const farmerId = 1; // Always use mock farmer 1 for the demo

    const fetchFarmerDetails = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`);
            setFarmerData(response.data);
        } catch (error) {
            console.error("Error fetching farmer details:", error);
            setFarmerData(null);
        }
    };
    
    const handleBindPolicy = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/bind/${farmerId}`);
            alert(response.data.message);
            fetchFarmerDetails(); 
        } catch (error) {
            alert(error.response?.data?.message || "Policy binding failed.");
        }
    };

    const handleClaimCheck = async () => {
        try {
            // Mocking a drought trigger (rainfall < 10)
            const response = await axios.post(`${API_BASE_URL}/api/insurer/trigger/${farmerId}`, { rainfall: 5 });
            alert(response.data.message);
            fetchFarmerDetails(); 
        } catch (error) {
            alert(error.response?.data?.message || "Claim check failed.");
        }
    };

    useEffect(() => {
        fetchFarmerDetails();
    }, []);
    
    // Find policy details
    const policy = farmerData?.policy_id ? {
        policy_id: farmerData.policy_id,
        status: farmerData.stages.find(s => s.stage_name.includes('Insurance'))?.status === 'COMPLETED' ? 'ACTIVE' : 'PENDING' // Mocking active state after disbursement
    } : null;
    
    // Render
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <h2>Insurer Dashboard</h2>
            <p>Mock View for Farmer ID: {farmerId} ({farmerData?.name || 'Loading...'})</p>

            {/* Policy Status Card (FIX: Added policy-card styling) */}
            <div className="policy-card">
                <h3>Weather-Index Insurance Policy</h3>
                {!policy ? (
                    <p>No policy created yet. Complete Stage 3 to generate policy.</p>
                ) : (
                    <>
                        <p>Policy ID: <strong>{policy.policy_id}</strong></p>
                        <p>Status: 
                            <span className={`policy-status-${(policy.status || 'PENDING').toLowerCase()}`}>
                                <strong>{policy.status}</strong>
                            </span>
                        </p>
                        <p>Triggers: Rainfall below 10mm (Mock)</p>
                    </>
                )}
            </div>

            <div style={{ margin: '20px 0' }}>
                <h4>Insurer Actions</h4>
                <button className="btn-insurer" onClick={handleBindPolicy} disabled={policy?.status === 'ACTIVE'}>
                    Bind Policy (Mock API)
                </button>
                <button className="btn-insurer" onClick={handleClaimCheck} disabled={policy?.status !== 'ACTIVE'}>
                    Check Claim Trigger (Drought Mock)
                </button>
            </div>
            
            {farmerData && (
                 <FarmerDetailsCard 
                    farmer={farmerData}
                    score={farmerData.current_status.score}
                    risk={farmerData.current_status.risk_band}
                    xaiFactors={farmerData.current_status.xai_factors || []}
                    contractHash={farmerData.contract_hash}
                    contractState={farmerData.contract_state}
                    stages={farmerData.stages}
                />
            )}
        </div>
    );
};

// --- WELCOME SCREEN ---

const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        {/* LOGO ELEMENT */}
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
