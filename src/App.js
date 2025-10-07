// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
// Ensure this matches the URL where your Flask backend is running
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
// This is the file ID from your Google Drive link: 1JWvtX4b24wt5vRGmhYsUW029NS0grXOq
const LOGO_SRC = "https://lh3.googleusercontent.com/d/1JWvtX4b24wt5vRGmhYsUW029NS0grXOq";

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
        <p className="disclaimer">For Demonstration Only. Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a></p>
    </div>
);

const StageTracker = ({ farmerId, stages, uploads = [], name, phone, totalDisbursed, score, riskBand, xaiFactors, contractState, contractHash, onApproval, onDisburse, onViewContract, onViewXAI }) => (
    <div className="tracker-box">
        <h2>{name}'s Loan Status</h2>
        <p><strong>Phone:</strong> {phone} | <strong>Total Disbursed (Mock):</strong> ${totalDisbursed.toFixed(2)} | <strong>Score:</strong> {score} ({riskBand})</p>
        <p><strong>Contract State:</strong> {contractState} | <strong>Hash:</strong> {contractHash.substring(0, 10)}...</p>
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

const XAIView = ({ xaiFactors, onClose }) => (
    <div className="modal">
        <div className="modal-content">
            <h3>XAI Factors</h3>
            <ul>
                {xaiFactors.map((factor, index) => (
                    <li key={index}>{factor.factor}: +{factor.weight}</li>
                ))}
            </ul>
            <button onClick={onClose}>Close</button>
        </div>
    </div>
);

const ContractView = ({ contractState, contractHash, onClose }) => (
    <div className="modal">
        <div className="modal-content">
            <h3>Contract Timeline</h3>
            <p>Current State: {contractState}</p>
            <p>Hash: {contractHash}</p>
            {/* Mock timeline */}
            <ul>
                <li>DRAFT → ACTIVE (Hash: {contractHash.substring(0, 10)}...)</li>
                <li>ACTIVE → STAGE_1 (Hash: {contractHash.substring(10, 20)}...)</li>
            </ul>
            <button onClick={onClose}>Close</button>
        </div>
    </div>
);

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

const InsurerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
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
            const response = await axios.post(`${API_BASE_URL}/api/insurer/trigger/${farmerId}`, { rainfall: 5 });  // Mock low rainfall
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
        return (
            <div className="dashboard-detail">
                <button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button>
                <h2>{selectedFarmer.name}'s Insurance Status</h2>
                <p>Policy ID: {selectedFarmer.policy_id || 'Not Bound'}</p>
                <p>Triggers: Rainfall &lt;10mm</p>
                <button onClick={() => handleBindPolicy(selectedFarmer.farmer_id)}>Bind Policy</button>
                <button onClick={() => handleCheckTrigger(selectedFarmer.farmer_id)}>Check Trigger</button>
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
        addMessage("BOT", "Welcome to GENFIN-AFRICA demo! Type 'REGISTER' to start, 'STATUS' for ID.");
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
            addMessage('BOT', `Registration complete! Your ID: ${newId}. Type 'STATUS' to check.`);
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
                addMessage('BOT', `Type 'TRIGGER' to submit, 'UPLOAD' for files, 'IOT' for sensor, 'STATUS' to refresh.`);
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
                addMessage("BOT", "Type mock soil test file name (e.g., soil_test.json) or enter JSON data.");
                setFlowState('UPLOAD_SOIL_TEST');
                setShowMockFileInput(true);
            } else if ([3,4,6,7].includes(nextStage.stage_number)) {
                addMessage("BOT", `Type mock photo file name for Stage ${nextStage.stage_number} (e.g., photo.jpg).`);
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
            // Parse mock input
            const data = { plot_id: 1, ph: 7, moisture: 25, temperature: 30, n: 10, p: 10, k: 10, salinity: 1, ec: 1 };  // Mock parse
            const response = await axios.post(`${API_BASE_URL}/api/iot/ingest`, data);
            addMessage('BOT', response.data.message);
            if (farmerId) handleStatus(farmerId);  // Refresh for pest flag
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
                const finalData = { ...farmerData, land_size: landSize, geo_tag: '0.0,0.0' };  // Mock geo
                handleRegistration(finalData);
            }
        } else if (flowState === 'UPLOAD_SOIL_TEST') {
            // Mock JSON parse if input is JSON
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
                addMessage("BOT", "Type 'TRIGGER', 'STATUS', 'UPLOAD', 'IOT'.");
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
            {view === 'insurer' && <InsurerDashboard setView={setView} />}
        </div>
    );
};

export default App;
