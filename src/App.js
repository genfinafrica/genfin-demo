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

// *** MODIFIED: FarmerDetailsCard now indicates the season number ***
const FarmerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages, contractHistory, seasonNumber }) => {
    const [showXaiModal, setShowXaiModal] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);

    const totalDisbursed = stages.filter(s => s.status === 'COMPLETED')
                                 .reduce((sum, s) => sum + s.disbursement_amount, 0);

    const reversedStages = [...stages].reverse();

    return (
        <div className="tracker-box">
            {/* *** NEW: Title now includes the season number *** */}
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

            <Modal show={showContractModal} onClose={() => setShowContractModal(false)} title={`Smart Contract Audit Trail - Season ${seasonNumber}`}>
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

const InsurerDetailsCard = ({ farmer, score, risk, xaiFactors, contractHash, contractState, stages, seasonNumber }) => {
    const [showXaiModal, setShowXaiModal] = useState(false);

    const INSURER_XAI_FACTORS = ["Base Score", "Stages Completed Ratio", "Land Size (Acres)", "Soil Quality Score (Mock)"];
    const filteredXaiFactors = xaiFactors.filter(factor => INSURER_XAI_FACTORS.includes(factor.factor));

    return (
        <div className="tracker-box">
             {/* *** NEW: Title now includes the season number *** */}
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
                <div
                    key={stage.stage_number}
                    className={`stage-item stage-${stage.status.toLowerCase()}`}
                >
                    <span className="stage-name">{stage.stage_name}</span>
                    <span style={{ fontWeight: 'bold' }}>{stage.status}</span>
                </div>
            ))}

            <Modal show={showXaiModal} onClose={() => setShowXaiModal(false)} title={`AI Proficiency Score (XAI) - Insurer View - Season ${seasonNumber}`}>
                <p><strong>Score: {score}</strong> | Risk Band: {risk}</p>
                <p>Explanation of the current score based on factors relevant to insurance underwriting:</p>
                <table>
                    <thead>
                        <tr>
                            <th>Factor</th>
                            <th>Contribution (Mock)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredXaiFactors.map((f, index) => (
                            <tr key={index}>
                                <td>{f.factor}</td>
                                <td>+{f.weight.toFixed(1)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="disclaimer">Note: Factors have been filtered to show only information relevant to insurance underwriting and risk mitigation, per data governance policy.</p>
            </Modal>
        </div>
    );
};

// --- FAQ SECTION COMPONENT (No changes needed) ---
const FaqSection = () => { /* ... No changes ... */ return ( <div/> ); };


// --------- *** MODIFIED: FarmerChatbotMock with RENEW logic *** ---------
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
        1: 'Soil test (CSV)', 2: 'Input supplier invoice (PDF / JPG)', 3: 'Insurance: premium receipt (PDF / JPG)',
        4: 'Weeding photo (JPG / PNG)', 5: 'Pest photo (JPG) or type NO PEST', 6: 'Packaging photo (JPG / PNG)',
        7: 'Transport/Delivery note (PDF / JPG)',
    };
    
    // ... (formatBotMessage and scrollToBottom utilities are unchanged) ...
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);
    const pushBotMessage = (text) => { setMessages(prev => [...prev, { id: Date.now(), text: text, sender: 'bot', timestamp: new Date().toLocaleTimeString() }]); };
    const pushUserMessage = (text) => { setMessages(prev => [...prev, { id: Date.now() + 1, text: text, sender: 'user', timestamp: new Date().toLocaleTimeString() }]); };

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
            const isSeasonComplete = stages.every(s => s.status === 'COMPLETED');

            let nextHint = 'Type **STATUS** to refresh.';
            if (isSeasonComplete) {
                // *** NEW: Hint for renewal if all stages are complete ***
                nextHint = `🎉 Season ${data.season_number} complete! Type **RENEW** to start the next loan cycle.`;
            } else {
                const currentStage = stages.find(s => s.status !== 'COMPLETED');
                if (currentStage) {
                    if (currentStage.status === 'UNLOCKED') nextHint = `Current stage unlocked: upload required. Type **UPLOAD** to submit ${stageFileHints[currentStage.stage_number] || 'the required file'}.`;
                    else if (currentStage.status === 'PENDING') nextHint = `Stage ${currentStage.stage_number} is PENDING approval by the Field Officer.`;
                    else if (currentStage.status === 'APPROVED') nextHint = `Stage ${currentStage.stage_number} approved — awaiting lender disbursement.`;
                }
            }
            
            const totalDisbursed = data.current_status?.total_disbursed;
            // *** MODIFIED: Status message now shows the season number ***
            let statusMessage = `✅ **Status for ${data.name} (ID: ${id}) - Season ${data.season_number}**\n\n`;
            statusMessage += `💰 **Total Disbursed (This Season):** $${totalDisbursed ? totalDisbursed.toFixed(2) : '0.00'}\n`;
            
            if (data.has_insurance) {
                const claimStatus = data.insurance_claim_status || 'UNKNOWN';
                statusMessage += `🌤️ **Insurance Policy:** Active | Claim status: ${claimStatus}\n\n`;
            } else {
                statusMessage += `🌤️ **Insurance Policy:** Not yet activated.\n\n`;
            }
            
            statusMessage += `📋 Stages:\n`;
            stages.forEach(s => {
                statusMessage += `${s.stage_name} — ${s.status}\n`;            
            });
            statusMessage += `\n➡️ ${nextHint}\n\nType **UPLOAD**, **IOT** or **HELP**.`;

            setChatState('AWAITING_ACTION');
            pushBotMessage(statusMessage);

        } catch (error) {
            setChatState('AWAITING_COMMAND');
            pushBotMessage(`❌ Error fetching status for ID ${id}. Farmer ID not found or backend issue.`);
        }
    };
    
    // ... (handleRegistrationSteps, initiateUpload, handleFileUpload, etc. are unchanged) ...
    const handleRegistrationSteps = async (inputText) => { /* ... No changes ... */ };
    const initiateUpload = async () => { /* ... No changes ... */ };
    const handleFileUpload = async (fileInput) => { /* ... No changes ... */ };
    const initiateIoTPrompt = async () => { /* ... No changes ... */ };
    const handleIotData = async (dataInput) => { /* ... No changes ... */ };
    const handlePestTrigger = async () => { /* ... No changes ... */ };


    // *** NEW: Function to handle the renewal process ***
    const handleRenew = async (id) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/farmer/${id}/renew`);
            pushBotMessage(`✅ ${response.data.message}`);
            // Fetch status again to show the new season's details
            await fetchStatus(id);
        } catch (error) {
            pushBotMessage(`❌ Renewal failed: ${error.response?.data?.message || error.message}`);
        }
        setChatState('AWAITING_COMMAND');
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
            } else { pushBotMessage("Invalid Farmer ID."); }
            return;
        }
        // *** NEW: State to handle renewal ID input ***
        if (chatState === 'AWAITING_RENEW_ID') {
            const inputId = parseInt(userText);
            if (!isNaN(inputId) && inputId > 0) {
                setFarmerId(inputId);
                await handleRenew(inputId);
            } else { 
                pushBotMessage("Invalid Farmer ID. Renewal cancelled.");
                setChatState('AWAITING_COMMAND');
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
            // *** NEW: RENEW command ***
            case 'RENEW':
                setChatState('AWAITING_RENEW_ID');
                pushBotMessage("Please enter the **Farmer ID** for the loan you wish to renew.");
                break;
            case 'HELP':
                // *** MODIFIED: Help text updated with RENEW command ***
                pushBotMessage("Hello! I am your GENFIN 🌱 Africa Financing Assistant. Your main commands are:\n• **REGISTER**: Sign up as a new farmer.\n• **STATUS**: Check your current loan progress.\n• **UPLOAD**: Submit a document for the current stage.\n• **IOT**: Submit farm sensor data.\n• **RENEW**: Once a season is complete, use this to start a new loan cycle.\n• **RESET**: Clear your session and start over.");
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
        pushBotMessage("Welcome to the GENFIN 🌱 demo. Type **REGISTER** to sign up, **STATUS** if you have a Farmer ID, or **RENEW** to start a new loan cycle. Type **HELP** for more info.");
    }, []);

    return (
        <div className="chatbot-container">
            {/* ... (Chatbot JSX structure is unchanged) ... */ }
        </div>
    );
};

const FaqDashboard = ({ setView }) => ( /* ... No changes ... */ <div/> );
                

// --- ADMIN/LENDER DASHBOARD (*** MODIFIED with History/Archive functionality ***) ---
const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // *** NEW: State for season history modal ***
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyFarmer, setHistoryFarmer] = useState(null);
    const [farmerHistory, setFarmerHistory] = useState([]);

    const fetchFarmers = async () => { /* ... Unchanged ... */ };
    const fetchKpis = async () => { /* ... Unchanged ... */ };
    
    // *** MODIFIED: fetchFarmerDetails can now fetch a specific season ***
    const fetchFarmerDetails = async (id, seasonId = null) => {
        try {
            const url = seasonId 
                ? `${API_BASE_URL}/api/farmer/${id}/status?season_id=${seasonId}`
                : `${API_BASE_URL}/api/farmer/${id}/status`;
            const response = await axios.get(url);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) {
            console.error("Error fetching farmer details:", error);
        }
    };

    // *** NEW: Handler to open and populate the history modal ***
    const handleShowHistory = async (farmer) => {
        setHistoryFarmer(farmer);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${farmer.id}/seasons`);
            setFarmerHistory(response.data.reverse()); // Show latest first
            setShowHistoryModal(true);
        } catch (error) {
            console.error("Error fetching farmer seasons:", error);
            alert("Could not load farmer history.");
        }
    };
    
    const needsAction = (farmer) => farmer?.stages?.some(stage => ['APPROVED'].includes(stage.status));
    
    const handleDisburse = async (stageNumber) => { /* ... Unchanged ... */ };

    useEffect(() => {
        fetchFarmers();
        fetchKpis();
    }, []);

    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Lender/Admin Dashboard</h2>
                <KpiGrid kpis={kpis} />
                <h3 style={{marginTop: '30px'}}>Farmer Portfolio</h3>
                <p>Select a farmer to view progress and disburse funds.</p>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className={`farmer-card ${needsAction(farmer) ? 'bleep' : ''}`}>
                        <div>
                            {/* *** MODIFIED: Display current season number *** */}
                            <strong>{farmer.name} (ID: {farmer.id}) - Season {farmer.current_season_number}</strong><br/>
                            <span>Completed Stages: {farmer.stages_completed} | Score: {farmer.score}</span>
                        </div>
                        <div>
                            {/* *** NEW: History/Archive button *** */}
                            {farmer.season_count > 1 && (
                                <button className="btn-back" onClick={() => handleShowHistory(farmer)}>History</button>
                            )}
                            <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Progress</button>
                            <a href={`${API_BASE_URL}/api/report/farmer/${farmer.id}`} target="_blank" rel="noopener noreferrer">
                                <button className="btn-report">Download Report</button>
                            </a>
                        </div>
                    </div>
                ))}
                {/* *** NEW: History Modal *** */}
                <Modal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Season History for ${historyFarmer?.name}`}>
                    {farmerHistory.map(season => (
                        <div key={season.id} className="farmer-card">
                            <span><strong>Season {season.season_number}</strong> ({season.status})</span>
                            <button className="btn-view" onClick={() => { fetchFarmerDetails(historyFarmer.id, season.id); setShowHistoryModal(false); }}>
                                View Details
                            </button>
                        </div>
                    ))}
                </Modal>
            </div>
        );
    }
    
    // This is the detailed view for a selected farmer (current or archived)
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
            <h2>{farmerData.name}'s Financing Tracker</h2>
            <FarmerDetailsCard 
                farmer={farmerData}
                seasonNumber={farmerData.season_number} // Pass season number
                score={farmerData.current_status.score}
                risk={farmerData.current_status.risk_band}
                xaiFactors={farmerData.current_status.xai_factors || []}
                contractHash={farmerData.contract_hash}
                contractState={farmerData.contract_state}
                stages={farmerData.stages}
                contractHistory={farmerData.contract_history || []}
            />
            {/* *** MODIFIED: Only show actions for the current season *** */}
            {farmerData.stages.some(s => s.status === 'APPROVED') && (
                <>
                    <h4>Disbursement Actions (Lender)</h4>
                    {farmerData.stages.map(stage => (
                        stage.status === 'APPROVED' && (
                            <div key={stage.stage_number} className={`stage-item stage-${stage.status.toLowerCase()}`}>
                                <span className="stage-name">{stage.stage_name}</span>
                                <span className="stage-disbursement">${stage.disbursement_amount.toFixed(2)}</span>
                                <span style={{ fontWeight: 'bold' }}>{stage.status}</span>
                                <button className="btn-lender" onClick={() => handleDisburse(stage.stage_number)}>
                                    Disburse Funds
                                </button>
                            </div>
                        )
                    ))}
                </>
            )}
        </div>
    );
};

// --- FIELD OFFICER & INSURER DASHBOARDS (Also updated with History/Archive functionality) ---
// Note: The logic is very similar to the LenderDashboard modifications.

const FieldOfficerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // *** NEW: State for season history modal ***
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyFarmer, setHistoryFarmer] = useState(null);
    const [farmerHistory, setFarmerHistory] = useState([]);
    
    const fetchFarmers = async () => { /* ... Unchanged ... */ };
    const fetchKpis = async () => { /* ... Unchanged ... */ };

    // *** MODIFIED: fetchFarmerDetails can now fetch a specific season ***
    const fetchFarmerDetails = async (id, seasonId = null) => {
        try {
            const url = seasonId ? `${API_BASE_URL}/api/farmer/${id}/status?season_id=${seasonId}` : `${API_BASE_URL}/api/farmer/${id}/status`;
            const response = await axios.get(url);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) { console.error("Error fetching farmer details:", error); }
    };
    
    // *** NEW: Handler to open and populate the history modal ***
    const handleShowHistory = async (farmer) => {
        setHistoryFarmer(farmer);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${farmer.id}/seasons`);
            setFarmerHistory(response.data.reverse());
            setShowHistoryModal(true);
        } catch (error) { console.error("Error fetching farmer seasons:", error); }
    };

    const needsAction = (farmer) => farmer?.stages?.some(stage => ['PENDING'].includes(stage.status));
    const handleApprove = async (stageNumber) => { /* ... Unchanged ... */ };
    const handlePestTrigger = async () => { /* ... Unchanged ... */ };

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
                    <div key={farmer.id} className={`farmer-card ${needsAction(farmer) ? 'bleep' : ''}`}>
                        <div>
                             {/* *** MODIFIED: Display current season number *** */}
                            <strong>{farmer.name} (ID: {farmer.id}) - Season {farmer.current_season_number}</strong><br/>
                            <span>Completed Stages: {farmer.stages_completed} | Score: {farmer.score}</span>
                        </div>
                        <div>
                             {/* *** NEW: History/Archive button *** */}
                            {farmer.season_count > 1 && (
                                <button className="btn-back" onClick={() => handleShowHistory(farmer)}>History</button>
                            )}
                            <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Stages</button>
                        </div>
                    </div>
                ))}
                {/* *** NEW: History Modal *** */}
                <Modal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Season History for ${historyFarmer?.name}`}>
                    {farmerHistory.map(season => (
                        <div key={season.id} className="farmer-card">
                            <span><strong>Season {season.season_number}</strong> ({season.status})</span>
                            <button className="btn-view" onClick={() => { fetchFarmerDetails(historyFarmer.id, season.id); setShowHistoryModal(false); }}>
                                View Details
                            </button>
                        </div>
                    ))}
                </Modal>
            </div>
        );
    }
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchFarmers(); }}>← Back to List</button>
            {/* *** MODIFIED: Title indicates season number *** */}
            <h2>{farmerData.name}'s Stage Approvals - Season {farmerData.season_number}</h2>
            {/* ... (Rest of the detail view logic remains, but actions will only appear for current season stages) ... */}
        </div>
    );
};


const InsurerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmerId, setSelectedFarmerId] = useState(null);
    const [farmerData, setFarmerData] = useState(null);
    const [kpis, setKpis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // *** NEW: State for season history modal ***
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyFarmer, setHistoryFarmer] = useState(null);
    const [farmerHistory, setFarmerHistory] = useState([]);
    
    const fetchInsurerFarmers = async () => { /* ... Unchanged ... */ };
    const fetchKpis = async () => { /* ... Unchanged ... */ };

    // *** MODIFIED: fetchFarmerDetails can now fetch a specific season ***
    const fetchFarmerDetails = async (id, seasonId = null) => {
        try {
            const url = seasonId ? `${API_BASE_URL}/api/farmer/${id}/status?season_id=${seasonId}` : `${API_BASE_URL}/api/farmer/${id}/status`;
            const response = await axios.get(url);
            setFarmerData(response.data);
            setSelectedFarmerId(id);
        } catch (error) { console.error("Error fetching farmer details:", error); }
    };
    
    // *** NEW: Handler to open and populate the history modal ***
    const handleShowHistory = async (farmer) => {
        setHistoryFarmer(farmer);
        try {
            const response = await axios.get(`${API_BASE_URL}/api/farmer/${farmer.id}/seasons`);
            setFarmerHistory(response.data.reverse());
            setShowHistoryModal(true);
        } catch (error) { console.error("Error fetching farmer seasons:", error); }
    };

    const needsInsurerAction = (farmer) => farmer?.policy_status === 'CLAIM_PENDING';
    const handleReview = async (action) => { /* ... Unchanged ... */ };
    
    useEffect(() => { fetchInsurerFarmers(); fetchKpis(); }, []);
    
    if (!selectedFarmerId || !farmerData) {
        return (
            <div className="dashboard-list-container">
                <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
                <h2>Insurer Dashboard</h2>
                <KpiGrid kpis={kpis} />
                <h3 style={{marginTop: '30px'}}>Policy Holder List</h3>
                {farmers.map((farmer) => (
                    <div key={farmer.id} className={`farmer-card ${needsInsurerAction(farmer) ? 'bleep' : ''}`}>
                        <div>
                             {/* *** MODIFIED: Display current season number *** */}
                            <strong>{farmer.name} (ID: {farmer.id}) - Season {farmer.current_season_number}</strong><br />
                            <span>Policy Status: {farmer.policy_status} | Score: {farmer.score}</span>
                        </div>
                        <div>
                             {/* *** NEW: History/Archive button *** */}
                            {farmer.season_count > 1 && (
                                <button className="btn-back" onClick={() => handleShowHistory(farmer)}>History</button>
                            )}
                            <button className="btn-view" onClick={() => fetchFarmerDetails(farmer.id)}>View Policy</button>
                        </div>
                    </div>
                ))}
                {/* *** NEW: History Modal *** */}
                <Modal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Season History for ${historyFarmer?.name}`}>
                    {farmerHistory.map(season => (
                        <div key={season.id} className="farmer-card">
                            <span><strong>Season {season.season_number}</strong> ({season.status})</span>
                            <button className="btn-view" onClick={() => { fetchFarmerDetails(historyFarmer.id, season.id); setShowHistoryModal(false); }}>
                                View Details
                            </button>
                        </div>
                    ))}
                </Modal>
            </div>
        );
    }
    
    return (
        <div className="dashboard-list-container">
            <button className="btn-back" onClick={() => { setSelectedFarmerId(null); setFarmerData(null); fetchInsurerFarmers(); }}>← Back to List</button>
            {/* *** MODIFIED: Title indicates season number *** */}
            <h2>Insurer Dashboard for {farmerData.name} - Season {farmerData.season_number}</h2>
            <InsurerDetailsCard
                farmer={farmerData}
                seasonNumber={farmerData.season_number} // Pass season number
                score={farmerData.current_status.score}
                risk={farmerData.current_status.risk_band}
                xaiFactors={farmerData.current_status.xai_factors || []}
                contractHash={farmerData.contract_hash}
                contractState={farmerData.contract_state}
                stages={farmerData.stages}
            />
        </div>
    );
};
      

// --- WELCOME SCREEN (No changes needed) ---
const WelcomeScreen = ({ setView }) => ( /* ... No changes ... */ <div/> );

// --- MAIN APP COMPONENT (No changes needed) ---
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
