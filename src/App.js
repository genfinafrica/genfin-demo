// src/App.js (Restored and Merged)
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>Close</button>
        <h3>{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENTS ---
// FarmerDetailsCard (restored from original with real contract history)
const FarmerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages, contractHistory }) => {
  const [showXaiModal, setShowXaiModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const reversedStages = [...stages].reverse();
  return (
    <div className="farmer-card">
      <h3>Farmer Tracker: {farmer.name} (ID: {farmer.farmer_id})</h3>
      <div>Score: {score} | Risk: {risk} <button onClick={() => setShowXaiModal(true)}>View XAI</button></div>
      <div>Contract: {contractState} | Hash: {contractHash ? contractHash.substring(0, 10) + '...' : 'N/A'} <button onClick={() => setShowContractModal(true)}>View Contract</button></div>
      <h4>Loan Stage Tracker</h4>
      <ul>
        {reversedStages.map((stage) => (
          <li key={stage.stage_number}>
            {stage.stage_name} — ${stage.disbursement_amount.toFixed(2)} — {stage.status}
          </li>
        ))}
      </ul>

      <Modal show={showXaiModal} onClose={() => setShowXaiModal(false)} title="AI Proficiency Score (XAI)">
        <div>Score: {score} | Risk Band: {risk}</div>
        <table>
          <thead><tr><th>Factor</th><th>Contribution</th></tr></thead>
          <tbody>
            {xaiFactors.map((f, i) => (
              <tr key={i}><td>{f.factor}</td><td>{f.weight.toFixed(1)}</td></tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal show={showContractModal} onClose={() => setShowContractModal(false)} title="Smart Contract Audit Trail">
        <div>This is a simulated immutable log of all contract state transitions.</div>
        <table>
          <thead><tr><th>Timestamp</th><th>State</th><th>Hash</th></tr></thead>
          <tbody>
            {contractHistory.map((entry, idx) => (
              <tr key={idx}><td>{new Date(entry.timestamp).toLocaleString()}</td><td>{entry.state}</td><td>{entry.hash.substring(0,10)}...</td></tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};

// --------- FarmerChatbotMock (surgically replaced with the upgraded version) ---------
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
    1: 'Soil test (CSV / PDF / JPG)',
    2: 'Input supplier invoice (PDF / JPG)',
    3: 'Insurance: soil sensor CSV or premium receipt',
    4: 'Weeding photo (JPG / PNG)',
    5: 'Pest photo (JPG) or type NO PEST',
    6: 'Packaging photo (JPG / PNG)',
    7: 'Transport/Delivery note (PDF / JPG)',
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const pushBotMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'bot', timestamp: new Date().toLocaleTimeString() }]);
  };
  const pushUserMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now()+1, text, sender: 'user', timestamp: new Date().toLocaleTimeString() }]);
  };

  // ---------- STATUS (enhanced with insurance logic) ----------
  const fetchStatus = async (id = farmerId) => {
    if (!id) {
      pushBotMessage("Error: No Farmer ID available to check status. Type **REGISTER** to create an account or provide your ID.");
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
      statusMessage += `🔔 Pest Flag: ${data.current_status?.pest_flag ? '⚠️ ACTIVE' : 'No'}\n\n`;

      // **KEY UPGRADE**: Display dynamic insurance status
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
      statusMessage += `\n➡️ ${nextHint}\n\nType **UPLOAD** to submit, **IOT** for sensor data, or **HELP**.`;

      setChatState('AWAITING_ACTION');
      pushBotMessage(statusMessage);

      const completedStage4 = stages.some(s => s.stage_number === 4 && s.status === 'COMPLETED');
      if (completedStage4 && data.has_insurance && !data.insurance_triggered) {
        pushBotMessage("🌦️ Stage 4 completed! To check for drought risk and file an insurance claim, type **IOT** to upload your soil sensor readings.");
      }
    } catch (error) {
      setChatState('AWAITING_COMMAND');
      pushBotMessage(`❌ Error fetching status for ID ${id}.\nFarmer ID not found or backend issue.`);
      console.error('fetchStatus error', error?.response?.data || error.message || error);
    }
  };

  // ---------- Registration flow (unchanged) ----------
  const handleRegistrationSteps = async (inputText) => {
    let nextState = chatState;
    let botMessage = '';
    let currentData = { ...registrationData };

    if (chatState === 'REG_AWAITING_NAME') {
      currentData.name = inputText;
      nextState = 'REG_AWAITING_PHONE';
      botMessage = "Thanks. Now enter your **Phone Number** (e.g., 2547XXXXXXXX).";
    } else if (chatState === 'REG_AWAITING_PHONE') {
      currentData.phone = inputText;
      nextState = 'REG_AWAITING_AGE';
      botMessage = "Got it. Enter your **Age** (e.g., 35).";
    } else if (chatState === 'REG_AWAITING_AGE') {
      currentData.age = parseInt(inputText);
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
      currentData.land_size = parseFloat(inputText);
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
  
  // ---------- Upload flow (unchanged) ----------
  const initiateUpload = async () => {
    if (!farmerStatus) {
      pushBotMessage("Please run **STATUS** first.");
      return;
    }
    const nextStage = farmerStatus.stages.find(s => s.status === 'UNLOCKED');
    if (!nextStage) {
      pushBotMessage("No UNLOCKED stage found. Type **STATUS** to check.");
      return;
    }
    setShowUploadInput(true);
    pushBotMessage(`Stage ${nextStage.stage_number}: ${nextStage.stage_name} is UNLOCKED.\nPlease type the filename to mock-upload.\nExpected: ${stageFileHints[nextStage.stage_number]}\nType **CANCEL** to abort.`);
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
    }
  };

  // ---------- IoT ingestion (upgraded for drought detection) ----------
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
    
    // **KEY UPGRADE**: Call the new, farmer-aware ingest endpoint
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
  
  // ---------- Other handlers (unchanged) ----------
  const handleNextStage = async () => {
    // This function remains for manual testing but the flow is mostly automatic
    if (!farmerId) { pushBotMessage("No Farmer ID."); return; }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/trigger`);
      pushBotMessage(`✅ ${response.data.message}`);
      await fetchStatus();
    } catch (error) {
      pushBotMessage(`Trigger failed: ${error.response?.data?.message || error.message}.`);
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
  
  // ---------- Central Input Handler (unchanged structure) ----------
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
        setChatState('AWAITING_COMMAND'); setFarmerId(null); setRegistrationData({}); setFarmerStatus(null);
        pushBotMessage("Chat reset. Type **REGISTER** or **STATUS**.");
        break;
      case 'STATUS':
        if (!farmerId) {
          setChatState('AWAITING_FARMER_ID');
          pushBotMessage("Please enter your **Farmer ID**.");
        } else {
          await fetchStatus(farmerId);
        }
        break;
      case 'REGISTER':
        setChatState('REG_AWAITING_NAME'); setRegistrationData({});
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
      case 'NEXT': await handleNextStage(); break;
      case 'TRIGGER PEST': await handlePestTrigger(); break;
      default:
        pushBotMessage("I didn't understand. Type **HELP** for commands.");
    }
  };

  useEffect(() => {
    pushBotMessage("Welcome to the GENFIN demo. Type **REGISTER** to sign up or **STATUS** if you have a Farmer ID.");
  }, []);

  return (
    <div className="chatbot-container">
      <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
      <h2>Whatsapp Farmer Chatbot Mock-up</h2>
      <div className="chat-window">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className="message-bubble">{msg.text}</div>
            <div className="timestamp">{msg.timestamp}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {showUploadInput && <div className="mock-file-input"><label>Mock Upload — Enter filename in chat or type CANCEL</label></div>}
      {showIoTInput && <div className="iot-input-hint"><small>IoT input open — type `temperature:36, moisture:12, ph:6.5`</small></div>}
      <form className="chat-input-form" onSubmit={handleInput}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
        />
        <button type="submit">Send</button>
      </form>
      <p className="disclaimer">For Demonstration Only.</p>
    </div>
  );
};
// ------------------------------------------------------------------------------------

// --- Lender, Field Officer dashboards (restored original structure) ---
const LenderDashboard = ({ setView }) => {
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [farmerData, setFarmerData] = useState(null);

  const fetchFarmers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
      setFarmers(response.data);
    } catch (error) { console.error("Error fetching farmers:", error); }
  };

  const fetchFarmerDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
      setFarmerData(response.data);
      setSelectedFarmerId(id);
    } catch (error) { console.error("Error fetching farmer details:", error); }
  };

  const handleDisburse = async (stageNumber) => {
    if (!farmerData) return;
    try {
      await axios.post(`${API_BASE_URL}/api/lender/disburse/${selectedFarmerId}/${stageNumber}/`);
      await fetchFarmerDetails(selectedFarmerId);
      await fetchFarmers();
    } catch (error) { alert(error.response?.data?.message || "Disbursement failed."); }
  };

  useEffect(() => { fetchFarmers(); }, []);

  if (!selectedFarmerId || !farmerData) {
    return (
      <div>
        <button onClick={() => setView('welcome')}>← Back to Roles</button>
        <h2>Lender/Admin Dashboard</h2>
        <p>Select a farmer to view progress and disburse funds.</p>
        <ul>
          {farmers.map((farmer) => (
            <li key={farmer.id}>
              {farmer.name} (ID: {farmer.id}) — Stages: {farmer.stages_completed} | Score: {farmer.score}
              <button onClick={() => fetchFarmerDetails(farmer.id)}>View Progress</button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
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
      <ul>
        {farmerData.stages.map(stage => (
          <li key={stage.stage_number}>
            {stage.stage_name} — ${stage.disbursement_amount.toFixed(2)} — {stage.status}
            {stage.status === 'APPROVED' && (
              <button onClick={() => handleDisburse(stage.stage_number)}>Disburse Funds</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const FieldOfficerDashboard = ({ setView }) => {
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [farmerData, setFarmerData] = useState(null);

  const fetchFarmers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/farmers`);
      setFarmers(response.data);
    } catch (error) { console.error("Error fetching farmers:", error); }
  };

  const fetchFarmerDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
      setFarmerData(response.data);
      setSelectedFarmerId(id);
    } catch (error) { console.error("Error fetching farmer details:", error); }
  };

  const handleApprove = async (stageNumber) => {
    if (!farmerData) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/api/field-officer/approve/${selectedFarmerId}/${stageNumber}/`);
      alert(response.data.message);
      await fetchFarmerDetails(selectedFarmerId);
      await fetchFarmers();
    } catch (error) { alert(error.response?.data?.message || "Approval failed."); }
  };

  const handlePestTrigger = async () => {
    if (!farmerData) return;
    try {
      const response = await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${selectedFarmerId}/`);
      alert(response.data.message);
      await fetchFarmerDetails(selectedFarmerId);
    } catch (error) { alert(error.response?.data?.message || "Trigger failed."); }
  };

  useEffect(() => { fetchFarmers(); }, []);

  if (!selectedFarmerId || !farmerData) {
    return (
      <div>
        <button onClick={() => setView('welcome')}>← Back to Roles</button>
        <h2>Field Officer Dashboard</h2>
        <p>Select a farmer to view milestones and approve stages.</p>
        <ul>
          {farmers.map((farmer) => (
            <li key={farmer.id}>
              {farmer.name} (ID: {farmer.id}) — Stages: {farmer.stages_completed} | Score: {farmer.score}
              <button onClick={() => fetchFarmerDetails(farmer.id)}>View Stages</button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
      <h2>{farmerData.name}'s Stage Approvals</h2>
      <div>
        <strong>Field Officer Action:</strong>
        <div>
          <button onClick={handlePestTrigger}>Trigger Pest Event (Unlock Stage 5)</button>
          <div>Pest Flag Status: {farmerData.current_status.pest_flag ? 'ACTIVE' : 'NO EVENT'}</div>
        </div>
      </div>
      <h4>Milestone Checkpoints</h4>
      <ul>
        {farmerData.stages.map(stage => (
          <li key={stage.stage_number}>
            {stage.stage_name} — Uploads: {farmerData.uploads.filter(u => u.stage_number === stage.stage_number).map(u => u.file_name).join(', ') || 'None'} — {stage.status}
            {stage.status === 'PENDING' && (
              <button onClick={() => handleApprove(stage.stage_number)}>Approve</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};


// +++ INSURER DASHBOARD (surgically replaced with upgraded version) +++
const InsurerDashboard = ({ setView }) => {
  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [farmerData, setFarmerData] = useState(null);

  const fetchInsurerFarmers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/insurer/farmers`);
      setFarmers(response.data);
    } catch (error) { console.error("Error fetching insurer farmers:", error); }
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

  // **KEY UPGRADE**: Review claim function
  const handleReview = async (action) => {
    if (!selectedFarmerId) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/api/insurance/${selectedFarmerId}/review`, { action });
      alert(res.data.message);
      await fetchFarmerDetails(selectedFarmerId);
      await fetchInsurerFarmers(); // Refresh list as well
    } catch (err) {
      alert(err.response?.data?.message || 'Review failed');
    }
  };

  useEffect(() => { fetchInsurerFarmers(); }, []);

  if (!selectedFarmerId || !farmerData) {
    return (
      <div>
        <button onClick={() => setView('welcome')}>← Back to Roles</button>
        <h2>Insurer Dashboard</h2>
        <p>Select a farmer to manage their insurance policy.</p>
        <ul>
          {farmers.map((farmer) => (
            <li key={farmer.id}>
              {farmer.name} (ID: {farmer.id}) — Policy: {farmer.policy_status} | Score: {farmer.score}
              <button onClick={() => fetchFarmerDetails(farmer.id)}>View Policy</button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const claimStatus = farmerData.insurance_claim_status || 'NONE';

  return (
    <div>
      <button onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchInsurerFarmers(); }}>← Back to List</button>
      <h2>Insurer Dashboard for {farmerData.name}</h2>
      
      <h3>Weather-Index Insurance Policy</h3>
      <div>Policy ID: {farmerData.policy_id || 'N/A'}</div>
      <div>Status: {farmerData.has_insurance ? 'ACTIVE' : 'PENDING'}</div>
      
      <div style={{ marginTop: 12 }}>
        <strong>Claim status: {claimStatus}</strong>
        {/* **KEY UPGRADE**: Show Approve/Reject buttons */}
        {claimStatus === 'CLAIM_PENDING' && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => handleReview('APPROVE')} className="btn-approve">Approve Claim</button>
            <button onClick={() => handleReview('REJECT')} className="btn-reject">Reject Claim</button>
          </div>
        )}
      </div>
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


// --- WELCOME SCREEN (restored original) ---
const WelcomeScreen = ({ setView }) => (
  <div>
    <h1>GENFIN AFRICA</h1>
    <h2>G20 TechSprint 2025 Demo</h2>
    <p>Select a user role to begin.</p>
    <div>
      <button onClick={() => setView('farmer')}>Farmer Chatbot Mock</button>
      <button onClick={() => setView('lender')}>Lender/Admin Dashboard</button>
      <button onClick={() => setView('fieldOfficer')}>Field Officer Dashboard</button>
      <button onClick={() => setView('insurer')}>Insurer Dashboard</button>
    </div>
    <p>For Demonstration Only. Powered by eSusFarm Africa</p>
  </div>
);

// --- MAIN APP COMPONENT (restored original) ---
const App = () => {
  const [view, setView] = useState('welcome');
  return (
    <div className="app-root">
      {view === 'welcome' && <WelcomeScreen setView={setView} />}
      {view === 'farmer' && <FarmerChatbotMock setView={setView} />}
      {view === 'lender' && <LenderDashboard setView={setView} />}
      {view === 'fieldOfficer' && <FieldOfficerDashboard setView={setView} />}
      {view === 'insurer' && <InsurerDashboard setView={setView} />}
    </div>
  );
};

export default App;
