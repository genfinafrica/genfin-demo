// src/App.js (Correctly Merged)
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
        [span_2](start_span)return null;[span_2](end_span)
    }
    return (
        <div className="modal" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="btn-back" onClick={onClose} style={{ float: 'right' }}>Close</button>
                <h3>{title}</h3>
                {children}
            </div>
        </div>
    [span_3](start_span));[span_3](end_span)
};

// --- DASHBOARD COMPONENTS ---

// FarmerDetailsCard restored to its well-formatted version
const FarmerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages, contractHistory }) => {
    [span_4](start_span)const [showXaiModal, setShowXaiModal] = useState(false);[span_4](end_span)
    [span_5](start_span)const [showContractModal, setShowContractModal] = useState(false);[span_5](end_span)

    // Reverse stage order for display (latest first)
    [span_6](start_span)const reversedStages = [...stages].reverse();[span_6](end_span)

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
    [span_7](start_span));[span_7](end_span)
};

// --------- Upgraded FarmerChatbotMock with insurance logic ---------
const FarmerChatbotMock = ({ setView }) => {
    [span_8](start_span)const [messages, setMessages] = useState([]);[span_8](end_span)
    [span_9](start_span)const [input, setInput] = useState('');[span_9](end_span)
    [span_10](start_span)const [farmerId, setFarmerId] = useState(null);[span_10](end_span)
    [span_11](start_span)const [farmerStatus, setFarmerStatus] = useState(null);[span_11](end_span)
    [span_12](start_span)const [showUploadInput, setShowUploadInput] = useState(false);[span_12](end_span)
    [span_13](start_span)const [showIoTInput, setShowIoTInput] = useState(false);[span_13](end_span)
    [span_14](start_span)const [chatState, setChatState] = useState('AWAITING_COMMAND');[span_14](end_span)
    [span_15](start_span)const [registrationData, setRegistrationData] = useState({});[span_15](end_span)
    [span_16](start_span)const messagesEndRef = useRef(null);[span_16](end_span)

    const stageFileHints = {
        1: 'Soil test (CSV / PDF / JPG)',
        2: 'Input supplier invoice (PDF / JPG)',
        3: 'Insurance: soil sensor CSV or premium receipt',
        4: 'Weeding photo (JPG / PNG)',
        5: 'Pest photo (JPG) or type NO PEST',
        6: 'Packaging photo (JPG / PNG)',
        7: 'Transport/Delivery note (PDF / JPG)',
    [span_17](start_span)};[span_17](end_span)

    const formatBotMessage = (text) => {
        [span_18](start_span)const regex = /(STATUS|REGISTER|HELP|RESET|NEXT STAGE|NEXT|UPLOAD|IOT|CANCEL|TRIGGER PEST|TRIGGER INSURANCE|INGEST IOT|Full Name|Phone Number|Age|Gender|ID Document|Next of Kin|Crop|Land Size)/gi;[span_18](end_span)
        [span_19](start_span)return text.replace(regex, (match) => `<strong>${match}</strong>`);[span_19](end_span)
    };

    const scrollToBottom = () => {
        [span_20](start_span)messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });[span_20](end_span)
    };
    [span_21](start_span)useEffect(scrollToBottom, [messages]);[span_21](end_span)

    const pushBotMessage = (text) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text: text,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString(),
        }]);
    [span_22](start_span)};[span_22](end_span)
    const pushUserMessage = (text) => {
        setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: text,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString(),
        }]);
    [span_23](start_span)};[span_23](end_span)

    // STATUS check enhanced with Insurance details
    const fetchStatus = async (id = farmerId) => {
        if (!id) {
            pushBotMessage("Error: No Farmer ID available. Type **REGISTER** to create an account or provide your ID.");
            return;
        }
        try {
            [span_24](start_span)const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);[span_24](end_span)
            [span_25](start_span)const data = response.data;[span_25](end_span)
            [span_26](start_span)setFarmerStatus(data);[span_26](end_span)

            const stages = data.stages || [span_27](start_span)[];[span_27](end_span)
            const uploads = data.uploads || [span_28](start_span)[];[span_28](end_span)

            [span_29](start_span)let currentIdx = stages.findIndex(s => s.status !== 'COMPLETED');[span_29](end_span)
            [span_30](start_span)if (currentIdx === -1) currentIdx = stages.length - 1;[span_30](end_span)
            [span_31](start_span)const currentStage = stages[currentIdx] || null;[span_31](end_span)

            [span_32](start_span)const uploadedFiles = uploads.map(u => `Stage ${u.stage_number}: ${u.file_name}${u.file_type ? '.' + u.file_type : ''}`);[span_32](end_span)

            [span_33](start_span)let nextHint = 'Type **STATUS** to refresh.';[span_33](end_span)
            if (currentStage) {
                [span_34](start_span)const s = currentStage;[span_34](end_span)
                if (s.status === 'UNLOCKED') {
                    nextHint = `Current stage unlocked: upload required. Type **UPLOAD** to submit ${stageFileHints[s.stage_number] || [span_35](start_span)'the required file'}.`;[span_35](end_span)
                } else if (s.status === 'PENDING') {
                    [span_36](start_span)nextHint = `Stage ${s.stage_number} is PENDING approval by the Field Officer.`;[span_36](end_span)
                } else if (s.status === 'APPROVED') {
                    [span_37](start_span)nextHint = `Stage ${s.stage_number} approved — awaiting lender disbursement.`;[span_37](end_span)
                } else if (s.status === 'LOCKED') {
                    nextHint = `Stage ${s.stage_number} is locked. [span_38](start_span)Complete previous steps.`;[span_38](end_span)
                } else if (s.status === 'COMPLETED') {
                    [span_39](start_span)nextHint = `Stage ${s.stage_number} completed.`;[span_39](end_span)
                }
            }

            [span_40](start_span)let statusMessage = `✅ **Status for ${data.name} (ID: ${id})**\n\n`;[span_40](end_span)
            statusMessage += `🌱 AI Score: ${data.current_status?.score ?? [span_41](start_span)'N/A'} (Risk: ${data.current_status?.risk_band ?? 'N/A'})\n`;[span_41](end_span)
            
            // **KEY UPGRADE**: Display dynamic insurance status
            if (data.has_insurance) {
                const claimStatus = data.insurance_claim_status || 'UNKNOWN';
                const triggerText = data.insurance_triggered ? '⚠️ Triggered' : 'No trigger';
                statusMessage += `🌤️ Insurance Policy: Active | Claim status: ${claimStatus} | ${triggerText}\n\n`;
            } else {
                statusMessage += `🌤️ Insurance Policy: Not yet activated — complete Stage 3 to enable drought cover.\n\n`;
            }
            
            [span_42](start_span)statusMessage += `📋 Stages (${stages.length}):\n`;[span_42](end_span)
            stages.forEach(s => {
                const marker = s.stage_number === (currentStage?.stage_number) ? '→ ' : '   ';
                statusMessage += `${marker}Stage ${s.stage_number}: ${s.stage_name} — ${s.status}\n`;
            });
            [span_43](start_span)statusMessage += `\n📂 Uploaded files: ${uploadedFiles.length ? uploadedFiles.join(', ') : 'None'}\n`;[span_43](end_span)
            [span_44](start_span)statusMessage += `\n➡️ ${nextHint}\n\nType **UPLOAD**, **IOT** for sensor data, or **HELP**.`;[span_44](end_span)

            [span_45](start_span)setChatState('AWAITING_ACTION');[span_45](end_span)
            [span_46](start_span)pushBotMessage(statusMessage);[span_46](end_span)

             // Proactive prompt for IoT after weeding is done
            const completedStage4 = stages.some(s => s.stage_number === 4 && s.status === 'COMPLETED');
            if (completedStage4 && data.has_insurance && !data.insurance_triggered) {
                pushBotMessage("🌦️ Stage 4 complete! Check for drought risk by typing **IOT** to upload sensor readings.");
            }

        } catch (error) {
            [span_47](start_span)setChatState('AWAITING_COMMAND');[span_47](end_span)
            [span_48](start_span)pushBotMessage(`❌ Error fetching status for ID ${id}. Farmer ID not found or backend issue.`);[span_48](end_span)
            [span_49](start_span)console.error('fetchStatus error', error?.response?.data || error.message || error);[span_49](end_span)
        }
    };

    // Registration flow logic remains the same
    const handleRegistrationSteps = async (inputText) => {
        [span_50](start_span)let nextState = chatState;[span_50](end_span)
        [span_51](start_span)let botMessage = '';[span_51](end_span)
        [span_52](start_span)let currentData = { ...registrationData };[span_52](end_span)
        if (chatState === 'REG_AWAITING_NAME') {
            [span_53](start_span)currentData.name = inputText;[span_53](end_span)
            [span_54](start_span)nextState = 'REG_AWAITING_PHONE';[span_54](end_span)
            [span_55](start_span)botMessage = "Thanks. Now enter your **Phone Number** (e.g., 2547XXXXXXXX).";[span_55](end_span)
        } else if (chatState === 'REG_AWAITING_PHONE') {
            [span_56](start_span)currentData.phone = inputText;[span_56](end_span)
            [span_57](start_span)nextState = 'REG_AWAITING_AGE';[span_57](end_span)
            [span_58](start_span)botMessage = "Got it. Enter your **Age** (e.g., 35).";[span_58](end_span)
        } else if (chatState === 'REG_AWAITING_AGE') {
            [span_59](start_span)const age = parseInt(inputText);[span_59](end_span)
            [span_60](start_span)if (isNaN(age) || age < 18 || age > 100) {[span_60](end_span)
                [span_61](start_span)pushBotMessage("Invalid age. Please enter a number between 18 and 100.");[span_61](end_span)
                [span_62](start_span)return;[span_62](end_span)
            }
            [span_63](start_span)currentData.age = age;[span_63](end_span)
            [span_64](start_span)nextState = 'REG_AWAITING_GENDER';[span_64](end_span)
            [span_65](start_span)botMessage = "What is your **Gender**? (e.g., Male, Female).";[span_65](end_span)
        } else if (chatState === 'REG_AWAITING_GENDER') {
            [span_66](start_span)currentData.gender = inputText;[span_66](end_span)
            [span_67](start_span)nextState = 'REG_AWAITING_ID';[span_67](end_span)
            [span_68](start_span)botMessage = "Please enter your **ID Document** number.";[span_68](end_span)
        } else if (chatState === 'REG_AWAITING_ID') {
            [span_69](start_span)currentData.id_document = inputText;[span_69](end_span)
            [span_70](start_span)nextState = 'REG_AWAITING_CROP';[span_70](end_span)
            [span_71](start_span)botMessage = "Which **Crop** will you grow this season? (e.g., Maize).";[span_71](end_span)
        } else if (chatState === 'REG_AWAITING_CROP') {
            [span_72](start_span)currentData.crop = inputText;[span_72](end_span)
            [span_73](start_span)nextState = 'REG_AWAITING_LAND_SIZE';[span_73](end_span)
            [span_74](start_span)botMessage = "Finally, what's your **Land Size** in hectares (e.g., 2.5)?";[span_74](end_span)
        } else if (chatState === 'REG_AWAITING_LAND_SIZE') {
            [span_75](start_span)const landSize = parseFloat(inputText);[span_75](end_span)
            [span_76](start_span)if (isNaN(landSize) || landSize <= 0) {[span_76](end_span)
                [span_77](start_span)pushBotMessage("Invalid land size. Enter a positive number (e.g., 2.5).");[span_77](end_span)
                [span_78](start_span)return;[span_78](end_span)
            }
            [span_79](start_span)currentData.land_size = landSize;[span_79](end_span)
            [span_80](start_span)nextState = 'AWAITING_ACTION';[span_80](end_span)
            try {
                [span_81](start_span)const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, currentData);[span_81](end_span)
                [span_82](start_span)const newFarmerId = response.data.farmer_id;[span_82](end_span)
                [span_83](start_span)setFarmerId(newFarmerId);[span_83](end_span)
                [span_84](start_span)pushBotMessage(`✅ Registration successful! Your Farmer ID is ${newFarmerId}.`);[span_84](end_span)
                [span_85](start_span)await fetchStatus(newFarmerId);[span_85](end_span)
            } catch (error) {
                [span_86](start_span)pushBotMessage(`❌ Registration failed: ${error.response?.data?.message || error.message}`);[span_86](end_span)
                [span_87](start_span)setChatState('AWAITING_COMMAND');[span_87](end_span)
            }
        }
        [span_88](start_span)setRegistrationData(currentData);[span_88](end_span)
        [span_89](start_span)setChatState(nextState);[span_89](end_span)
        [span_90](start_span)if (botMessage) pushBotMessage(botMessage);[span_90](end_span)
    };

    // Upload flow logic remains the same
    const initiateUpload = async () => {
        if (!farmerStatus) {
            [span_91](start_span)pushBotMessage("Please run **STATUS** first to know which stage is unlocked.");[span_91](end_span)
            [span_92](start_span)return;[span_92](end_span)
        }
        [span_93](start_span)const nextStage = farmerStatus.stages.find(s => s.status === 'UNLOCKED');[span_93](end_span)
        if (!nextStage) {
            [span_94](start_span)pushBotMessage("No UNLOCKED stage found. You might be waiting for approval.");[span_94](end_span)
            [span_95](start_span)return;[span_95](end_span)
        }
        [span_96](start_span)setShowUploadInput(true);[span_96](end_span)
        const formatInfo = stageFileHints[nextStage.stage_number] || [span_97](start_span)'Acceptable formats: PDF / JPG';[span_97](end_span)
        [span_98](start_span)pushBotMessage(`Stage ${nextStage.stage_number}: ${nextStage.stage_name} is UNLOCKED. Please type the filename to mock-upload.\nExpected: ${formatInfo}\nType **CANCEL** to abort.`);[span_98](end_span)
    };
    const handleFileUpload = async (fileInput) => {
        [span_99](start_span)setShowUploadInput(false);[span_99](end_span)
        if (!fileInput || fileInput.trim().toUpperCase() === 'CANCEL') {
            [span_100](start_span)pushBotMessage("Upload cancelled.");[span_100](end_span)
            [span_101](start_span)return;[span_101](end_span)
        }
        [span_102](start_span)const trimmed = fileInput.trim();[span_102](end_span)
        [span_103](start_span)const lastDot = trimmed.lastIndexOf('.');[span_103](end_span)
        [span_104](start_span)let fileName = lastDot > 0 ? trimmed.substring(0, lastDot) : trimmed;[span_104](end_span)
        [span_105](start_span)let fileType = lastDot > 0 ? trimmed.substring(lastDot + 1).toLowerCase() : 'pdf';[span_105](end_span)
        
        [span_106](start_span)const nextStage = farmerStatus?.stages?.find(s => s.status === 'UNLOCKED');[span_106](end_span)
        if (!nextStage) {
            [span_107](start_span)pushBotMessage("No unlocked stage found; upload aborted.");[span_107](end_span)
            [span_108](start_span)return;[span_108](end_span)
        }
        const soilData = nextStage.stage_number === 1 ? [span_109](start_span){ ph: 6.8, nitrogen: 30, moisture: 25 } : {};[span_109](end_span)
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, {
                stage_number: nextStage.stage_number,
                file_type: fileType,
                file_name: fileName,
                soil_data: soilData
            [span_110](start_span)});[span_110](end_span)
            [span_111](start_span)pushBotMessage(`✅ ${response.data.message}`);[span_111](end_span)
            [span_112](start_span)await fetchStatus();[span_112](end_span)
        } catch (error) {
            [span_113](start_span)pushBotMessage(`❌ Upload failed: ${error.response?.data?.message || error.message}`);[span_113](end_span)
            [span_114](start_span)console.error('upload error', error?.response?.data || error);[span_114](end_span)
        }
    };

    // **KEY UPGRADE**: IoT ingestion for drought check
    const initiateIoTPrompt = async () => {
        if (!farmerStatus) {
            [span_115](start_span)pushBotMessage("Please check **STATUS** first.");[span_115](end_span)
            [span_116](start_span)return;[span_116](end_span)
        }
        [span_117](start_span)setShowIoTInput(true);[span_117](end_span)
        [span_118](start_span)pushBotMessage("Please type simple sensor readings (e.g. `temperature:36, moisture:12, ph:6.5`) or type **CANCEL**.");[span_118](end_span)
    };
    const handleIotData = async (dataInput) => {
        [span_119](start_span)setShowIoTInput(false);[span_119](end_span)
        [span_120](start_span)const raw = dataInput.trim();[span_120](end_span)
        if (!raw || raw.toUpperCase() === 'CANCEL') {
            [span_121](start_span)pushBotMessage("IoT upload cancelled.");[span_121](end_span)
            [span_122](start_span)return;[span_122](end_span)
        }
        [span_123](start_span)const parsed = {};[span_123](end_span)
        try {
            raw.split(',').forEach(part => {
                const [k, v] = part.split(':').map(s => s?.trim());
                if (k && v) parsed[k] = isNaN(Number(v)) ? v : Number(v);
            [span_124](start_span)});[span_124](end_span)
        } catch (err) {
            [span_125](start_span)console.warn('IoT parse error', err);[span_125](end_span)
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
            [span_126](start_span)console.error('IoT ingest failed', err?.response?.data || err);[span_126](end_span)
        }
    };

    // Other handlers remain the same
    const handlePestTrigger = async () => {
        [span_127](start_span)if (!farmerId) { pushBotMessage("No Farmer ID."); return;[span_127](end_span) }
        try {
            [span_128](start_span)const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${farmerId}`);[span_128](end_span)
            [span_129](start_span)pushBotMessage(`✅ ${response.data.message}`);[span_129](end_span)
            [span_130](start_span)await fetchStatus();[span_130](end_span)
        } catch (err) {
            [span_131](start_span)pushBotMessage(`Pest trigger failed: ${err.response?.data?.message || err.message}`);[span_131](end_span)
        }
    };
    const handleInput = async (e) => {
        [span_132](start_span)e.preventDefault();[span_132](end_span)
        [span_133](start_span)const userText = input.trim();[span_133](end_span)
        [span_134](start_span)if (!userText) return;[span_134](end_span)
        [span_135](start_span)const command = userText.toUpperCase();[span_135](end_span)
        [span_136](start_span)pushUserMessage(userText);[span_136](end_span)
        [span_137](start_span)setInput('');[span_137](end_span)
        [span_138](start_span)if (showUploadInput) { await handleFileUpload(userText); return;[span_138](end_span) }
        [span_139](start_span)if (showIoTInput) { await handleIotData(userText); return;[span_139](end_span) }
        [span_140](start_span)if (chatState.startsWith('REG_')) { await handleRegistrationSteps(userText); return;[span_140](end_span) }
        if (chatState === 'AWAITING_FARMER_ID') {
            [span_141](start_span)const inputId = parseInt(userText);[span_141](end_span)
            [span_142](start_span)if (!isNaN(inputId) && inputId > 0) {[span_142](end_span)
                [span_143](start_span)setFarmerId(inputId);[span_143](end_span)
                [span_144](start_span)setChatState('AWAITING_ACTION');[span_144](end_span)
                [span_145](start_span)await fetchStatus(inputId);[span_145](end_span)
            } else {
                [span_146](start_span)pushBotMessage("Invalid Farmer ID. Please enter a number.");[span_146](end_span)
            }
            [span_147](start_span)return;[span_147](end_span)
        }
        switch (command) {
            case 'RESET':
                [span_148](start_span)setChatState('AWAITING_COMMAND');[span_148](end_span)
                [span_149](start_span)setFarmerId(null);[span_149](end_span)
                [span_150](start_span)setRegistrationData({});[span_150](end_span)
                [span_151](start_span)setFarmerStatus(null);[span_151](end_span)
                [span_152](start_span)pushBotMessage("Chat reset. Type **REGISTER** or **STATUS**.");[span_152](end_span)
                break;
            case 'STATUS':
                if (!farmerId) {
                    [span_153](start_span)setChatState('AWAITING_FARMER_ID');[span_153](end_span)
                    [span_154](start_span)pushBotMessage("Please enter your **Farmer ID** to check your status.");[span_154](end_span)
                } else {
                    [span_155](start_span)await fetchStatus(farmerId);[span_155](end_span)
                }
                break;
            case 'REGISTER':
                [span_156](start_span)setChatState('REG_AWAITING_NAME');[span_156](end_span)
                [span_157](start_span)setRegistrationData({});[span_157](end_span)
                [span_158](start_span)pushBotMessage("To register, please enter your **Full Name**.");[span_158](end_span)
                break;
            case 'HELP':
                [span_159](start_span)pushBotMessage("Commands:\n• **STATUS**\n• **UPLOAD**\n• **IOT**\n• **REGISTER**\n• **RESET**");[span_159](end_span)
                break;
            case 'UPLOAD':
                [span_160](start_span)if (!farmerId) pushBotMessage("Use **STATUS** first.");[span_160](end_span)
                [span_161](start_span)else await initiateUpload();[span_161](end_span)
                break;
            case 'IOT':
                [span_162](start_span)if (!farmerId) pushBotMessage("Use **STATUS** first.");[span_162](end_span)
                [span_163](start_span)else await initiateIoTPrompt();[span_163](end_span)
                break;
            case 'TRIGGER PEST':
                [span_164](start_span)await handlePestTrigger();[span_164](end_span)
                break;
            default:
                [span_165](start_span)pushBotMessage("I didn't understand that. Type **HELP** for a list of commands.");[span_165](end_span)
        }
    };

    useEffect(() => {
        [span_166](start_span)pushBotMessage("Welcome to the GENFIN 🌱 demo. Type **REGISTER** to sign up or **STATUS** if you have a Farmer ID.");[span_166](end_span)
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
    [span_167](start_span));[span_167](end_span)
};

// --- ADMIN/LENDER DASHBOARD ---
const LenderDashboard = ({ setView }) => {
    [span_168](start_span)const [farmers, setFarmers] = useState([]);[span_168](end_span)
    [span_169](start_span)const [selectedFarmerId, setSelectedFarmerId] = useState(null);[span_169](end_span)
    [span_170](start_span)const [farmerData, setFarmerData] = useState(null);[span_170](end_span)

    const fetchFarmers = async () => {
        try {
            [span_171](start_span)const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);[span_171](end_span)
            [span_172](start_span)setFarmers(response.data);[span_172](end_span)
        } catch (error) {
            console.error("Error fetching farmers:", error);
        }
    };
    const fetchFarmerDetails = async (id) => {
        try {
            [span_173](start_span)const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);[span_173](end_span)
            [span_174](start_span)setFarmerData(response.data);[span_174](end_span)
            [span_175](start_span)setSelectedFarmerId(id);[span_175](end_span)
        } catch (error) {
            console.error("Error fetching farmer details:", error);
        }
    };
    const handleDisburse = async (stageNumber) => {
        [span_176](start_span)if (!farmerData) return;[span_176](end_span)
        try {
            [span_177](start_span)await axios.post(`${API_BASE_URL}/api/lender/disburse/${selectedFarmerId}/${stageNumber}`);[span_177](end_span)
            [span_178](start_span)await fetchFarmerDetails(selectedFarmerId);[span_178](end_span)
            [span_179](start_span)await fetchFarmers();[span_179](end_span)
        } catch (error) {
            [span_180](start_span)alert(error.response?.data?.message || "Disbursement failed.");[span_180](end_span)
        }
    };

    useEffect(() => {
        [span_181](start_span)fetchFarmers();[span_181](end_span)
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
                            {/* PDF Report button restored */}
                            <a href={`${API_BASE_URL}/api/report/farmer/${farmer.id}`} target="_blank" rel="noopener noreferrer">
                                <button className="btn-report">Download Report</button>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        [span_182](start_span));[span_182](end_span)
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
    [span_183](start_span));[span_183](end_span)
};

// --- FIELD OFFICER DASHBOARD ---
const FieldOfficerDashboard = ({ setView }) => {
    [span_184](start_span)const [farmers, setFarmers] = useState([]);[span_184](end_span)
    [span_185](start_span)const [selectedFarmerId, setSelectedFarmerId] = useState(null);[span_185](end_span)
    [span_186](start_span)const [farmerData, setFarmerData] = useState(null);[span_186](end_span)
    const fetchFarmers = async () => {
        try {
            [span_187](start_span)const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);[span_187](end_span)
            [span_188](start_span)setFarmers(response.data);[span_188](end_span)
        } catch (error) {
            [span_189](start_span)console.error("Error fetching farmers:", error);[span_189](end_span)
        }
    };
    const fetchFarmerDetails = async (id) => {
        try {
            [span_190](start_span)const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);[span_190](end_span)
            [span_191](start_span)setFarmerData(response.data);[span_191](end_span)
            [span_192](start_span)setSelectedFarmerId(id);[span_192](end_span)
        } catch (error) {
            [span_193](start_span)console.error("Error fetching farmer details:", error);[span_193](end_span)
        }
    };
    const handleApprove = async (stageNumber) => {
        [span_194](start_span)if (!farmerData) return;[span_194](end_span)
        try {
            [span_195](start_span)const response = await axios.post(`${API_BASE_URL}/api/field-officer/approve/${selectedFarmerId}/${stageNumber}`);[span_195](end_span)
            [span_196](start_span)alert(response.data.message);[span_196](end_span)
            [span_197](start_span)await fetchFarmerDetails(selectedFarmerId);[span_197](end_span)
            [span_198](start_span)await fetchFarmers();[span_198](end_span)
        } catch (error) {
            [span_199](start_span)alert(error.response?.data?.message || "Approval failed.");[span_199](end_span)
        }
    };
    const handlePestTrigger = async () => {
        [span_200](start_span)if (!farmerData) return;[span_200](end_span)
        try {
            [span_201](start_span)const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${selectedFarmerId}`);[span_201](end_span)
            [span_202](start_span)alert(response.data.message);[span_202](end_span)
            [span_203](start_span)await fetchFarmerDetails(selectedFarmerId);[span_203](end_span)
        } catch (error) {
            [span_204](start_span)alert(error.response?.data?.message || "Trigger failed.");[span_204](end_span)
        }
    };
    useEffect(() => {
        [span_205](start_span)fetchFarmers();[span_205](end_span)
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
        [span_206](start_span));[span_206](end_span)
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
    [span_207](start_span));[span_207](end_span)
};

