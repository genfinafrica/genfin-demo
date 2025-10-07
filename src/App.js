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
