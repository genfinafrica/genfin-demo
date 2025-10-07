// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css'; // Assuming basic styles are in App.css

// Ensure this matches the URL where your Flask backend is running
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

// Mock Logo (Replace with your actual demo logo URL)
const LOGO_SRC = "https://via.placeholder.com/150x50.png?text=GENFIN-AFRICA+LOGO";

// --- Helper Components ---

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

const XAIView = ({ isOpen, onClose, xaiFactors }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Explainable AI (XAI) Factors">
            <p>The **Farmer Proficiency Score** is calculated based on these weighted factors:</p>
            <ul className="xai-factors-list">
                {xaiFactors.map((factor, index) => (
                    <li key={index} className={`xai-factor xai-factor-${factor.sign}`}>
                        <span>{factor.factor}</span>
                        <span className="xai-contribution">{factor.contribution}</span>
                    </li>
                ))}
            </ul>
            <p className="disclaimer">
                *This is a mock output illustrating an explainable AI model. Factors and weights are synthetic.
            </p>
        </Modal>
    );
};

const ContractView = ({ isOpen, onClose, contractHash, contractState, farmerId }) => {
    const [history, setHistory] = useState([]);

    // Mock history data (since real contract history isn't exposed via API for brevity)
    useEffect(() => {
        if (isOpen) {
            // Mock data reflecting backend states
            setHistory([
                { timestamp: new Date(Date.now() - 3600000).toLocaleString(), state: 'ACTIVE - Initial Funding Agreement', hash: '5b8a6328b...' },
                { timestamp: new Date(Date.now() - 2400000).toLocaleString(), state: `PENDING_STAGE_1`, hash: '9f6c7c8e...' },
                { timestamp: new Date(Date.now() - 1200000).toLocaleString(), state: `COMPLETED_STAGE_1`, hash: '2d4e92a1...' },
                { timestamp: new Date().toLocaleString(), state: contractState, hash: contractHash },
            ]);
        }
    }, [isOpen, contractHash, contractState]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Smart Contract (Mock) - Farmer ID: ${farmerId}`}>
            <p><strong>Current State:</strong> <span className="contract-state-active">{contractState}</span></p>
            <p><strong>Latest Hash:</strong> <code>{contractHash}</code></p>
            <h4 style={{marginTop: '15px'}}>Audit Trail Timeline (Last 5 Transitions):</h4>
            <div className="contract-timeline">
                {history.map((item, index) => (
                    <div key={index} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <p className="timeline-date">{item.timestamp}</p>
                        <p className="timeline-state"><strong>{item.state}</strong></p>
                        <p className="timeline-hash">Hash: <code>{item.hash.substring(0, 20)}...</code></p>
                    </div>
                ))}
            </div>
            <p className="disclaimer">
                *Each state change is recorded on a simulated distributed ledger and secured by a unique SHA-256 hash.
            </p>
        </Modal>
    );
};


// --- Stage Tracker Component (Central to Dashboards) ---

const StageTracker = ({ farmer, fetchStatus, role, handleAction, setPestTrigger }) => {
    const [showXAI, setShowXAI] = useState(false);
    const [showContract, setShowContract] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [isPestFlagTriggered, setIsPestFlagTriggered] = useState(farmer?.current_status?.pest_flag || false);

    useEffect(() => {
        // Reset message when farmer changes
        setActionMessage('');
        setIsPestFlagTriggered(farmer?.current_status?.pest_flag || false);
    }, [farmer]);

    const handleReportDownload = async (farmerId) => {
        try {
            setActionMessage('Generating PDF report...');
            const response = await axios.get(`${API_BASE_URL}/report/farmer/${farmerId}`, {
                responseType: 'blob', // Important for downloading files
            });

            // Create a temporary link and click it to trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `GENFIN_Report_Farmer_${farmerId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setActionMessage('✅ Report successfully downloaded!');
        } catch (error) {
            setActionMessage('❌ Error generating report. Check backend logs.');
            console.error('Report download error:', error);
        }
    };

    const handlePestFlag = async (farmerId) => {
        try {
            setActionMessage('Setting Pest Flag...');
            await setPestTrigger(farmerId); // Use the function passed from the Field Officer dashboard
            setIsPestFlagTriggered(true);
            setActionMessage('✅ Pest Event Mock Triggered! Conditional Stage 5 will unlock after Stage 4 completion.');
            fetchStatus();
        } catch (error) {
            setActionMessage('❌ Error triggering pest flag.');
            console.error('Pest Flag error:', error);
        }
    }

    const getStageClassName = (status) => {
        switch (status) {
            case 'COMPLETED': return 'stage-completed';
            case 'PENDING': return 'stage-pending';
            case 'APPROVED': return 'stage-approved';
            case 'UNLOCKED': return 'stage-unlocked';
            case 'LOCKED': return 'stage-locked';
            default: return '';
        }
    };

    const renderStageAction = (stage) => {
        const isCurrentStage = stage.stage_number === farmer?.current_status?.next_stage_number || stage.status === 'PENDING' || stage.status === 'APPROVED';

        // FIELD OFFICER ACTION (Approving PENDING stages)
        if (role === 'fieldOfficer' && stage.status === 'PENDING') {
            return (
                <button 
                    className="btn-action btn-approve" 
                    onClick={() => handleAction(farmer.season_id, stage.stage_number)}
                >
                    Approve Stage {stage.stage_number}
                </button>
            );
        }

        // LENDER ACTION (Disbursing APPROVED stages)
        if (role === 'lender' && stage.status === 'APPROVED') {
            return (
                <button 
                    className="btn-action btn-disburse" 
                    onClick={() => handleAction(farmer.season_id, stage.stage_number)}
                >
                    Disburse ${stage.disbursement_amount}
                </button>
            );
        }

        // ADDITIONAL FIELD OFFICER ACTION (Mock for conditional stage)
        if (role === 'fieldOfficer' && stage.stage_number === 4 && stage.status === 'COMPLETED' && !isPestFlagTriggered) {
             return (
                <button 
                    className="btn-action btn-pest-trigger" 
                    onClick={() => handlePestFlag(farmer.farmer_id)}
                >
                    Mock Trigger Pest Event
                </button>
            );
        }

        return <span className="stage-status-text">{stage.status}</span>;
    };

    const scoreColor = farmer.score >= 75 ? '#28a745' : (farmer.score >= 50 ? '#ffc107' : '#dc3545');

    return (
        <div className="stage-tracker">
            <h3>Financing Stage Tracker</h3>
            
            {/* FIXED: AI Score Accentuation */}
            <div className="ai-score-badge" style={{ borderColor: scoreColor }}>
                <span className="ai-label">AI Proficiency Score:</span>
                <span className="score-value" style={{ color: scoreColor }}>
                    {farmer.score}
                </span>
                <span className="risk-band">({farmer.riskBand} Risk)</span>
                <button className="btn-xai-view" onClick={() => setShowXAI(true)}>
                    View XAI
                </button>
            </div>
            
            <XAIView isOpen={showXAI} onClose={() => setShowXAI(false)} xaiFactors={farmer.xaiFactors || []} />
            <ContractView 
                isOpen={showContract} 
                onClose={() => setShowContract(false)} 
                contractHash={farmer.contractHash} 
                contractState={farmer.contractState}
                farmerId={farmer.farmer_id}
            />

            <div className="contract-status-bar" onClick={() => setShowContract(true)}>
                <span>Smart Contract Status: {farmer.contractState}</span>
                <span className="contract-hash-mock">Hash: {farmer.contractHash.substring(0, 10)}... (Click for Audit)</span>
            </div>
            
            {actionMessage && <p className="action-message">{actionMessage}</p>}

            {farmer.stages.map(stage => {
                // Find all documents uploaded for this stage
                const uploads = farmer.uploads.filter(u => u.stage_number === stage.stage_number);
                const uploadText = uploads.length > 0 ? 
                    `Evidence: ${uploads.map(u => u.file_name).join(', ')}` : 
                    `Mock Trigger Required: ${stage.status === 'UNLOCKED' ? 'Type UPLOAD' : 'N/A'}`;

                return (
                    <div key={stage.stage_number} className={`stage-item ${getStageClassName(stage.status)}`}>
                        <div className="stage-name">
                            {stage.stage_number}. {stage.stage_name}
                            <div className="stage-uploads">{uploadText}</div>
                        </div>
                        <div className="stage-info">
                            <span className="stage-disbursement">${stage.disbursement_amount}</span>
                            {renderStageAction(stage)}
                        </div>
                    </div>
                );
            })}

            {/* PDF Report Button */}
            <button 
                className="btn-export-pdf" 
                onClick={() => handleReportDownload(farmer.farmer_id)}
                disabled={role === 'farmer'} // Disable for Farmer view
            >
                Export PDF Impact Report 📄
            </button>
        </div>
    );
};


