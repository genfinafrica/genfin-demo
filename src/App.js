// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; [span_0](start_span)//[span_0](end_span)

// Ensure this matches the URL where your Flask backend is running
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'; [span_1](start_span)//[span_1](end_span)

// This is the file ID from your Google Drive link: 1JWvtX4b24wt5vRGmhYsUW029NS0grXOq
const LOGO_SRC = "https://lh3.googleusercontent.com/d/1JWvtX4b24wt5vRGmhYsUW029NS0grXOq"; [span_2](start_span)//[span_2](end_span)

// --- Helper Components (New/Updated for Modals) ---

// Generic Modal Wrapper (Needed for XAIView and ContractView)
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        // Using existing/mock modal class names
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};


// Updated XAIView Component (More detailed and visual)
[span_3](start_span)const XAIView = ({ xaiFactors, onClose }) => { //[span_3](end_span)
    return (
        <Modal isOpen={true} onClose={onClose} title="Explainable AI (XAI) Factors">
            <p>The **Farmer Proficiency Score** is calculated based on these weighted factors:</p>
            <ul className="xai-factors-list">
                [span_4](start_span){xaiFactors.map((factor, index) => ( //[span_4](end_span)
                    // Mocking class for visual distinction (e.g., green for positive, red for negative)
                    <li key={index} className={`xai-factor xai-factor-${factor.weight > 0 ? 'pos' : 'neg'}`}>
                        <span>{factor.factor}</span>
                        <span className="xai-contribution">{factor.weight > 0 ? [span_5](start_span)`+${factor.weight.toFixed(2)}` : factor.weight.toFixed(2)}</span> {/*[span_5](end_span) */}
                    </li>
                ))}
            </ul>
            [span_6](start_span)<button onClick={onClose}>Close</button> {/*[span_6](end_span) */}
        </Modal>
    );
};

// NEW: ContractView Component (Audit Trail)
[span_7](start_span)const ContractView = ({ contractState, contractHash, onClose }) => { //[span_7](end_span)
    // Mock history data based on expected state transitions
    const history = [
        [span_8](start_span){ timestamp: new Date(Date.now() - 3600000).toLocaleString(), state: 'DRAFT → ACTIVE', hash: contractHash.substring(0, 10) + '...' }, //[span_8](end_span)
        [span_9](start_span){ timestamp: new Date(Date.now() - 2400000).toLocaleString(), state: 'ACTIVE → STAGE_1_PENDING', hash: contractHash.substring(10, 20) + '...' }, //[span_9](end_span)
        { timestamp: new Date(Date.now() - 1200000).toLocaleString(), state: 'STAGE_1_PENDING → STAGE_1_COMPLETED', hash: contractHash.substring(20, 30) + '...' },
        { timestamp: new Date().toLocaleString(), state: `LATEST: ${contractState}`, hash: contractHash },
    ].reverse();

    return (
        [span_10](start_span)<Modal isOpen={true} onClose={onClose} title="Smart Contract Timeline"> {/*[span_10](end_span) */}
            <p><strong>Current State:</strong> {contractState}</p>
            [span_11](start_span)<p><strong>Latest Hash:</strong> {contractHash}</p> {/*[span_11](end_span) */}
            <div className="contract-timeline">
                {history.map((item, index) => (
                    <div key={index} className="timeline-item">
                        <p><strong>{item.timestamp}</strong></p>
                        <p>{item.state}</p>
                        <p className="hash-code">Hash: <code>{item.hash}</code></p>
                    </div>
                ))}
            </div>
            [span_12](start_span)<button onClick={onClose}>Close</button> {/*[span_12](end_span) */}
        </Modal>
    );
};


// --- Stage Tracker Component (MODIFIED) ---

