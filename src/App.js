import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
const LOGO_SRC = "https://lh3.googleusercontent.com/d/1JWvtX4b24wt5vRGmhYsUW029NS0grXOq";
const FAQ_IMG_SRC = "https://lh3.googleusercontent.com/d/1CA3_rgBfriiqvWZu8Ts_H-rZJcGBM77D";
const GITHUB_LOGO_SRC = "https://lh3.googleusercontent.com/d/1LWLoq3-G8Sk-B9B5oB7CyWZnnrf2WxVN";  
const REPO_URL = "https://github.com/genfinafrica/genfin-demo"; 
const README_URL = "https://github.com/genfinafrica/genfin-demo/blob/main/README.md#genfin-demo";

// --- UTILITY COMPONENTS ---

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

const KpiGrid = ({ kpis }) => {
    if (!kpis || kpis.length === 0) {
        return <p>Loading KPIs...</p>;
    }
    return (
        <div className="kpi-grid">
            {kpis.map((kpi, index) => (
                <div key={index} className="kpi-card">
                    <div className="kpi-value">{kpi.value}</div>
                    <div className="kpi-label">{kpi.label}</div>
                </div>
            ))}
        </div>
    );
};

const BarChart = ({ title, data }) => {
    if (!data) {
        return <p>No stage data to display.</p>;
    }
    
    return (
        <div className="bar-chart-container">
            <h4>{title}</h4>
            <img 
                src={`data:image/png;base64,${data}`} 
                alt="Farmer Stage Distribution Chart" 
                style={{ width: '100%', height: 'auto' }} 
            />
        </div>
    );
};


// --- DASHBOARD COMPONENTS ---

const FarmerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages, contractHistory, seasonNumber }) => {
    const [showXaiModal, setShowXaiModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

    const totalDisbursed = stages.filter(s => s.status === 'COMPLETED')
                                 .reduce((sum, s) => sum + s.disbursement_amount, 0);

    const reversedStages = [...stages].reverse();

    return (
        <div className="tracker-box">
            <h4>Farmer Tracker: {farmer.name} (ID: {farmer.farmer_id}) - Season {seasonNumber}</h4>
            <div className="farmer-status-summary" style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
                <div style={{ padding: '10px', borderRight: '1px solid #ddd' }}>
                    <strong>Total Disbursed Amount: ${totalDisbursed.toFixed(2)}</strong>
                    <br />
                    Contract: {contractState}
                    <button className="btn-view" onClick={() => setShowContractModal(true)} style={{ marginLeft: '10px' }}>
                        View Contract
                    </button>
                </div>
                <div style={{ padding: '10px' }}>
                    <strong>Score: {score}</strong> <br />
                    Risk: <span style={{ color: risk === 'LOW' ? 'green' : risk === 'HIGH' ? 'red' : 'orange' }}>{risk}</span>
                    <button className="btn-view" onClick={() => setShowXaiModal(true)} style={{ marginLeft: '10px' }}>
                        View XAI
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
        
            <Modal show={showXaiModal} onClose={() => setShowXaiModal(false)} title={`AI Proficiency Score (XAI) - Season ${seasonNumber}`}>
                <p><strong>Score: {score}</strong> | Risk Band: {risk}</p>
                <table>
                    <thead>
                        <tr><th>Factor</th><th>Contribution (Mock)</th></tr>
                    </thead>
                    <tbody>
                        {xaiFactors.map((f, index) => (
                            <tr key={index}><td>{f.factor}</td><td>+{f.weight.toFixed(1)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </Modal>

            <Modal show={showContractModal} onClose={() => setShowContractModal(false)} title={`Smart Contract Audit Trail - Season ${seasonNumber}`}>
                <p>This is a simulated immutable log of all contract state transitions.</p>
                <table>
                    <thead>
                        <tr><th>Timestamp</th><th>State Transition</th><th>Hash</th></tr>
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

const InsurerDetailsCard = ({ farmer, score, risk, xaiFactors, contractState, stages, seasonNumber }) => {
    const [showXaiModal, setShowXaiModal] = useState(false);

    const INSURER_XAI_FACTORS = ["Base Score", "Stages Completed Ratio", "Land Size (Acres)", "Soil Quality Score (Mock)"];
    const filteredXaiFactors = xaiFactors.filter(factor => INSURER_XAI_FACTORS.includes(factor.factor));

    return (
        <div className="tracker-box">
            <h4>Farmer Tracker: {farmer.name} (ID: {farmer.farmer_id}) - Season {seasonNumber}</h4>
            <div className="farmer-status-summary" style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
                <div style={{ padding: '10px', borderRight: '1px solid #ddd' }}>
                    <strong>Score: {score}</strong> <br />
                    Risk: <span style={{ color: risk === 'LOW' ? 'green' : risk === 'HIGH' ? 'red' : 'orange' }}>{risk}</span>
                    <button className="btn-view" onClick={() => setShowXaiModal(true)} style={{ marginLeft: '10px' }}>
                        View XAI
                    </button>
                </div>
                <div style={{ padding: '10px' }}>
                    <strong>Contract State: {contractState}</strong> <br />
                    <span>(Full contract log restricted)</span>
                </div>
            </div>

            <h4>Relevant Stage Progress</h4>
            {stages.map((stage) => (
                <div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                    <span className="stage-name">{stage.stage_name}</span>
                    <span style={{ fontWeight: 'bold' }}>{stage.status}</span>
                </div>
            ))}

            <Modal show={showXaiModal} onClose={() => setShowXaiModal(false)} title={`AI Proficiency Score (XAI) - Insurer View - Season ${seasonNumber}`}>
                <p><strong>Score: {score}</strong> | Risk Band: {risk}</p>
                <p>Explanation of score based on factors relevant to insurance underwriting:</p>
                <table>
                    <thead>
                        <tr><th>Factor</th><th>Contribution (Mock)</th></tr>
                    </thead>
                    <tbody>
                        {filteredXaiFactors.map((f, index) => (
                            <tr key={index}><td>{f.factor}</td><td>+{f.weight.toFixed(1)}</td></tr>
                        ))}
                    </tbody>
                </table>
                <p className="disclaimer">Note: Factors are filtered to show only information relevant to underwriting, per data governance policy.</p>
            </Modal>
        </div>
    );
};

const FaqSection = () => {
    return (
        <div className="faq-container">
            <div className="faq-intro">
                <img src={FAQ_IMG_SRC} alt="eSusFarm Stage-Based Financing Workflow" className="faq-image" />
                <p>
                    <strong>eSusFarm introduces a new model of climate-smart financing by linking farm productivity, data, and financial access through AI and blockchain.</strong> Unlike traditional microfinance or insurance models that require collateral or credit history, our platform uses farmer proficiency scores—derived from soil health, weather, and farming behaviour—to unlock stage-based financing. Each disbursement is automated through smart contracts, triggered only when verified milestones (e.g., soil testing, planting) are met. This ensures funds are used productively while reducing default risk without needing collateral. The innovation lies in merging decentralized trust, real-time data, and inclusive design to de-risk agricultural lending. Farmers don’t just receive aid—they build digital credit identities that enable long-term financial inclusion and resilience across Africa’s most vulnerable communities.
                </p>
            </div>
            
            <details className="faq-details">
                <summary>1. Core Solution & Value Proposition</summary>
                <div className="faq-content">
                    <h4>Q1: What problem does GENFIN-AFRICA solve?</h4>
                    <p><strong>A:</strong> We address the high-risk and high-collateral barrier that prevents smallholder African farmers from accessing formal financing. Traditional lenders lack reliable data on farmer performance and climate risk, leading to high interest rates or outright rejection. We de-risk lending by providing <strong>objective, data-driven proficiency scores</strong> and enforcing fund usage via <strong>stage-based disbursements</strong> managed by smart contracts.</p>

                    <h4>Q2: What is the Farmer Proficiency Score (FPS)?</h4>
                    <p><strong>A:</strong> The FPS is an AI-driven score that predicts a farmer's likelihood of successful yield. It moves beyond traditional credit history and collateral by analyzing farm inputs, soil health, satellite weather data, and real-time farming practices (verified through the Field Officer). A higher FPS unlocks eligibility for financing and insurance.</p>

                    <h4>Q3: What role does blockchain play?</h4>
                    <p><strong>A:</strong> The system uses a <strong>smart contract simulation</strong> to manage the financing lifecycle. Each stage disbursement is recorded on the simulated ledger, providing an <strong>immutable audit trail</strong> and ensuring that funds are released only when the pre-agreed milestone is met. This replaces manual, trust-based approvals with automated, code-based execution.</p>
                </div>
            </details>

            <details className="faq-details">
                <summary>2. Demo Flows and Testing Instructions</summary>
                <div className="faq-content">
                    <h4>Q4: How do I test the end-to-end financing flow?</h4>
                    <p><strong>A:</strong> The demo is driven by user roles, simulating a full crop cycle across multiple stages:</p>
                    <ol style={{ paddingLeft: '25px', marginTop: '10px' }}>
                        <li><strong>Start (Farmer Chatbot Mock):</strong> Simulate initial onboarding.</li>
                        <li><strong>Lender/Admin Dashboard:</strong> Monitor portfolio, disburse loan amounts and see the initial <strong>AI Score</strong>.</li>
                        <li><strong>Field Officer Dashboard:</strong> This is the *trigger point*. Use this dashboard to <strong>verify a milestone</strong> (e.g., confirming *Soil Test Completed*). To unlock Stage Five you must manually trigger Pest Event from this dashboard.</li>
                        <li><strong>Insurer Dashboard:</strong> Monitor policy status and view how **event triggers** affect the policy. Policy Claim is triggered only when moisture reads below 25 upon IoT manual input after Stage Four.</li>
                    </ol>
                    <h4>Q5: How is the Stage-Based Disbursement system demonstrated?</h4>
                    <p><strong>A:</strong> Stages are sequential. You will observe the <code>Contract State</code> on the dashboards change from one stage to the next <strong>only</strong> after the Field Officer confirms the preceding milestone. This demonstrates the core principle: <strong>Verification precedes Disbursement</strong>.</p>
                </div>
            </details>

            <details className="faq-details">
                <summary>3. Technical Architecture (Mock vs. Reality)</summary>
                <div className="faq-content">
                    <div className="table-scroll-wrapper">
                    <table>
                        <thead>
                            <tr><th>Feature</th><th>Demo Implementation</th><th>Actual Solution (BRS Goal)</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Smart Contract</td><td><strong>Mock Simulation</strong> (tracked in the SQL DB)</td><td>Live: Ethereum or Polygon Layer 2</td></tr>
                            <tr><td>AI Scoring</td><td><strong>Mock Score</strong> based on static data.</td><td>Live: Full PyTorch/ONNX model service with real-time data.</td></tr>
                            <tr><td>Integrations</td><td>Mock APIs and endpoints.</td><td>Live connections to MNOs (wallets), soil labs, and IoT sensors.</td></tr>
                            <tr><td>Report Hash</td><td>Simulated <code>contractHash</code> visible on cards.</td><td>Actual cryptographic hash of the transaction/state on the blockchain.</td></tr>
                        </tbody>
                    </table>
                   </div>
                </div>
            </details>
        </div>
    );
};

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

    const stageFileHints = { 1: 'Soil test (CSV)', 2: 'Input supplier invoice (PDF / JPG)', 3: 'Insurance: premium receipt (PDF / JPG)', 4: 'Weeding photo (JPG / PNG)', 5: 'Pest photo (JPG)', 6: 'Packaging photo (JPG / PNG)', 7: 'Transport/Delivery note (PDF / JPG)' };

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);
    const pushBotMessage = (text) => { setMessages(prev => [...prev, { id: Date.now(), text, sender: 'bot', timestamp: new Date().toLocaleTimeString() }]); };
    const pushUserMessage = (text) => { setMessages(prev => [...prev, { id: Date.now() + 1, text, sender: 'user', timestamp: new Date().toLocaleTimeString() }]); };

    const fetchStatus = async (id = farmerId) => {
        if (!id) { pushBotMessage("Error: No Farmer ID available. Type **REGISTER** or provide your ID."); return; }
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${id}/status`);
            const data = response.data;
            setFarmerStatus(data);

            const stages = data.stages || [];
            const isSeasonComplete = stages.every(s => s.status === 'COMPLETED');
            let nextHint = 'Type **STATUS** to refresh.';

            if (isSeasonComplete) {
                nextHint = `🎉 Season ${data.season_number} complete! Type **RENEW** to start the next loan cycle.`;
            } else {
                const currentStage = stages.find(s => s.status !== 'COMPLETED');
                if (currentStage) {
                    if (currentStage.status === 'UNLOCKED') nextHint = `Type **UPLOAD** to submit ${stageFileHints[currentStage.stage_number] || 'the required file'}.`;
                    else if (currentStage.status === 'PENDING') nextHint = `Stage ${currentStage.stage_number} is PENDING approval.`;
                    else if (currentStage.status === 'APPROVED') nextHint = `Stage ${currentStage.stage_number} approved — awaiting disbursement.`;
                }
            }
            
            const totalDisbursed = data.current_status?.total_disbursed;
            let statusMessage = `✅ **Status for ${data.name} (ID: ${id}) - Season ${data.season_number}**\n\n`;
            statusMessage += `💰 **Total Disbursed (This Season):** $${totalDisbursed ? totalDisbursed.toFixed(2) : '0.00'}\n`;
            if (data.has_insurance) {
                statusMessage += `🌤️ **Insurance Policy:** Active | Claim status: ${data.insurance_claim_status || 'UNKNOWN'}\n\n`;
            } else {
                statusMessage += `🌤️ **Insurance Policy:** Not yet activated.\n\n`;
            }
            statusMessage += `📋 Stages:\n`;
            stages.forEach(s => { statusMessage += `${s.stage_name} — ${s.status}\n`; });
            statusMessage += `\n➡️ ${nextHint}\n\nType **UPLOAD**, **IOT** or **HELP**.`;

            setChatState('AWAITING_ACTION');
            pushBotMessage(statusMessage);
        } catch (error) {
            setChatState('AWAITING_COMMAND');
            pushBotMessage(`❌ Error fetching status for ID ${id}. Farmer not found.`);
        }
    };

    const handleRegistrationSteps = async (inputText) => {
        let nextState = chatState, botMessage = '', currentData = { ...registrationData };
        if (chatState === 'REG_AWAITING_NAME') { currentData.name = inputText; nextState = 'REG_AWAITING_PHONE'; botMessage = "Enter your **Phone Number** (e.g., +27 72 XXX XXXXX)."; }
        else if (chatState === 'REG_AWAITING_PHONE') { currentData.phone = inputText; nextState = 'REG_AWAITING_AGE'; botMessage = "Enter your **Age** (e.g., 35)."; }
        else if (chatState === 'REG_AWAITING_AGE') { currentData.age = parseInt(inputText); nextState = 'REG_AWAITING_GENDER'; botMessage = "What is your **Gender**?"; }
        else if (chatState === 'REG_AWAITING_GENDER') { currentData.gender = inputText; nextState = 'REG_AWAITING_ID'; botMessage = "Enter your **ID Document** number."; }
        else if (chatState === 'REG_AWAITING_ID') { currentData.id_document = inputText; nextState = 'REG_AWAITING_CROP'; botMessage = "Which **Crop** will you grow? (e.g., Maize)."; }
        else if (chatState === 'REG_AWAITING_CROP') { currentData.crop = inputText; nextState = 'REG_AWAITING_LAND_SIZE'; botMessage = "What's your **Land Size** in hectares (e.g., 2.5)?"; }
        else if (chatState === 'REG_AWAITING_LAND_SIZE') {
            currentData.land_size = parseFloat(inputText); nextState = 'AWAITING_ACTION';
            try {
                const response = await axios.post(`${API_BASE_URL}/api/farmer/register`, currentData);
                const newFarmerId = response.data.farmer_id;
                setFarmerId(newFarmerId);
                pushBotMessage(`✅ Registration complete! Your Farmer ID is **${newFarmerId}**. Type **STATUS** to check your loan progress.`);
                await fetchStatus(newFarmerId);
            } catch (error) { pushBotMessage(`❌ Registration failed: ${error.response?.data?.message || error.message}`); setChatState('AWAITING_COMMAND'); }
        }
        setRegistrationData(currentData); setChatState(nextState); if (botMessage) pushBotMessage(botMessage);
    };

    const handleFileUpload = async (fileInput) => {
        setShowUploadInput(false);
        if (!fileInput || fileInput.trim().toUpperCase() === 'CANCEL') { pushBotMessage("Upload cancelled."); return; }
        const nextStage = farmerStatus?.stages?.find(s => s.status === 'UNLOCKED');
        if (!nextStage) { pushBotMessage("No unlocked stage found; upload aborted."); return; }
        try {
            await axios.post(`${API_BASE_URL}/api/farmer/${farmerId}/upload`, { stage_number: nextStage.stage_number, file_type: 'pdf', file_name: fileInput });
            pushBotMessage(`✅ Upload successful. Awaiting Field Officer approval.`);
            await fetchStatus();
        } catch (error) { pushBotMessage(`❌ Upload failed: ${error.response?.data?.message || error.message}`); }
    };

    const handleIotData = async (dataInput) => {
        setShowIoTInput(false);
        if (!dataInput || dataInput.trim().toUpperCase() === 'CANCEL') { pushBotMessage("IoT upload cancelled."); return; }
        const parsed = {};
        try { dataInput.split(',').forEach(part => { const [k, v] = part.split(':').map(s => s?.trim()); if (k && v) parsed[k] = Number(v); }); } catch (err) { console.warn('IoT parse error', err); }
        try {
            const resp = await axios.post(`${API_BASE_URL}/api/iot/ingest?farmer_id=${farmerId}`, parsed);
            if (resp.data.drought_flag) { pushBotMessage(`💧 Drought risk detected. Insurance claim filed.`); }
            else { pushBotMessage(`✅ Moisture levels appear normal.`); }
            await fetchStatus();
        } catch (err) { pushBotMessage("⚠️ IoT upload failed."); }
    };

    const handleRenew = async (id) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${id}/renew`);
            pushBotMessage(`✅ ${response.data.message}`);
            await fetchStatus(id);
        } catch (error) { pushBotMessage(`❌ Renewal failed: ${error.response?.data?.message || error.message}`); }
        setChatState('AWAITING_COMMAND');
    };

    const handleInput = async (e) => {
        e.preventDefault();
        const userText = input.trim();
        if (!userText) return;
        const command = userText.toUpperCase();
        pushUserMessage(userText); setInput('');
        if (showUploadInput) { await handleFileUpload(userText); return; }
        if (showIoTInput) { await handleIotData(userText); return; }
        if (chatState.startsWith('REG_')) { await handleRegistrationSteps(userText); return; }
        if (chatState === 'AWAITING_FARMER_ID') {
            const inputId = parseInt(userText);
            if (!isNaN(inputId) && inputId > 0) { setFarmerId(inputId); setChatState('AWAITING_ACTION'); await fetchStatus(inputId); }
            else { pushBotMessage("Invalid Farmer ID."); }
            return;
        }
        if (chatState === 'AWAITING_RENEW_ID') {
            const inputId = parseInt(userText);
            if (!isNaN(inputId) && inputId > 0) { setFarmerId(inputId); await handleRenew(inputId); }
            else { pushBotMessage("Invalid Farmer ID. Renewal cancelled."); setChatState('AWAITING_COMMAND'); }
            return;
        }
        switch (command) {
            case 'RESET': setChatState('AWAITING_COMMAND'); setFarmerId(null); pushBotMessage("Chat reset. Type **REGISTER** or **STATUS**."); break;
            case 'STATUS': if (!farmerId) { setChatState('AWAITING_FARMER_ID'); pushBotMessage("Please enter your **Farmer ID**."); } else { await fetchStatus(farmerId); } break;
            case 'REGISTER': setChatState('REG_AWAITING_NAME'); pushBotMessage("To register, enter your **Full Name**."); break;
            case 'RENEW': setChatState('AWAITING_RENEW_ID'); pushBotMessage("Enter the **Farmer ID** for the loan to renew."); break;
            case 'HELP': pushBotMessage("Commands:\n• **REGISTER**: New user.\n• **STATUS**: Check loan progress.\n• **UPLOAD**: Submit a document.\n• **IOT**: Submit sensor data.\n• **RENEW**: Start a new loan cycle.\n• **RESET**: Clear session."); break;
            case 'UPLOAD': if (!farmerId) pushBotMessage("Use **STATUS** first."); else { setShowUploadInput(true); pushBotMessage("Type the filename to mock-upload or **CANCEL**."); } break;
            case 'IOT': if (!farmerId) pushBotMessage("Use **STATUS** first."); else { setShowIoTInput(true); pushBotMessage("Type sensor readings (e.g. `moisture:12`) or **CANCEL**."); } break;
            default: pushBotMessage("Unknown command. Type **HELP**.");
        }
    };

    useEffect(() => { pushBotMessage("Welcome! Type **REGISTER** to sign up, **STATUS** with an ID, or **RENEW** to start a new loan cycle. Type **HELP** for commands."); }, []);

    return (
        <div className="chatbot-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <p><b>Whatsapp Farmer Chatbot Mock-up</b></p>
            <div className="chat-window">
                {messages.map((msg) => (
                    <div key={msg.id} className={`message-row ${msg.sender}`}>
                        <div className="message-bubble" dangerouslySetInnerHTML={{ __html: String(msg.text).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>') }} />
                        <span className="timestamp">{msg.timestamp}</span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-form" onSubmit={handleInput}>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a command..." />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

const FaqDashboard = ({ setView }) => (
    <div className="dashboard-list-container">
        <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
        <h2>Tester FAQ & System Context</h2>
        <FaqSection /> 
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ccc' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <strong style={{ marginRight: '10px' }}>Project Links:</strong>
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginRight: '20px' }}>
                    <img src={GITHUB_LOGO_SRC} alt="GitHub Repo" style={{ height: '24px', width: '24px', marginRight: '5px' }} />
                </a>
                <a href={README_URL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
                    View README.md
                </a>
            </div>
            <h3 style={{ marginBottom: '10px' }}>Demo Presentation</h3>
            <div className="video-container" style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '800px' }}>                
                <iframe src="https://www.youtube.com/embed/YuhYOpxBxNA?si=NNaVIIFV53z5p0P0" title="Demo Presentation Video" frameBorder="0" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></iframe>
            </div>
        </div>
    </div>
);

const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyFarmer, setHistoryFarmer] = useState(null);
    const [farmerHistory, setFarmerHistory] = useState([]);

    const fetchFarmers = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/admin/farmers`); setFarmers(res.data); } catch (e) { console.error(e); } };
    const fetchKpis = async () => { try { const { data } = await axios.get(`${API_BASE_URL}/api/lender/kpis`); setKpis([ { label: 'Total Loans Disbursed', value: data.total_loans_disbursed }, { label: 'Total Value of Loans', value: `$${data.total_value_disbursed.toFixed(2)}` }, { label: 'Total Defaults', value: data.total_defaults }, { label: 'Default Ratio', value: `${data.default_ratio.toFixed(2)}%` } ]); } catch (e) { console.error(e); } };
    const fetchFarmerDetails = async (id, seasonId = null) => {
        try {
            const url = seasonId ? `${API_BASE_URL}/api/farmer/${id}/status?season_id=${seasonId}` : `${API_BASE_URL}/api/farmer/${id}/status`;
            const response = await axios.get(url);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) { console.error("Error fetching farmer details:", error); }
    };
    const handleShowHistory = async (farmer) => {
        setHistoryFarmer(farmer);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${farmer.id}/seasons`);
            setFarmerHistory(response.data.reverse());
            setShowHistoryModal(true);
        } catch (error) { console.error("Error fetching farmer seasons:", error); }
    };
    const handleDisburse = async (stageNumber) => {
        if (!farmerData) return;
        try {
            await axios.post(`${API_BASE_URL}/api/lender/disburse/${selectedFarmerId}/${stageNumber}`);
            await fetchFarmerDetails(selectedFarmerId);
            await fetchFarmers(); await fetchKpis();
        } catch (error) { alert(error.response?.data?.message || "Disbursement failed."); }
    };

    useEffect(() => { fetchFarmers(); fetchKpis(); }, []);

    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Lender/Admin Dashboard</h2>
                <KpiGrid kpis={kpis} />
                <h3 style={{marginTop: '30px'}}>Farmer Portfolio</h3>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className={`farmer-card ${farmer?.stages?.some(s => s.status === 'APPROVED') ? 'bleep' : ''}`}>
                        <div>
                            <strong>{farmer.name} (ID: {farmer.id}) - Season {farmer.current_season_number}</strong><br/>
                            <span>Stages Completed: {farmer.stages_completed} | Score: {farmer.score}</span>
                        </div>
                        <div>
                            {farmer.season_count > 1 && (<button className="btn-back" onClick={() => handleShowHistory(farmer)}>History</button>)}
                            <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Progress</button>
                            <a href={`${API_BASE_URL}/api/report/farmer/${farmer.id}`} target="_blank" rel="noopener noreferrer">
                                <button className="btn-report">Report</button>
                            </a>
                        </div>
                    </div>
                ))}
                <Modal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Season History for ${historyFarmer?.name}`}>
                    {farmerHistory.map(season => (
                        <div key={season.id} className="farmer-card">
                            <span><strong>Season {season.season_number}</strong> ({season.status})</span>
                            <button className="btn-view" onClick={() => { fetchFarmerDetails(historyFarmer.id, season.id); setShowHistoryModal(false); }}>View</button>
                        </div>
                    ))}
                </Modal>
            </div>
        );
    }
    
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
            <h2>{farmerData.name}'s Financing Tracker</h2>
            <FarmerDetailsCard farmer={farmerData} seasonNumber={farmerData.season_number} score={farmerData.current_status.score} risk={farmerData.current_status.risk_band} xaiFactors={farmerData.current_status.xai_factors || []} contractHash={farmerData.contract_hash} contractState={farmerData.contract_state} stages={farmerData.stages} contractHistory={farmerData.contract_history || []} />
            {farmerData.stages.some(s => s.status === 'APPROVED') && (
                <>
                    <h4>Disbursement Actions</h4>
                    {farmerData.stages.map(stage => (
                        stage.status === 'APPROVED' && (
                            <div key={stage.stage_number} className={`stage-item stage-approved`}>
                                <span className="stage-name">{stage.stage_name}</span>
                                <button className="btn-lender" onClick={() => handleDisburse(stage.stage_number)}>Disburse</button>
                            </div>
                        )
                    ))}
                </>
            )}
        </div>
    );
};

const FieldOfficerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyFarmer, setHistoryFarmer] = useState(null);
    const [farmerHistory, setFarmerHistory] = useState([]);

    const fetchFarmers = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/admin/farmers`); setFarmers(res.data); } catch (e) { console.error(e); } };
    const fetchKpis = async () => { try { const { data } = await axios.get(`${API_BASE_URL}/api/field-officer/kpis`); setKpis(data); } catch (e) { console.error(e); } };
    const fetchFarmerDetails = async (id, seasonId = null) => {
        try {
            const url = seasonId ? `${API_BASE_URL}/api/farmer/${id}/status?season_id=${seasonId}` : `${API_BASE_URL}/api/farmer/${id}/status`;
            const response = await axios.get(url);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) { console.error("Error fetching farmer details:", error); }
    };
    const handleShowHistory = async (farmer) => {
        setHistoryFarmer(farmer);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${farmer.id}/seasons`);
            setFarmerHistory(response.data.reverse());
            setShowHistoryModal(true);
        } catch (error) { console.error("Error fetching farmer seasons:", error); }
    };
    const handleApprove = async (stageNumber) => {
        if (!farmerData) return;
        try {
            await axios.post(`${API_BASE_URL}/api/field-officer/approve/${selectedFarmerId}/${stageNumber}`);
            await fetchFarmerDetails(selectedFarmerId);
            await fetchFarmers(); await fetchKpis();
        } catch (error) { alert(error.response?.data?.message || "Approval failed."); }
    };
    const handlePestTrigger = async () => {
        if (!farmerData) return;
        try {
            await axios.post(`${API_BASE_URL}/api/field-officer/trigger_pest/${selectedFarmerId}`);
            await fetchFarmerDetails(selectedFarmerId);
        } catch (error) { alert(error.response?.data?.message || "Trigger failed."); }
    };

    useEffect(() => { fetchFarmers(); fetchKpis(); }, []);

    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Field Officer Dashboard</h2>
                <KpiGrid kpis={kpis ? [{ label: 'Total Farmers', value: kpis.num_farmers }, { label: 'Pending Approvals', value: kpis.pending_approvals }] : []} />
                <BarChart title="Current Farmer Stage Distribution" data={kpis?.stage_chart_base64} />
                <h3 style={{marginTop: '30px'}}>Farmer List</h3>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className={`farmer-card ${farmer?.stages?.some(s => s.status === 'PENDING') ? 'bleep' : ''}`}>
                        <div>
                            <strong>{farmer.name} (ID: {farmer.id}) - Season {farmer.current_season_number}</strong><br/>
                            <span>Stages Completed: {farmer.stages_completed} | Score: {farmer.score}</span>
                        </div>
                        <div>
                            {farmer.season_count > 1 && (<button className="btn-back" onClick={() => handleShowHistory(farmer)}>History</button>)}
                            <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Stages</button>
                        </div>
                    </div>
                ))}
                <Modal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Season History for ${historyFarmer?.name}`}>
                    {farmerHistory.map(season => (
                        <div key={season.id} className="farmer-card">
                            <span><strong>Season {season.season_number}</strong> ({season.status})</span>
                            <button className="btn-view" onClick={() => { fetchFarmerDetails(historyFarmer.id, season.id); setShowHistoryModal(false); }}>View</button>
                        </div>
                    ))}
                </Modal>
            </div>
        );
    }
    
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
            <h2>{farmerData.name}'s Stage Approvals - Season {farmerData.season_number}</h2>
            <div style={{ margin: '15px 0', padding: '10px', border: '1px solid #dc3545', borderRadius: '5px' }}>
                <button className="btn-insurer" onClick={handlePestTrigger}>Trigger Pest Event (Unlock Stage 5)</button>
            </div>
            <h4>Milestone Checkpoints</h4>
            {farmerData.stages.map(stage => (
                <div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                    <span className="stage-name">{stage.stage_name}</span>
                    <span style={{ fontWeight: 'bold' }}>{stage.status}</span>
                    {stage.status === 'PENDING' && ( <button className="btn-approve" onClick={() => handleApprove(stage.stage_number)}>Approve</button> )}
                </div>
            ))}
        </div>
    );
};

const InsurerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyFarmer, setHistoryFarmer] = useState(null);
    const [farmerHistory, setFarmerHistory] = useState([]);

    const fetchInsurerFarmers = async () => { try { const res = await axios.get(`${API_BASE_URL}/api/insurer/farmers`); setFarmers(res.data); } catch (e) { console.error(e); } };
    const fetchKpis = async () => { try { const { data } = await axios.get(`${API_BASE_URL}/api/insurer/kpis`); setKpis([ { label: 'Total Policies', value: data.total_policies }, { label: 'Total Premiums', value: `$${data.total_value_policies.toFixed(2)}` }, { label: 'Total Claims', value: data.total_claims }, { label: 'Loss Ratio', value: `${data.claims_loss_ratio.toFixed(2)}%` } ]); } catch (e) { console.error(e); } };
    const fetchFarmerDetails = async (id, seasonId = null) => {
        try {
            const url = seasonId ? `${API_BASE_URL}/api/farmer/${id}/status?season_id=${seasonId}` : `${API_BASE_URL}/api/farmer/${id}/status`;
            const response = await axios.get(url);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) { console.error("Error fetching farmer details:", error); }
    };
    const handleShowHistory = async (farmer) => {
        setHistoryFarmer(farmer);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${farmer.id}/seasons`);
            setFarmerHistory(response.data.reverse());
            setShowHistoryModal(true);
        } catch (error) { console.error("Error fetching farmer seasons:", error); }
    };
    const handleReview = async (action) => {
        if (!selectedFarmerId) return;
        try {
            const res = await axios.post(`${API_BASE_URL}/api/insurance/${selectedFarmerId}/review`, { action });
            alert(res.data.message);
            await fetchFarmerDetails(selectedFarmerId);
            await fetchInsurerFarmers(); await fetchKpis();
        } catch (err) { alert(err.response?.data?.message || 'Review failed'); }
    };

    useEffect(() => { fetchInsurerFarmers(); fetchKpis(); }, []);

    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Insurer Dashboard</h2>
                <KpiGrid kpis={kpis} />
                <h3 style={{marginTop: '30px'}}>Policy Holder List</h3>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className={`farmer-card ${farmer.policy_status === 'CLAIM_PENDING' ? 'bleep' : ''}`}>
                        <div>
                            <strong>{farmer.name} (ID: {farmer.id}) - Season {farmer.current_season_number}</strong><br />
                            <span>Policy Status: {farmer.policy_status} | Score: {farmer.score}</span>
                        </div>
                        <div>
                            {farmer.season_count > 1 && (<button className="btn-back" onClick={() => handleShowHistory(farmer)}>History</button>)}
                            <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Policy</button>
                        </div>
                    </div>
                ))}
                <Modal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Season History for ${historyFarmer?.name}`}>
                    {farmerHistory.map(season => (
                        <div key={season.id} className="farmer-card">
                            <span><strong>Season {season.season_number}</strong> ({season.status})</span>
                            <button className="btn-view" onClick={() => { fetchFarmerDetails(historyFarmer.id, season.id); setShowHistoryModal(false); }}>View</button>
                        </div>
                    ))}
                </Modal>
            </div>
        );
    }
    
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchInsurerFarmers(); }}>← Back to List</button>
            <h2>Insurer Dashboard for {farmerData.name} - Season {farmerData.season_number}</h2>
            {farmerData.insurance_claim_status === 'CLAIM_PENDING' && (
                <div style={{ margin: '20px 0', padding: '10px', border: '1px solid #ffc107', borderRadius: '5px' }}>
                    <h4>Claim Review Required</h4>
                    <button className="btn-approve" onClick={() => handleReview('APPROVE')}>Approve Claim</button>
                    <button className="btn-insurer" onClick={() => handleReview('REJECT')}>Reject Claim</button>
                </div>
            )}
            <InsurerDetailsCard farmer={farmerData} seasonNumber={farmerData.season_number} score={farmerData.current_status.score} risk={farmerData.current_status.risk_band} xaiFactors={farmerData.current_status.xai_factors || []} contractState={farmerData.contract_state} stages={farmerData.stages} />
        </div>
    );
};

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
            <button className="btn-faq-role" onClick={() => setView('faq')}>ⓘ Tester FAQ & Context</button>
        </div> 
        <p className="disclaimer">For Demonstration Only. Powered by <a href="https://esusfarm.africa/home" target="_blank" rel="noopener noreferrer">eSusFarm Africa.</a></p>
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
            {view === 'faq' && <FaqDashboard setView={setView} />}
        </div>
    );
};

export default App;