// --- Farmer Chatbot Mock ---

const FarmerChatbotMock = ({ setView }) => {
    const [farmerId, setFarmerId] = useState(1); // Default to Farmer ID 1
    const [status, setStatus] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const addMessage = (sender, text) => {
        setMessages(prev => [...prev, { sender, text, timestamp: new Date().toLocaleTimeString() }]);
    };

    const fetchStatus = async () => {
        if (!farmerId) return;
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/farmer/${farmerId}/status`);
            const data = response.data;
            setStatus(data);
            return data;
        } catch (error) {
            addMessage('System', '❌ Error fetching status. Ensure farmer ID is correct and the backend is running.');
            console.error('Status fetch error:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const greet = (data) => {
        const nextStage = data?.current_status?.next_stage_name || 'All Stages Complete';
        addMessage('System', `Welcome to GENFIN-AFRICA Chatbot, **${data.farmer.name}**!`);
        addMessage('System', `Your financing is currently: **${nextStage}**.`);
        addMessage('System', "To proceed, please type one of the following commands: **STATUS**, **UPLOAD <Stage No>**, or **TRIGGER <Stage No>**.");
    };

    useEffect(() => {
        // Initial setup and greeting
        addMessage('System', "👋 Please enter your Farmer ID (e.g., 1, 2, 3) to begin:");
    }, []);

    useEffect(() => {
        scrollToBottom();
        if (status) {
            // Re-render the stage tracker whenever status changes
        }
    }, [messages, status]);


    const handleTrigger = async (stageNumber) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/farmer/${farmerId}/trigger`, {
                stage_number: stageNumber,
                trigger_type: 'mock_chat_trigger'
            });
            addMessage('System', response.data.message);
            const newStatus = await fetchStatus();
            if (newStatus) {
                // Show the updated status tracker after a successful trigger
                setMessages(prev => [...prev, { sender: 'System', text: 'Stage Tracker Updated:', isStatus: true, data: newStatus }]);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '❌ Could not trigger stage. Check if it is UNLOCKED.';
            addMessage('System', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInput = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const command = input.trim().toUpperCase();
        addMessage('Farmer', input);
        setInput('');

        const parts = command.split(/\s+/);
        const action = parts[0];
        const arg = parts[1] ? parseInt(parts[1]) : null;

        if (!status) {
            const id = parseInt(command);
            if (id >= 1 && id <= 5) {
                setFarmerId(id);
                const data = await fetchStatus();
                if (data) {
                    greet(data);
                    // Show initial status after greeting
                    setMessages(prev => [...prev, { sender: 'System', text: 'Current Stage Tracker:', isStatus: true, data: data }]);
                }
            } else {
                addMessage('System', '❌ Invalid Farmer ID. Please enter an ID between 1 and 5.');
            }
            return;
        }

        switch (action) {
            case 'STATUS':
                addMessage('System', 'Current Stage Tracker:');
                const currentStatus = await fetchStatus();
                if (currentStatus) {
                    setMessages(prev => [...prev, { sender: 'System', text: 'Current Stage Tracker:', isStatus: true, data: currentStatus }]);
                }
                break;

            case 'UPLOAD':
                if (arg >= 1 && arg <= 7) {
                    // Mock file upload trigger (simply set a mock file name)
                    addMessage('System', `✅ Mock upload confirmed for Stage ${arg}. Type **TRIGGER ${arg}** to send to Field Officer.`);
                    // NOTE: The mock document recording is handled on the backend via the /trigger endpoint for simplicity.
                } else {
                    addMessage('System', '❌ Invalid command. Use: **UPLOAD <Stage No>** (e.g., UPLOAD 1)');
                }
                break;

            case 'TRIGGER':
                if (arg >= 1 && arg <= 7) {
                    await handleTrigger(arg);
                } else {
                    addMessage('System', '❌ Invalid command. Use: **TRIGGER <Stage No>** (e.g., TRIGGER 1)');
                }
                break;

            case 'HELP':
                addMessage('System', "Available commands: **STATUS**, **UPLOAD <Stage No>**, **TRIGGER <Stage No>**.");
                break;

            default:
                addMessage('System', "❓ Unrecognized command. Type **HELP** for a list of commands.");
                break;
        }
    };

    return (
        <div className="farmer-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <h2>Farmer Chatbot Mock (WhatsApp)</h2>
            <div className="chat-window">
                <div className="messages-container">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender.toLowerCase()}`}>
                            <span className="timestamp">[{msg.timestamp}]</span>
                            {msg.sender}:
                            {msg.isStatus ? (
                                <StageTracker farmer={msg.data} fetchStatus={fetchStatus} role="farmer" />
                            ) : (
                                <p dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                            )}
                        </div>
                    ))}
                    {isLoading && <div className="message system">System: ...processing...</div>}
                    <div ref={chatEndRef} />
                </div>
            </div>
            <form className="chat-input-form" onSubmit={handleInput}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={status ? "Type your command (e.g., STATUS, TRIGGER 2)..." : "Enter Farmer ID (1-5)..."}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
            <p className="disclaimer">For Demonstration Only. Simulating low-bandwidth engagement.</p>
        </div>
    );
};


// --- Field Officer Dashboard ---

const FieldOfficerDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchFarmers = async () => {
        setIsLoading(true);
        try {
            // Fetch all farmers and their latest season status
            const response = await axios.get(`${API_BASE_URL}/admin/status`);
            setFarmers(response.data);
        } catch (error) {
            setMessage('❌ Error fetching farmers. Check backend connection.');
            console.error('Fetch farmers error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproval = async (seasonId, stageNumber) => {
        setMessage('Approving stage...');
        try {
            const response = await axios.post(`${API_BASE_URL}/field-officer/approve/${seasonId}/${stageNumber}`);
            setMessage(`✅ ${response.data.message}`);
            // Update selected farmer status
            await fetchSelectedFarmer(selectedFarmer.farmer_id);
            await fetchFarmers(); // Update main list
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.message || 'Could not approve stage.'}`);
        }
    };

    const handlePestTrigger = async (farmerId) => {
        setMessage('Triggering pest event...');
        try {
            const response = await axios.post(`${API_BASE_URL}/field-officer/trigger_pest/${farmerId}`);
            setMessage(`✅ ${response.data.message}`);
            await fetchSelectedFarmer(farmerId); // Update selected farmer status
            await fetchFarmers();
        } catch (error) {
            setMessage(`❌ Error: ${error.response?.data?.message || 'Could not trigger pest flag.'}`);
        }
    };

    const fetchSelectedFarmer = async (farmerId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/farmer/${farmerId}/status`);
            setSelectedFarmer(response.data);
        } catch (error) {
            console.error('Could not fetch detailed status for selected farmer:', error);
            setSelectedFarmer(null);
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    return (
        <div className="dashboard-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <h2>Field Officer Dashboard</h2>
            <p className="dashboard-info">Approve stages (from PENDING to APPROVED) based on field evidence.</p>
            {message && <p className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>{message}</p>}
            
            <div className="dashboard-layout">
                <div className="farmer-list-panel">
                    <h3>Farmer List</h3>
                    {isLoading && <p>Loading...</p>}
                    <ul className="farmer-list">
                        {farmers.map(f => (
                            <li 
                                key={f.farmer_id} 
                                className={`farmer-list-item ${selectedFarmer?.farmer_id === f.farmer_id ? 'selected' : ''}`}
                                onClick={() => fetchSelectedFarmer(f.farmer_id)}
                            >
                                <strong>{f.farmer_name} (ID: {f.farmer_id})</strong>
                                <span>Crop: {f.crop}</span>
                                <span className="list-status">Next: {f.next_stage_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="details-panel">
                    {selectedFarmer ? (
                        <StageTracker 
                            farmer={{...selectedFarmer, farmer: farmers.find(f => f.farmer_id === selectedFarmer.farmer_id)}}
                            fetchStatus={() => fetchSelectedFarmer(selectedFarmer.farmer_id)}
                            role="fieldOfficer"
                            handleAction={handleApproval}
                            setPestTrigger={handlePestTrigger} // Passed for the mock action
                        />
                    ) : (
                        <p>Select a farmer from the list to view their stage progress and approve milestones.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Lender Dashboard ---

const LenderDashboard = ({ setView }) => {
    const [farmers, setFarmers] = useState([]);
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchFarmers = async () => {
        setIsLoading(true);
        try {
            // Reusing the admin status endpoint
            const response = await axios.get(`${API_BASE_URL}/admin/status`); 
            setFarmers(response.data);
        } catch (error) {
            setMessage('❌ Error fetching farmers. Check backend connection.');
            console.error('Fetch farmers error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisbursement = async (seasonId, stageNumber) => {
        setMessage('Processing disbursement...');
        try {
            const response = await axios.post(`${API_BASE_URL}/lender/disburse/${seasonId}/${stageNumber}`);
            setMessage(`✅ ${response.data.message}`);
            // Update selected farmer status
            await fetchSelectedFarmer(selectedFarmer.farmer_id);
            await fetchFarmers(); // Update main list
        } catch (error) {
            // FIXED: Better error message for broken disbursement
            setMessage(`❌ Disbursement Failed: ${error.response?.data?.message || 'Could not complete disbursement. Check if stage is APPROVED.'}`);
        }
    };

    const fetchSelectedFarmer = async (farmerId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/farmer/${farmerId}/status`);
            setSelectedFarmer(response.data);
        } catch (error) {
            console.error('Could not fetch detailed status for selected farmer:', error);
            setSelectedFarmer(null);
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

    return (
        <div className="dashboard-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <h2>Lender / Program Officer Dashboard</h2>
            <p className="dashboard-info">Authorize disbursements (from APPROVED to COMPLETED) to release funds.</p>
            {message && <p className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>{message}</p>}
            
            <div className="dashboard-layout">
                <div className="farmer-list-panel">
                    <h3>Farmer List</h3>
                    {isLoading && <p>Loading...</p>}
                    <ul className="farmer-list">
                        {farmers.map(f => (
                            <li 
                                key={f.farmer_id} 
                                className={`farmer-list-item ${selectedFarmer?.farmer_id === f.farmer_id ? 'selected' : ''}`}
                                onClick={() => fetchSelectedFarmer(f.farmer_id)}
                            >
                                <strong>{f.farmer_name} (ID: {f.farmer_id})</strong>
                                <span className="list-status">Next: {f.next_stage_name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="details-panel">
                    {selectedFarmer ? (
                        <StageTracker 
                            farmer={{...selectedFarmer, farmer: farmers.find(f => f.farmer_id === selectedFarmer.farmer_id)}}
                            fetchStatus={() => fetchSelectedFarmer(selectedFarmer.farmer_id)}
                            role="lender"
                            handleAction={handleDisbursement}
                        />
                    ) : (
                        <p>Select a farmer from the list to view their funding status and authorize disbursements.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Insurer Dashboard (FIXED: Added functionality) ---

const InsurerDashboard = ({ setView }) => {
    const [policies, setPolicies] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            // FIXED: New endpoint for insurer data
            const response = await axios.get(`${API_BASE_URL}/insurer/status`);
            setPolicies(response.data);
        } catch (error) {
            setMessage('❌ Error fetching insurer data. Check backend connection.');
            console.error('Fetch insurer data error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    return (
        <div className="dashboard-container">
            <button className="btn-back" onClick={() => setView('welcome')}>← Back to Roles</button>
            <h2>Insurer Dashboard</h2>
            <p className="dashboard-info">Monitor policy status and view potential weather/pest claim triggers.</p>
            {message && <p className={`message ${message.startsWith('✅') ? 'success' : 'error'}`}>{message}</p>}
            
            <div className="policy-table">
                <table>
                    <thead>
                        <tr>
                            <th>Farmer ID</th>
                            <th>Policy ID</th>
                            <th>Farmer Name</th>
                            <th>Policy Status</th>
                            <th>Pest Triggered (Mock)</th>
                            <th>Drought Triggered (Mock)</th>
                            <th>Contract State</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="7">Loading policy data...</td></tr>
                        ) : (
                            policies.map(p => (
                                <tr key={p.farmer_id} className={`status-${p.policy_status.toLowerCase()}`}>
                                    <td>{p.farmer_id}</td>
                                    <td>{p.policy_id}</td>
                                    <td>{p.farmer_name}</td>
                                    <td><strong>{p.policy_status}</strong></td>
                                    <td>
                                        <span className={`trigger-status ${p.pest_flag ? 'triggered' : 'ok'}`}>
                                            {p.pest_flag ? '✅ Confirmed' : 'No Event'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`trigger-status ${p.drought_triggered ? 'triggered' : 'ok'}`}>
                                            {p.drought_triggered ? '⚠️ Triggered' : 'Normal'}
                                        </span>
                                    </td>
                                    <td>{p.contract_state.substring(0, 20)}...</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <p className="disclaimer">
                *Mock policy data retrieved via API from the financing system to track on-farm events.
            </p>
        </div>
    );
};


// --- Main App Component ---

const WelcomeScreen = ({ setView }) => (
    <div className="welcome-container">
        <img 
            src={LOGO_SRC} 
            alt="GENFIN Africa Logo" 
            className="esusfarm-logo" 
        />
        
        <h2>GENFIN 🌱 AFRICA</h2>
        <p><b>G20 TechSprint 2025 Demo System</b></p>
        <p>Select a user role to begin the end-to-end stage-based financing flow demonstration.</p>
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