[span_13](start_span)const StageTracker = ({ farmerId, stages, uploads = [], name, phone, totalDisbursed, score, riskBand, xaiFactors, contractState, contractHash, onApproval, onDisburse, onViewContract, onViewXAI, onReportDownload, onPestTrigger }) => { //[span_13](end_span)
    
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
            setActionMessage(`❌ Pest Trigger Failed: ${error.message || 'Server error.'}`);
        }
    }


    return (
        [span_14](start_span)<div className="tracker-box"> {/*[span_14](end_span) */}
            [span_15](start_span)<h2>{name}'s Loan Status</h2> {/*[span_15](end_span) */}

            {/* FIXED: AI Score Accentuation */}
            <div className="ai-score-badge" style={{ borderColor: scoreColor }}>
                <p><strong>Phone:</strong> {phone} | [span_16](start_span)<strong>Total Disbursed (Mock):</strong> ${totalDisbursed.toFixed(2)}</p> {/*[span_16](end_span) */}
                <p>
                    <span className="ai-label">AI Proficiency Score:</span>
                    <span className="score-value" style={{ color: scoreColor }}>
                        {score}
                    </span>
                    [span_17](start_span)<span className="risk-band">({riskBand} Risk)</span> {/*[span_17](end_span) */}
                    <button className="btn-xai-view" onClick={onViewXAI}>View XAI</button>
                </p>
            </div>

            {/* FIXED: Contract Hash Display */}
            <p className="contract-status-bar" onClick={onViewContract}>
                <strong>Contract State:</strong> {contractState} | [span_18](start_span)<strong>Hash:</strong> {contractHash.substring(0, 10)}... (Click for Audit) {/*[span_18](end_span) */}
            </p>

            {actionMessage && <p className={`action-message ${actionMessage.startsWith('✅') ? 'success' : 'error'}`}>{actionMessage}</p>}

            [span_19](start_span){stages.map(stage => ( //[span_19](end_span)
                [span_20](start_span)<div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}> {/*[span_20](end_span) */}
                    [span_21](start_span)<span className="stage-icon">{ /*[span_21](end_span) */
                        stage.status === 'COMPLETED' ? '✅' :
                        stage.status === 'APPROVED' ? '✔️' :
                        stage.status === 'PENDING' ? [span_22](start_span)'⏳' : //[span_22](end_span)
                        stage.status === 'UNLOCKED' ? [span_23](start_span)'🔓' : //[span_23](end_span)
                        '🔒'
                    }</span>
                    [span_24](start_span)<span className="stage-name">Stage {stage.stage_number}: {stage.stage_name}</span> {/*[span_24](end_span) */}
                    [span_25](start_span)<span className="stage-disbursement">(${stage.disbursement_amount.toFixed(2)})</span> {/*[span_25](end_span) */}
                    
                    [span_26](start_span)<div className="stage-uploads"> {/*[span_26](end_span) */}
                        Uploads: {uploads.filter(u => u.stage_number === stage.stage_number).map(u => u.file_name).join(', ') || [span_27](start_span)'None'} {/*[span_27](end_span) */}
                    </div>
                    
                    {/* Field Officer Approval Button */}
                    [span_28](start_span){stage.status === 'PENDING' && onApproval && ( //[span_28](end_span)
                        <button
                            className="btn-approve"
                            [span_29](start_span)onClick={handleAction(onApproval, farmerId, stage.stage_number)} //[span_29](end_span)
                        >
                            Approve Stage
                        </button>
                    )}
                    
                    {/* Lender Disburse Button */}
                    [span_30](start_span){stage.status === 'APPROVED' && onDisburse && ( //[span_30](end_span)
                        <button
                            className="btn-approve btn-disburse" // Added btn-disburse for styling differentiation
                            [span_31](start_span)onClick={handleAction(onDisburse, farmerId, stage.stage_number)} //[span_31](end_span)
                        >
                            Disburse Funds
                        [span_32](start_span)</button> //[span_32](end_span)
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
            [span_33](start_span)<button className="btn-view" onClick={onViewXAI}>View XAI Factors</button> {/*[span_33](end_span) */}
            [span_34](start_span)<button className="btn-view" onClick={onViewContract}>View Contract Timeline</button> {/*[span_34](end_span) */}
            <a
                [span_35](start_span)href={`${API_BASE_URL}/api/report/farmer/${farmerId}`} //[span_35](end_span)
                target="_blank"
                rel="noopener noreferrer"
                className="btn-report"
            >
                Export PDF Report 📄
            [span_36](start_span)</a> {/*[span_36](end_span) */}
        </div>
    );
};


// --- Farmer Chatbot Mock (FIXED) ---

const FarmerChatbotMock = ({ setView }) => {
    const [chatHistory, setChatHistory] = useState([]); [span_37](start_span)//[span_37](end_span)
    const [input, setInput] = useState(''); [span_38](start_span)//[span_38](end_span)
    const [flowState, setFlowState] = useState('INTRO'); [span_39](start_span)//[span_39](end_span)
    const [farmerData, setFarmerData] = useState({}); [span_40](start_span)//[span_40](end_span)
    const [farmerId, setFarmerId] = useState(null); [span_41](start_span)//[span_41](end_span)
    const [showMockFileInput, setShowMockFileInput] = useState(false); [span_42](start_span)//[span_42](end_span)
    const [showIoTInput, setShowIoTInput] = useState(false); [span_43](start_span)//[span_43](end_span)
    const chatWindowRef = useRef(null); [span_44](start_span)//[span_44](end_span)

    [span_45](start_span)const addMessage = (sender, text) => { //[span_45](end_span)
        setChatHistory(prev => [...prev, { sender, text, time: new Date() }]); [span_46](start_span)//[span_46](end_span)
    };

    useEffect(() => {
        if (chatWindowRef.current) {
            [span_47](start_span)chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight; //[span_47](end_span)
        }
    }, [chatHistory]); [span_48](start_span)//[span_48](end_span)

    [span_49](start_span)const startFlow = () => { //[span_49](end_span)
        setChatHistory([]); [span_50](start_span)//[span_50](end_span)
        setFarmerId(null); [span_51](start_span)//[span_51](end_span)
        setShowMockFileInput(false); [span_52](start_span)//[span_52](end_span)
        setShowIoTInput(false); [span_53](start_span)//[span_53](end_span)
        // FIXED: Restored user-friendly, guided prompt
        addMessage("BOT", "Welcome to GENFIN-AFRICA Chatbot! Type 'REGISTER' to start financing, or 'STATUS' to check progress (requires ID)."); [span_54](start_span)//[span_54](end_span)
        setFlowState('INTRO'); [span_55](start_span)//[span_55](end_span)
    };

    [span_56](start_span)useEffect(() => { //[span_56](end_span)
        startFlow(); [span_57](start_span)//[span_57](end_span)
    }, []); [span_58](start_span)//[span_58](end_span)

    [span_59](start_span)const handleRegistration = async (dataToRegister) => { //[span_59](end_span)
        const payload = {
            name: dataToRegister.name,
            phone: dataToRegister.phone,
            crop: dataToRegister.crop,
            land_size: parseFloat(dataToRegister.land_size),
            id_document: dataToRegister.id_document,
            [span_60](start_span)gender: dataToRegister.gender, //[span_60](end_span)
            [span_61](start_span)age: parseInt(dataToRegister.age), //[span_61](end_span)
            [span_62](start_span)geo_tag: dataToRegister.geo_tag //[span_62](end_span)
        }; [span_63](start_span)//[span_63](end_span)
        addMessage('BOT', "Submitting registration..."); [span_64](start_span)//[span_64](end_span)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, payload); [span_65](start_span)//[span_65](end_span)
            const newId = response.data.farmer_id; [span_66](start_span)//[span_66](end_span)
            setFarmerId(newId); [span_67](start_span)//[span_67](end_span)
            addMessage('BOT', `Registration complete! Your ID: ${newId}. Type 'STATUS' to check your first stage!`); [span_68](start_span)//[span_68](end_span)
            setFlowState('READY'); [span_69](start_span)//[span_69](end_span)
        [span_70](start_span)} catch (error) { //[span_70](end_span)
            addMessage('BOT', `Registration failed: ${error.response?.data?.message || 'Server error'}`); [span_71](start_span)//[span_71](end_span)
            setFlowState('INTRO'); [span_72](start_span)//[span_72](end_span)
        [span_73](start_span)} //[span_73](end_span)
    }; [span_74](start_span)//[span_74](end_span)

    [span_75](start_span)const handleStatus = async (id) => { //[span_75](end_span)
        const maxAttempts = 3; [span_76](start_span)//[span_76](end_span)
        let attempts = 0; [span_77](start_span)//[span_77](end_span)
        [span_78](start_span)while (attempts < maxAttempts) { //[span_78](end_span)
            try {
                const statusResponse = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`); [span_79](start_span)//[span_79](end_span)
                // NEW/FIXED: Simpler, clearer status output lines
                [span_80](start_span)const stagesText = statusResponse.data.stages.map(s => //[span_80](end_span)
                    `${
                        s.status === 'COMPLETED' ? '✅' :
                        s.status === 'APPROVED' ? '✔️' :
                        s.status === 'PENDING' ? [span_81](start_span)'⏳' : //[span_81](end_span)
                        s.status === 'UNLOCKED' ? [span_82](start_span)'🔓' : '🔒' //[span_82](end_span)
                    } Stage ${s.stage_number}: ${s.stage_name} - ${s.status}`).join('\n'); [span_83](start_span)//[span_83](end_span)
                [span_84](start_span)const uploadsText = (statusResponse.data.uploads || []).map(u => //[span_84](end_span)
                    `Stage ${u.stage_number}: ${u.file_type} (${u.file_name})`).join('\n') || 'None'; [span_85](start_span)//[span_85](end_span)
                addMessage('BOT', `--- YOUR STATUS ---\nScore: ${statusResponse.data.current_status.score} (${statusResponse.data.current_status.risk_band})\n${stagesText}\nTotal Disbursed: $${statusResponse.data.current_status.total_disbursed.toFixed(2)}\nUploads:\n${uploadsText}\nContract: ${statusResponse.data.contract_state}`); [span_86](start_span)//[span_86](end_span)
                // FIXED: Simplified next steps prompt
                addMessage('BOT', `To proceed, type one of these commands: **STATUS**, **UPLOAD**, **TRIGGER**, or **IOT**.`); [span_87](start_span)//[span_87](end_span)
                setFlowState('READY'); [span_88](start_span)//[span_88](end_span)
                return; [span_89](start_span)//[span_89](end_span)
            [span_90](start_span)} catch (error) { //[span_90](end_span)
                attempts++; [span_91](start_span)//[span_91](end_span)
                [span_92](start_span)if (attempts === maxAttempts) { //[span_92](end_span)
                    addMessage('BOT', `Failed to fetch status. Check ID?`); [span_93](start_span)//[span_93](end_span)
                    setFlowState('GET_ID'); [span_94](start_span)//[span_94](end_span)
                [span_95](start_span)} //[span_95](end_span)
                await new Promise(resolve => setTimeout(resolve, 1000)); [span_96](start_span)//[span_96](end_span)
            [span_97](start_span)} //[span_97](end_span)
        [span_98](start_span)} //[span_98](end_span)
    }; [span_99](start_span)//[span_99](end_span)

    [span_100](start_span)const promptForUpload = async (id) => { //[span_100](end_span)
        try {
            const res = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`); [span_101](start_span)//[span_101](end_span)
            const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED'); [span_102](start_span)//[span_102](end_span)
            [span_103](start_span)if (!nextStage) { //[span_103](end_span)
                addMessage('BOT', "No unlocked stages for upload."); [span_104](start_span)//[span_104](end_span)
                setFlowState('READY'); [span_105](start_span)//[span_105](end_span)
                return; [span_106](start_span)//[span_106](end_span)
            [span_107](start_span)} //[span_107](end_span)
            [span_108](start_span)if (nextStage.stage_number === 1) { //[span_108](end_span)
                // FIXED: Clearer instructions for soil test upload
                addMessage("BOT", "Stage 1: Soil Test. Type the mock file name (e.g., soil_test.json) or enter mock JSON data."); [span_109](start_span)//[span_109](end_span)
                setFlowState('UPLOAD_SOIL_TEST'); [span_110](start_span)//[span_110](end_span)
                setShowMockFileInput(true); [span_111](start_span)//[span_111](end_span)
            [span_112](start_span)} else if ([3,4,6,7].includes(nextStage.stage_number)) { //[span_112](end_span)
                addMessage("BOT", `Stage ${nextStage.stage_number}: Photo Evidence. Type the mock file name (e.g., photo.jpg).`); [span_113](start_span)//[span_113](end_span)
                setFlowState('UPLOAD_PHOTO'); [span_114](start_span)//[span_114](end_span)
                setShowMockFileInput(true); [span_115](start_span)//[span_115](end_span)
            [span_116](start_span)} else { //[span_116](end_span)
                addMessage("BOT", `No upload required for Stage ${nextStage.stage_number}. Type 'TRIGGER'.`); [span_117](start_span)//[span_117](end_span)
                setFlowState('READY'); [span_118](start_span)//[span_118](end_span)
            [span_119](start_span)} //[span_119](end_span)
        [span_120](start_span)} catch (error) { //[span_120](end_span)
            addMessage('BOT', `Failed to check status: ${error.response?.data?.message || 'Server error'}`); [span_121](start_span)//[span_121](end_span)
            setFlowState('INTRO'); [span_122](start_span)//[span_122](end_span)
        [span_123](start_span)} //[span_123](end_span)
    }; [span_124](start_span)//[span_124](end_span)

    [span_125](start_span)const promptForIoT = (id) => { //[span_125](end_span)
        addMessage("BOT", "Enter mock IoT data (e.g., ph:7, moisture:25, etc.)."); [span_126](start_span)//[span_126](end_span)
        setFlowState('IOT_INPUT'); [span_127](start_span)//[span_127](end_span)
        setShowIoTInput(true); [span_128](start_span)//[span_128](end_span)
    }; [span_129](start_span)//[span_129](end_span)

    [span_130](start_span)const handleIoT = async (text) => { //[span_130](end_span)
        try {
            // Mock parse
            const data = { plot_id: 1, ph: 7, moisture: 25, temperature: 30, n: 10, p: 10, k: 10, salinity: 1, ec: 1 }; [span_131](start_span)//[span_131](end_span)
            const response = await axios.post(`${API_BASE_URL}/api/iot/ingest`, data); [span_132](start_span)//[span_132](end_span)
            addMessage('BOT', response.data.message); [span_133](start_span)//[span_133](end_span)
            if (farmerId) handleStatus(farmerId); [span_134](start_span)// Refresh for pest flag //[span_134](end_span)
            setShowIoTInput(false); [span_135](start_span)//[span_135](end_span)
            setFlowState('READY'); [span_136](start_span)//[span_136](end_span)
        [span_137](start_span)} catch (error) { //[span_137](end_span)
            addMessage('BOT', `IoT failed: ${error.response?.data?.message || 'Server error'}`); [span_138](start_span)//[span_138](end_span)
        [span_139](start_span)} //[span_139](end_span)
    }; [span_140](start_span)//[span_140](end_span)

    [span_141](start_span)const handleTrigger = async () => { //[span_141](end_span)
        [span_142](start_span)if (!farmerId) { //[span_142](end_span)
            addMessage('BOT', "No farmer ID. Type 'STATUS'."); [span_143](start_span)//[span_143](end_span)
            return; [span_144](start_span)//[span_144](end_span)
        [span_145](start_span)} //[span_145](end_span)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`, { trigger_type: 'manual' }); [span_146](start_span)//[span_146](end_span)
            addMessage('BOT', response.data.message); [span_147](start_span)//[span_147](end_span)
            handleStatus(farmerId); [span_148](start_span)//[span_148](end_span)
        [span_149](start_span)} catch (error) { //[span_149](end_span)
            addMessage('BOT', `Trigger failed: ${error.response?.data?.message || 'Server error'}`); [span_150](start_span)//[span_150](end_span)
        [span_151](start_span)} //[span_151](end_span)
    }; [span_152](start_span)//[span_152](end_span)

    [span_153](start_span)const handleUpload = async (stageNumber, fileType, fileName, soilData = {}) => { //[span_153](end_span)
        try {
            const payload = { stage_number: stageNumber, file_type: fileType, file_name: fileName, soil_data: soilData }; [span_154](start_span)//[span_154](end_span)
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, payload); [span_155](start_span)//[span_155](end_span)
            addMessage('BOT', response.data.message); [span_156](start_span)//[span_156](end_span)
            setShowMockFileInput(false); [span_157](start_span)//[span_157](end_span)
            setFlowState('READY'); [span_158](start_span)//[span_158](end_span)
            handleStatus(farmerId); [span_159](start_span)//[span_159](end_span)
        [span_160](start_span)} catch (error) { //[span_160](end_span)
            addMessage('BOT', `Upload failed: ${error.response?.data?.message || 'Server error'}`); [span_161](start_span)//[span_161](end_span)
        [span_162](start_span)} //[span_162](end_span)
    }; [span_163](start_span)//[span_163](end_span)

    [span_164](start_span)const handleInput = (e) => { //[span_164](end_span)
        e.preventDefault(); [span_165](start_span)//[span_165](end_span)
        const text = input.trim(); [span_166](start_span)//[span_166](end_span)
        if (!text) return; [span_167](start_span)//[span_167](end_span)
        addMessage('USER', text); [span_168](start_span)//[span_168](end_span)
        setInput(''); [span_169](start_span)//[span_169](end_span)

        // --- Original Chatbot Flow Logic (Preserved) ---
        [span_170](start_span)if (flowState === 'INTRO') { //[span_170](end_span)
            [span_171](start_span)if (text.toUpperCase() === 'REGISTER') { //[span_171](end_span)
                addMessage("BOT", "What is your full name?"); [span_172](start_span)//[span_172](end_span)
                setFlowState('REGISTER_NAME'); [span_173](start_span)//[span_173](end_span)
            [span_174](start_span)} else if (text.toUpperCase() === 'STATUS') { //[span_174](end_span)
                addMessage("BOT", "Enter your Farmer ID."); [span_175](start_span)//[span_175](end_span)
                setFlowState('GET_ID'); [span_176](start_span)//[span_176](end_span)
            [span_177](start_span)} else { //[span_177](end_span)
                addMessage("BOT", "Type 'REGISTER' or 'STATUS'."); [span_178](start_span)//[span_178](end_span)
            [span_179](start_span)} //[span_179](end_span)
        [span_180](start_span)} else if (flowState === 'GET_ID') { //[span_180](end_span)
            const id = parseInt(text); [span_181](start_span)//[span_181](end_span)
            [span_182](start_span)if (!isNaN(id) && id > 0) { //[span_182](end_span)
                setFarmerId(id); [span_183](start_span)//[span_183](end_span)
                handleStatus(id); [span_184](start_span)//[span_184](end_span)
            [span_185](start_span)} else { //[span_185](end_span)
                addMessage("BOT", "Invalid ID."); [span_186](start_span)//[span_186](end_span)
            [span_187](start_span)} //[span_187](end_span)
        [span_188](start_span)} else if (flowState === 'REGISTER_NAME') { //[span_188](end_span)
            setFarmerData(prev => ({ ...prev, name: text })); [span_189](start_span)//[span_189](end_span)
            addMessage("BOT", "Phone number? (e.g., +27 72 XXX XXXX)"); [span_190](start_span)//[span_190](end_span)
            setFlowState('REGISTER_PHONE'); [span_191](start_span)//[span_191](end_span)
        [span_192](start_span)} else if (flowState === 'REGISTER_PHONE') { //[span_192](end_span)
            setFarmerData(prev => ({ ...prev, phone: text })); [span_193](start_span)//[span_193](end_span)
            addMessage("BOT", "ID document number?"); [span_194](start_span)//[span_194](end_span)
            setFlowState('REGISTER_ID_DOCUMENT'); [span_195](start_span)//[span_195](end_span)
        [span_196](start_span)} else if (flowState === 'REGISTER_ID_DOCUMENT') { //[span_196](end_span)
            setFarmerData(prev => ({ ...prev, id_document: text })); [span_197](start_span)//[span_197](end_span)
            addMessage("BOT", "Gender? (Male/Female/Other)"); [span_198](start_span)//[span_198](end_span)
            setFlowState('REGISTER_GENDER'); [span_199](start_span)//[span_199](end_span)
        [span_200](start_span)} else if (flowState === 'REGISTER_GENDER') { //[span_200](end_span)
            setFarmerData(prev => ({ ...prev, gender: text })); [span_201](start_span)//[span_201](end_span)
            addMessage("BOT", "Age?"); [span_202](start_span)//[span_202](end_span)
            setFlowState('REGISTER_AGE'); [span_203](start_span)//[span_203](end_span)
        [span_204](start_span)} else if (flowState === 'REGISTER_AGE') { //[span_204](end_span)
            setFarmerData(prev => ({ ...prev, age: text })); [span_205](start_span)//[span_205](end_span)
            addMessage("BOT", "Crop this season? (e.g., Maize)"); [span_206](start_span)//[span_206](end_span)
            setFlowState('REGISTER_CROP'); [span_207](start_span)//[span_207](end_span)
        [span_208](start_span)} else if (flowState === 'REGISTER_CROP') { //[span_208](end_span)
            setFarmerData(prev => ({ ...prev, crop: text })); [span_209](start_span)//[span_209](end_span)
            addMessage("BOT", "Land size in acres? (e.g., 5.0)"); [span_210](start_span)//[span_210](end_span)
            setFlowState('REGISTER_LAND_SIZE'); [span_211](start_span)//[span_211](end_span)
        [span_212](start_span)} else if (flowState === 'REGISTER_LAND_SIZE') { //[span_212](end_span)
            const landSize = parseFloat(text); [span_213](start_span)//[span_213](end_span)
            [span_214](start_span)if (isNaN(landSize) || landSize < 0) { //[span_214](end_span)
                addMessage("BOT", "Invalid land size."); [span_215](start_span)//[span_215](end_span)
            [span_216](start_span)} else { //[span_216](end_span)
                const finalData = { ...farmerData, land_size: landSize, geo_tag: '0.0,0.0' }; [span_217](start_span)//[span_217](end_span)
                handleRegistration(finalData); [span_218](start_span)//[span_218](end_span)
            [span_219](start_span)} //[span_219](end_span)
        [span_220](start_span)} else if (flowState === 'UPLOAD_SOIL_TEST') { //[span_220](end_span)
            let soilData = {}; [span_221](start_span)//[span_221](end_span)
            [span_222](start_span)try { //[span_222](end_span)
                soilData = JSON.parse(text); [span_223](start_span)//[span_223](end_span)
            [span_224](start_span)} catch { //[span_224](end_span)
                // Treat as file name
            [span_225](start_span)} //[span_225](end_span)
            handleUpload(1, 'soil_test', text.endsWith('.json') ? text : 'soil_test.json', soilData); [span_226](start_span)//[span_226](end_span)
        [span_227](start_span)} else if (flowState === 'UPLOAD_PHOTO') { //[span_227](end_span)
            [span_228](start_span)axios.get(`${API_BASE_URL}/api/farmer/${farmerId}/status`).then(res => { //[span_228](end_span)
                const nextStage = res.data.stages.find(s => s.status === 'UNLOCKED'); [span_229](start_span)//[span_229](end_span)
                handleUpload(nextStage.stage_number, 'photo_evidence', text); [span_230](start_span)//[span_230](end_span)
            [span_231](start_span)}).catch(error => { //[span_231](end_span)
                addMessage('BOT', `Failed: ${error.response?.data?.message || 'Server error'}`); [span_232](start_span)//[span_232](end_span)
            }); [span_233](start_span)//[span_233](end_span)
        [span_234](start_span)} else if (flowState === 'IOT_INPUT') { //[span_234](end_span)
            handleIoT(text); [span_235](start_span)//[span_235](end_span)
        [span_236](start_span)} else if (flowState === 'READY') { //[span_236](end_span)
            const upperText = text.toUpperCase(); [span_237](start_span)//[span_237](end_span)
            [span_238](start_span)if (upperText === 'TRIGGER') { //[span_238](end_span)
                handleTrigger(); [span_239](start_span)//[span_239](end_span)
            [span_240](start_span)} else if (upperText === 'STATUS') { //[span_240](end_span)
                handleStatus(farmerId); [span_241](start_span)//[span_241](end_span)
            [span_242](start_span)} else if (upperText === 'UPLOAD') { //[span_242](end_span)
                promptForUpload(farmerId); [span_243](start_span)//[span_243](end_span)
            [span_244](start_span)} else if (upperText === 'IOT') { //[span_244](end_span)
                promptForIoT(farmerId); [span_245](start_span)//[span_245](end_span)
            [span_246](start_span)} else { //[span_246](end_span)
                // FIXED: Simplified response to unrecognized command
                addMessage("BOT", "❓ Unrecognized command. Type **STATUS**, **UPLOAD**, **TRIGGER**, or **IOT**."); [span_247](start_span)//[span_247](end_span)
            [span_248](start_span)} //[span_248](end_span)
        [span_249](start_span)} //[span_249](end_span)
    }; [span_250](start_span)//[span_250](end_span)

    [span_251](start_span)return ( //[span_251](end_span)
        <div className="chatbot-container">
            <div className="chat-header">
                [span_252](start_span)<button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button> {/*[span_252](end_span) */}
                [span_253](start_span)<h2>WhatsApp Chatbot Mock</h2> {/*[span_253](end_span) */}
            </div>
            [span_254](start_span)<div className="chat-window" ref={chatWindowRef}> {/*[span_254](end_span) */}
           
                [span_255](start_span){chatHistory.map((msg, index) => ( //[span_255](end_span)
                    [span_256](start_span)<div key={index} className={`message-row ${msg.sender.toLowerCase()}`}> {/*[span_256](end_span) */}
                        <div className="message-bubble">
                            {msg.sender === 'BOT' ? '🤖' : '🧑‍🌾'} {msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')} {/* Highlight commands */}
                            [span_257](start_span)<span className="timestamp">{msg.time.toLocaleTimeString()}</span> {/*[span_257](end_span) */}
                        </div>
                    </div>
                ))}
            </div>
        
            [span_258](start_span){showMockFileInput && ( //[span_258](end_span)
                [span_259](start_span)<div className="mock-file-input"> {/*[span_259](end_span) */}
                    [span_260](start_span)<label htmlFor="mock-file">Select File (Mock)</label> {/*[span_260](end_span) */}
                    [span_261](start_span)<input type="file" id="mock-file" disabled /> {/*[span_261](end_span) */}
                    [span_262](start_span)<span>Type file name or JSON in chat.</span> {/*[span_262](end_span) */}
                [span_263](start_span)</div> //[span_263](end_span)
            )}
            [span_264](start_span){showIoTInput && ( //[span_264](end_span)
                [span_265](start_span)<div className="mock-file-input"> {/*[span_265](end_span) */}
                    [span_266](start_span)<span>Enter IoT data in chat.</span> {/*[span_266](end_span) */}
                [span_267](start_span)</div> //[span_267](end_span)
            )}
            [span_268](start_span)<form className="chat-input-form" onSubmit={handleInput}> {/*[span_268](end_span) */}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    [span_269](start_span)placeholder="Type your message..." //[span_269](end_span)
                />
                [span_270](start_span)<button type="submit">Send</button> {/*[span_270](end_span) */}
            </form>
            <p className="disclaimer">For Demonstration Only. [span_271](start_span){/*[span_271](end_span) */}
                Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a>
            [span_272](start_span)</p> {/*[span_272](end_span) */}
        </div>
    ); [span_273](start_span)//[span_273](end_span)
};


// --- Dashboard Components (MODIFIED) ---

[span_274](start_span)const LenderDashboard = ({ setView }) => { //[span_274](end_span)
    const [farmers, setFarmers] = useState([]); [span_275](start_span)//[span_275](end_span)
    const [selectedFarmer, setSelectedFarmer] = useState(null); [span_276](start_span)//[span_276](end_span)
    const [showXAI, setShowXAI] = useState(false); [span_277](start_span)//[span_277](end_span)
    const [showContract, setShowContract] = useState(false); [span_278](start_span)//[span_278](end_span)
    const [error, setError] = useState(null); [span_279](start_span)//[span_279](end_span)

    [span_280](start_span)const fetchFarmers = async () => { //[span_280](end_span)
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`); [span_281](start_span)//[span_281](end_span)
            setFarmers(response.data); [span_282](start_span)//[span_282](end_span)
            setError(null); [span_283](start_span)//[span_283](end_span)
        [span_284](start_span)} catch (error) { //[span_284](end_span)
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`); [span_285](start_span)//[span_285](end_span)
        [span_286](start_span)} //[span_286](end_span)
    }; [span_287](start_span)//[span_287](end_span)

    [span_288](start_span)const fetchFarmerDetails = async (id) => { //[span_288](end_span)
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`); [span_289](start_span)//[span_289](end_span)
            setSelectedFarmer(response.data); [span_290](start_span)//[span_290](end_span)
            setError(null); [span_291](start_span)//[span_291](end_span)
        [span_292](start_span)} catch (error) { //[span_292](end_span)
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`); [span_293](start_span)//[span_293](end_span)
        [span_294](start_span)} //[span_294](end_span)
    }; [span_295](start_span)//[span_295](end_span)

    // MODIFIED: Return an error instead of using alert, so StageTracker can display it
    [span_296](start_span)const handleDisburse = async (farmerId, stageNumber) => { //[span_296](end_span)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/lender/disburse/${farmerId}/${stageNumber}`); [span_297](start_span)//[span_297](end_span)
            // alert(`SUCCESS: ${response.data.message}`); // Removed alert
            fetchFarmerDetails(farmerId); [span_298](start_span)//[span_298](end_span)
            fetchFarmers(); [span_299](start_span)//[span_299](end_span)
        [span_300](start_span)} catch (error) { //[span_300](end_span)
            // alert(`Disbursement Failed: ${error.response?.data?.message || 'Server error'}`); // Removed alert
            throw new Error(error.response?.data?.message || 'Server error'); // Throw error for StageTracker to catch
        [span_301](start_span)} //[span_301](end_span)
    }; [span_302](start_span)//[span_302](end_span)

    [span_303](start_span)useEffect(() => { //[span_303](end_span)
        fetchFarmers(); [span_304](start_span)//[span_304](end_span)
        const interval = setInterval(fetchFarmers, 10000); [span_305](start_span)//[span_305](end_span)
        return () => clearInterval(interval); [span_306](start_span)//[span_306](end_span)
    }, []); [span_307](start_span)//[span_307](end_span)

    [span_308](start_span)if (selectedFarmer) { //[span_308](end_span)
        [span_309](start_span)return ( //[span_309](end_span)
            [span_310](start_span)<div className="dashboard-detail"> {/*[span_310](end_span) */}
                [span_311](start_span)<button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button> {/*[span_311](end_span) */}
                <StageTracker
                    [span_312](start_span)farmerId={selectedFarmer.farmer_id} //[span_312](end_span)
                    [span_313](start_span)stages={selectedFarmer.stages} //[span_313](end_span)
                    [span_314](start_span)uploads={selectedFarmer.uploads} //[span_314](end_span)
                    [span_315](start_span)name={selectedFarmer.name} //[span_315](end_span)
                    [span_316](start_span)phone={selectedFarmer.phone} //[span_316](end_span)
                    [span_317](start_span)totalDisbursed={selectedFarmer.current_status.total_disbursed} //[span_317](end_span)
                    [span_318](start_span)score={selectedFarmer.current_status.score} //[span_318](end_span)
                    riskBand={selectedFarmer.current_status.risk_band || [span_319](start_span)'N/A'} //[span_319](end_span)
                    xaiFactors={selectedFarmer.current_status.xai_factors || [span_320](start_span)[]} //[span_320](end_span)
                    [span_321](start_span)contractState={selectedFarmer.contract_state} //[span_321](end_span)
                    contractHash={selectedFarmer.contract_hash || [span_322](start_span)'N/A'} //[span_322](end_span)
                    [span_323](start_span)onDisburse={handleDisburse} //[span_323](end_span)
                    [span_324](start_span)onViewXAI={() => setShowXAI(true)} //[span_324](end_span)
                    [span_325](start_span)onViewContract={() => setShowContract(true)} //[span_325](end_span)
                    onReportDownload={() => {}} // Placeholder to satisfy prop requirement
                />
                {showXAI && <XAIView xaiFactors={selectedFarmer.current_status.xai_factors || [span_326](start_span)[]} onClose={() => setShowXAI(false)} />} {/*[span_326](end_span) */}
                {showContract && <ContractView contractState={selectedFarmer.contract_state} contractHash={selectedFarmer.contract_hash || [span_327](start_span)'N/A'} onClose={() => setShowContract(false)} />} {/*[span_327](end_span) */}
            </div>
        ); [span_328](start_span)//[span_328](end_span)
    [span_329](start_span)} //[span_329](end_span)

    [span_330](start_span)return ( //[span_330](end_span)
        [span_331](start_span)<div className="dashboard-list-container"> {/*[span_331](end_span) */}
            [span_332](start_span)<button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button> {/*[span_332](end_span) */}
            [span_333](start_span)<h1>Lender/Admin Dashboard</h1> {/*[span_333](end_span) */}
            <p>Monitor progress and disburse funds. [span_334](start_span)<button onClick={fetchFarmers}>Refresh</button></p> {/*[span_334](end_span) */}
            [span_335](start_span){error && <p className="error">{error}</p>} {/*[span_335](end_span) */}
            [span_336](start_span)<div className="farmer-list"> {/*[span_336](end_span) */}
                {farmers.length === 0 ? [span_337](start_span)( //[span_337](end_span)
                    [span_338](start_span)<p>No farmers registered.</p> //[span_338](end_span)
                [span_339](start_span)) : ( //[span_339](end_span)
                    [span_340](start_span)farmers.map(farmer => ( //[span_340](end_span)
                        [span_341](start_span)<div key={farmer.id} className="farmer-card"> {/*[span_341](end_span) */}
                            [span_342](start_span)<h3>{farmer.name}</h3> {/*[span_342](end_span) */}
                            <p>ID: {farmer.id} | Progress: {farmer.stages_completed} | [span_343](start_span)Score: {farmer.score}</p> {/*[span_343](end_span) */}
                            [span_344](start_span)<button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button> {/*[span_344](end_span) */}
                        </div>
                    [span_345](start_span))) //[span_345](end_span)
                )}
            </div>
        </div>
    ); [span_346](start_span)//[span_346](end_span)
}; [span_347](start_span)//[span_347](end_span)