// --- INSURER DASHBOARD ---
const InsurerDashboard = ({ setView }) => {
    [span_208](start_span)const [farmers, setFarmers] = useState([]);[span_208](end_span)
    [span_209](start_span)const [selectedFarmerId, setSelectedFarmerId] = useState(null);[span_209](end_span)
    [span_210](start_span)const [farmerData, setFarmerData] = useState(null);[span_210](end_span)
    const fetchInsurerFarmers = async () => {
        try {
            [span_211](start_span)const response = await axios.get(`${API_BASE_URL}/api/insurer/farmers`);[span_211](end_span)
            [span_212](start_span)setFarmers(response.data);[span_212](end_span)
        } catch (error) {
            [span_213](start_span)console.error("Error fetching insurer-relevant farmers:", error);[span_213](end_span)
        }
    };
    const fetchFarmerDetails = async (id) => {
        try {
            [span_214](start_span)const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);[span_214](end_span)
            [span_215](start_span)setFarmerData(response.data);[span_215](end_span)
            [span_216](start_span)setSelectedFarmerId(id);[span_216](end_span)
        } catch (error) {
            [span_217](start_span)console.error("Error fetching farmer details:", error);[span_217](end_span)
            [span_218](start_span)setFarmerData(null);[span_218](end_span)
        }
    };

    // **KEY UPGRADE**: Add handler for approving/rejecting claims
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
        [span_219](start_span)fetchInsurerFarmers();[span_219](end_span)
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
        [span_220](start_span));[span_220](end_span)
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
            
            {/* **KEY UPGRADE**: Display review buttons when claim is pending */}
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
    [span_221](start_span));[span_221](end_span)
};

// --- WELCOME SCREEN ---
const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        [span_222](start_span)<img src={LOGO_SRC} alt="eSusFarm Africa Logo" className="esusfarm-logo" />[span_222](end_span)
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
[span_223](start_span));[span_223](end_span)

// --- MAIN APP COMPONENT ---
const App = () => {
    [span_224](start_span)const [view, setView] = useState('welcome');[span_224](end_span)
    return (
        <div className="App">
            {view === 'welcome' && <WelcomeScreen setView={setView} />}
            {view === 'farmer' && <FarmerChatbotMock setView={setView} />}
            {view === 'lender' && <LenderDashboard setView={setView} />}
            {view === 'fieldOfficer' && <FieldOfficerDashboard setView={setView} />}
            {view === 'insurer' && <InsurerDashboard setView={setView} />}
        </div>
    [span_225](start_span));[span_225](end_span)
};

export default App;