[span_348](start_span)const FieldOfficerDashboard = ({ setView }) => { //[span_348](end_span)
    const [farmers, setFarmers] = useState([]); [span_349](start_span)//[span_349](end_span)
    const [selectedFarmer, setSelectedFarmer] = useState(null); [span_350](start_span)//[span_350](end_span)
    const [showXAI, setShowXAI] = useState(false); [span_351](start_span)//[span_351](end_span)
    const [showContract, setShowContract] = useState(false); [span_352](start_span)//[span_352](end_span)
    const [error, setError] = useState(null); [span_353](start_span)//[span_353](end_span)

    [span_354](start_span)const fetchFarmers = async () => { //[span_354](end_span)
        try {
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`); [span_355](start_span)//[span_355](end_span)
            setFarmers(response.data); [span_356](start_span)//[span_356](end_span)
            setError(null); [span_357](start_span)//[span_357](end_span)
        [span_358](start_span)} catch (error) { //[span_358](end_span)
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`); [span_359](start_span)//[span_359](end_span)
        [span_360](start_span)} //[span_360](end_span)
    }; [span_361](start_span)//[span_361](end_span)

    [span_362](start_span)const fetchFarmerDetails = async (id) => { //[span_362](end_span)
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`); [span_363](start_span)//[span_363](end_span)
            setSelectedFarmer(response.data); [span_364](start_span)//[span_364](end_span)
            setError(null); [span_365](start_span)//[span_365](end_span)
        [span_366](start_span)} catch (error) { //[span_366](end_span)
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`); [span_367](start_span)//[span_367](end_span)
        [span_368](start_span)} //[span_368](end_span)
    }; [span_369](start_span)//[span_369](end_span)

    // MODIFIED: Return an error instead of using alert, so StageTracker can display it
    [span_370](start_span)const handleApproval = async (farmerId, stageNumber) => { //[span_370](end_span)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/approve/${farmerId}/${stageNumber}`); [span_371](start_span)//[span_371](end_span)
            // alert(`SUCCESS: ${response.data.message}`); // Removed alert
            fetchFarmerDetails(farmerId); [span_372](start_span)//[span_372](end_span)
            fetchFarmers(); [span_373](start_span)//[span_373](end_span)
        [span_374](start_span)} catch (error) { //[span_374](end_span)
            // alert(`Approval Failed: ${error.response?.data?.message || 'Server error'}`); // Removed alert
            throw new Error(error.response?.data?.message || 'Server error'); // Throw error for StageTracker to catch
        [span_375](start_span)} //[span_375](end_span)
    }; [span_376](start_span)//[span_376](end_span)

    // NEW: Function to trigger the pest flag mock event
    const handlePestTrigger = async (farmerId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${farmerId}`);
            // Force a refresh to update the component's state
            fetchFarmerDetails(farmerId);
            return response.data.message;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Server error');
        }
    };

    [span_377](start_span)useEffect(() => { //[span_377](end_span)
        fetchFarmers(); [span_378](start_span)//[span_378](end_span)
        const interval = setInterval(fetchFarmers, 10000); [span_379](start_span)//[span_379](end_span)
        return () => clearInterval(interval); [span_380](start_span)//[span_380](end_span)
    }, []); [span_381](start_span)//[span_381](end_span)

    [span_382](start_span)if (selectedFarmer) { //[span_382](end_span)
        [span_383](start_span)return ( //[span_383](end_span)
            [span_384](start_span)<div className="dashboard-detail"> {/*[span_384](end_span) */}
                [span_385](start_span)<button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button> {/*[span_385](end_span) */}
                <StageTracker
                    [span_386](start_span)farmerId={selectedFarmer.farmer_id} //[span_386](end_span)
                    [span_387](start_span)stages={selectedFarmer.stages} //[span_387](end_span)
                    [span_388](start_span)uploads={selectedFarmer.uploads} //[span_388](end_span)
                    [span_389](start_span)name={selectedFarmer.name} //[span_389](end_span)
                    [span_390](start_span)phone={selectedFarmer.phone} //[span_390](end_span)
                    [span_391](start_span)totalDisbursed={selectedFarmer.current_status.total_disbursed} //[span_391](end_span)
                    [span_392](start_span)score={selectedFarmer.current_status.score} //[span_392](end_span)
                    riskBand={selectedFarmer.current_status.risk_band || [span_393](start_span)'N/A'} //[span_393](end_span)
                    xaiFactors={selectedFarmer.current_status.xai_factors || [span_394](start_span)[]} //[span_394](end_span)
                    [span_395](start_span)contractState={selectedFarmer.contract_state} //[span_395](end_span)
                    contractHash={selectedFarmer.contract_hash || [span_396](start_span)'N/A'} //[span_396](end_span)
                    [span_397](start_span)onApproval={handleApproval} //[span_397](end_span)
                    [span_398](start_span)onViewXAI={() => setShowXAI(true)} //[span_398](end_span)
                    [span_399](start_span)onViewContract={() => setShowContract(true)} //[span_399](end_span)
                    onReportDownload={() => {}} // Placeholder to satisfy prop requirement
                    onPestTrigger={handlePestTrigger} // Pass the new trigger function
                />
                {showXAI && <XAIView xaiFactors={selectedFarmer.current_status.xai_factors || [span_400](start_span)[]} onClose={() => setShowXAI(false)} />} {/*[span_400](end_span) */}
                {showContract && <ContractView contractState={selectedFarmer.contract_state} contractHash={selectedFarmer.contract_hash || [span_401](start_span)'N/A'} onClose={() => setShowContract(false)} />} {/*[span_401](end_span) */}
            </div>
        ); [span_402](start_span)//[span_402](end_span)
    [span_403](start_span)} //[span_403](end_span)

    [span_404](start_span)return ( //[span_404](end_span)
        [span_405](start_span)<div className="dashboard-list-container"> {/*[span_405](end_span) */}
            [span_406](start_span)<button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button> {/*[span_406](end_span) */}
            [span_407](start_span)<h1>Field Officer Dashboard</h1> {/*[span_407](end_span) */}
            <p>Review and approve milestones. [span_408](start_span)<button onClick={fetchFarmers}>Refresh</button></p> {/*[span_408](end_span) */}
            [span_409](start_span){error && <p className="error">{error}</p>} {/*[span_409](end_span) */}
            [span_410](start_span)<div className="farmer-list"> {/*[span_410](end_span) */}
                {farmers.length === 0 ? [span_411](start_span)( //[span_411](end_span)
                    [span_412](start_span)<p>No farmers registered.</p> //[span_412](end_span)
                [span_413](start_span)) : ( //[span_413](end_span)
                    [span_414](start_span)farmers.map(farmer => ( //[span_414](end_span)
                        [span_415](start_span)<div key={farmer.id} className="farmer-card"> {/*[span_415](end_span) */}
                            [span_416](start_span)<h3>{farmer.name}</h3> {/*[span_416](end_span) */}
                            <p>ID: {farmer.id} | Progress: {farmer.stages_completed} | [span_417](start_span)Score: {farmer.score}</p> {/*[span_417](end_span) */}
                            [span_418](start_span)<button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button> {/*[span_418](end_span) */}
                        </div>
                    [span_419](start_span))) //[span_419](end_span)
                )}
            </div>
        </div>
    ); [span_420](start_span)//[span_420](end_span)
}; [span_421](start_span)//[span_421](end_span)

// --- Insurer Dashboard (UPDATED) ---

[span_422](start_span)const InsurerDashboard = ({ setView }) => { //[span_422](end_span)
    const [farmers, setFarmers] = useState([]); [span_423](start_span)//[span_423](end_span)
    const [selectedFarmer, setSelectedFarmer] = useState(null); [span_424](start_span)//[span_424](end_span)
    const [error, setError] = useState(null); [span_425](start_span)//[span_425](end_span)

    [span_426](start_span)const fetchFarmers = async () => { //[span_426](end_span)
        try {
            // Use the general admin endpoint to get the list
            const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`); [span_427](start_span)//[span_427](end_span)
            setFarmers(response.data); [span_428](start_span)//[span_428](end_span)
            setError(null); [span_429](start_span)//[span_429](end_span)
        [span_430](start_span)} catch (error) { //[span_430](end_span)
            setError(`Failed to fetch farmers: ${error.response?.data?.message || 'Server error'}`); [span_431](start_span)//[span_431](end_span)
        [span_432](start_span)} //[span_432](end_span)
    }; [span_433](start_span)//[span_433](end_span)

    [span_434](start_span)const fetchFarmerDetails = async (id) => { //[span_434](end_span)
        try {
            // Get detailed status, which includes policy_id/contract_state
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`); [span_435](start_span)//[span_435](end_span)
            setSelectedFarmer(response.data); [span_436](start_span)//[span_436](end_span)
            setError(null); [span_437](start_span)//[span_437](end_span)
        [span_438](start_span)} catch (error) { //[span_438](end_span)
            setError(`Failed to fetch farmer details: ${error.response?.data?.message || 'Server error'}`); [span_439](start_span)//[span_439](end_span)
        [span_440](start_span)} //[span_440](end_span)
    }; [span_441](start_span)//[span_441](end_span)

    [span_442](start_span)const handleBindPolicy = async (farmerId) => { //[span_442](end_span)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/bind/${farmerId}`); [span_443](start_span)//[span_443](end_span)
            alert(`SUCCESS: ${response.data.message}`); [span_444](start_span)//[span_444](end_span)
            fetchFarmerDetails(farmerId); [span_445](start_span)//[span_445](end_span)
        [span_446](start_span)} catch (error) { //[span_446](end_span)
            alert(`Bind Failed: ${error.response?.data?.message || 'Server error'}`); [span_447](start_span)//[span_447](end_span)
        [span_448](start_span)} //[span_448](end_span)
    }; [span_449](start_span)//[span_449](end_span)

    [span_450](start_span)const handleCheckTrigger = async (farmerId) => { //[span_450](end_span)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/insurer/trigger/${farmerId}`, { rainfall: 5 }); [span_451](start_span)//[span_451](end_span)
            alert(`SUCCESS: ${response.data.message}`); [span_452](start_span)//[span_452](end_span)
            fetchFarmerDetails(farmerId); [span_453](start_span)//[span_453](end_span)
        [span_454](start_span)} catch (error) { //[span_454](end_span)
            alert(`Trigger Check Failed: ${error.response?.data?.message || 'Server error'}`); [span_455](start_span)//[span_455](end_span)
        [span_456](start_span)} //[span_456](end_span)
    }; [span_457](start_span)//[span_457](end_span)

    [span_458](start_span)useEffect(() => { //[span_458](end_span)
        fetchFarmers(); [span_459](start_span)//[span_459](end_span)
        const interval = setInterval(fetchFarmers, 10000); [span_460](start_span)//[span_460](end_span)
        return () => clearInterval(interval); [span_461](start_span)//[span_461](end_span)
    }, []); [span_462](start_span)//[span_462](end_span)

    [span_463](start_span)if (selectedFarmer) { //[span_463](end_span)
        // MOCK DATA ENHANCEMENT for the display
        const policyStatus = selectedFarmer.contract_state.includes('COMPLETED') ? 'ACTIVE' : (selectedFarmer.policy_id ? 'BOUND' : 'PENDING');
        const pestFlag = selectedFarmer.current_status.pest_flag ? '⚠️ PEST EVENT' : '✅ NORMAL';
        const droughtMock = selectedFarmer.current_status.score < 50 ? '⚠️ DROUGHT THREAT' : '✅ NORMAL';

        [span_464](start_span)return ( //[span_464](end_span)
            [span_465](start_span)<div className="dashboard-detail"> {/*[span_465](end_span) */}
                [span_466](start_span)<button onClick={() => setSelectedFarmer(null)} className="btn-back">← Back to List</button> {/*[span_466](end_span) */}
                [span_467](start_span)<h2>{selectedFarmer.name}'s Insurance Status</h2> {/*[span_467](end_span) */}
                <p><strong>Farmer ID:</strong> {selectedFarmer.farmer_id} | <strong>Policy ID:</strong> {selectedFarmer.policy_id || 'Not Bound'}</p>
                
                <div className="policy-info">
                    <p><strong>Policy Status:</strong> <span className={`status-${policyStatus.toLowerCase()}`}>{policyStatus}</span></p>
                    <p><strong>Contract State:</strong> {selectedFarmer.contract_state}</p>
                    [span_468](start_span)<p><strong>Mock Trigger Conditions:</strong> Rainfall <10mm, Pest Event Flag</p> {/*[span_468](end_span) */}
                    
                    <h4 style={{marginTop: '15px'}}>Current Event Status</h4>
                    <p><strong>Pest Flag Status (System):</strong> <span className={`status-${selectedFarmer.current_status.pest_flag ? 'triggered' : 'ok'}`}>{pestFlag}</span></p>
                    <p><strong>Drought Status (Mock IoT):</strong> <span className={`status-${droughtMock.includes('THREAT') ? 'triggered' : 'ok'}`}>{droughtMock}</span></p>
                </div>

                <div className="policy-actions" style={{marginTop: '20px'}}>
                    [span_469](start_span)<button onClick={() => handleBindPolicy(selectedFarmer.farmer_id)}>Bind Policy</button> {/*[span_469](end_span) */}
                    [span_470](start_span)<button onClick={() => handleCheckTrigger(selectedFarmer.farmer_id)}>Check Trigger (Mock Rainfall)</button> {/*[span_470](end_span) */}
                </div>
            </div>
        ); [span_471](start_span)//[span_471](end_span)
    [span_472](start_span)} //[span_472](end_span)

    [span_473](start_span)return ( //[span_473](end_span)
        [span_474](start_span)<div className="dashboard-list-container"> {/*[span_474](end_span) */}
            [span_475](start_span)<button onClick={() => setView('welcome')} className="btn-back">← Role Selection</button> {/*[span_475](end_span) */}
            [span_476](start_span)<h1>Insurer Dashboard</h1> {/*[span_476](end_span) */}
            <p>Bind policies and check triggers. [span_477](start_span)<button onClick={fetchFarmers}>Refresh</button></p> {/*[span_477](end_span) */}
            [span_478](start_span){error && <p className="error">{error}</p>} {/*[span_478](end_span) */}
            [span_479](start_span)<div className="farmer-list"> {/*[span_479](end_span) */}
                {farmers.length === 0 ? [span_480](start_span)( //[span_480](end_span)
                    [span_481](start_span)<p>No farmers registered.</p> //[span_481](end_span)
                [span_482](start_span)) : ( //[span_482](end_span)
                    [span_483](start_span)farmers.map(farmer => ( //[span_483](end_span)
                        [span_484](start_span)<div key={farmer.id} className="farmer-card"> {/*[span_484](end_span) */}
                            [span_485](start_span)<h3>{farmer.name}</h3> {/*[span_485](end_span) */}
                            <p>ID: {farmer.id} | [span_486](start_span)Score: {farmer.score}</p> {/*[span_486](end_span) */}
                            [span_487](start_span)<button onClick={() => fetchFarmerDetails(farmer.id)}>View Details</button> {/*[span_487](end_span) */}
                        </div>
                    [span_488](start_span))) //[span_488](end_span)
                )}
            </div>
        </div>
    ); [span_489](start_span)//[span_489](end_span)
}; [span_490](start_span)//[span_490](end_span)


// --- App Component (Preserved) ---

[span_491](start_span)const WelcomeScreen = ({ setView }) => ( //[span_491](end_span)
    [span_492](start_span)<div className="welcome-container"> {/*[span_492](end_span) */}
        {/* LOGO ELEMENT */}
        <img
            [span_493](start_span)src={LOGO_SRC} //[span_493](end_span)
            alt="eSusFarm Africa Logo"
            className="esusfarm-logo"
        />
        [span_494](start_span)<h2>GENFIN 🌱 AFRICA</h2> {/*[span_494](end_span) */}
        [span_495](start_span)<p><b>G20 TechSprint 2025 Demo</b></p> {/*[span_495](end_span) */}
  
        [span_496](start_span)<p>Select a user role to begin the stage-based financing flow demonstration.</p> {/*[span_496](end_span) */}
        [span_497](start_span)<div className="role-buttons"> {/*[span_497](end_span) */}
            [span_498](start_span)<button className="btn-farmer" onClick={() => setView('farmer')}> {/*[span_498](end_span) */}
                [span_499](start_span)Farmer Chatbot Mock {/*[span_499](end_span) */}
            </button>
            [span_500](start_span)<button className="btn-lender" onClick={() => setView('lender')}> {/*[span_500](end_span) */}
             
                [span_501](start_span)Lender/Admin Dashboard {/*[span_501](end_span) */}
            </button>
            [span_502](start_span)<button className="btn-field-officer" onClick={() => setView('fieldOfficer')}> {/*[span_502](end_span) */}
                [span_503](start_span)Field Officer Dashboard {/*[span_503](end_span) */}
            </button>
            [span_504](start_span)<button className="btn-insurer" onClick={() => setView('insurer')}> {/*[span_504](end_span) */}
                [span_505](start_span)Insurer Dashboard {/*[span_505](end_span) */}
     
            [span_506](start_span)</button> {/*[span_506](end_span) */}
        [span_507](start_span)</div> {/*[span_507](end_span) */}
        <p className="disclaimer">For Demonstration Only. [span_508](start_span){/*[span_508](end_span) */}
            [span_509](start_span)Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a> {/*[span_509](end_span) */}
        </p>
    </div>
);


[span_510](start_span)const App = () => { //[span_510](end_span)
    const [view, setView] = useState('welcome'); [span_511](start_span)//[span_511](end_span)
    [span_512](start_span)return ( //[span_512](end_span)
        [span_513](start_span)<div className="App"> {/*[span_513](end_span) */}
            [span_514](start_span){view === 'welcome' && <WelcomeScreen setView={setView} />} {/*[span_514](end_span) */}
            [span_515](start_span){view === 'farmer' && <FarmerChatbotMock setView={setView} />} {/*[span_515](end_span) */}
            [span_516](start_span){view === 'lender' && <LenderDashboard setView={setView} />} {/*[span_516](end_span) */}
            [span_517](start_span){view === 'fieldOfficer' && <FieldOfficerDashboard setView={setView} />} {/*[span_517](end_span) */}
            [span_518](start_span){view === 'insurer' && <InsurerDashboard setView={setView} />} {/*[span_518](end_span) */}
        </div>
    );
};

export default App;
