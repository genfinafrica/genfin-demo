import os
import sys
import json
import hashlib
import math
from datetime import datetime, timedelta
from io import BytesIO
from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

# --- CRITICAL CONFIGURATION ---
PROJECT_ROOT = os.path.abspath(os.path.dirname(__file__))
# IMPORTANT: Adjust this to your Vercel or frontend URL
VERCEL_ORIGIN = "*"
# Database configuration for local SQLite
DB_NAME = 'genfin_demo.db'
SQLITE_URI = f'sqlite:///{os.path.join(PROJECT_ROOT, DB_NAME)}'

# --- Database Initialization ---
db = SQLAlchemy()

# --- DATABASE MODELS ---

class Farmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    id_document = db.Column(db.String(50))
    gender = db.Column(db.String(20))
    age = db.Column(db.Integer)
    next_of_kin = db.Column(db.String(100))
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships (Updated to Season model)
    seasons = db.relationship('Season', backref='farmer', lazy=True, cascade="all, delete-orphan")
    plots = db.relationship('Plot', backref='farmer', lazy=True, cascade="all, delete-orphan")
    uploads = db.relationship('FileUpload', backref='farmer', lazy=True, cascade="all, delete-orphan")

    @property
    def current_season(self):
        # Assumes the latest created season is the current one
        return self.seasons[-1] if self.seasons else None

    @property
    def current_status(self):
        season = self.current_season
        if not season:
            return {'total_disbursed': 0.0, 'score': 50, 'risk_band': 'MEDIUM', 'xai_factors': [], 'pest_flag': False}

        # Get latest scorecard
        scorecard = season.scorecards[-1] if season.scorecards else None

        # Calculate total disbursed
        total_disbursed = sum(stage.disbursement_amount for stage in season.stages if stage.status == 'COMPLETED')

        # Check for Pest Flag (Mock IoT Trigger)
        pest_flag = any(log.data and log.data.get('pest_detected') for log in season.iot_logs)

        return {
            'total_disbursed': total_disbursed,
            'score': scorecard.score if scorecard else 50,
            'risk_band': scorecard.risk_band if scorecard else 'MEDIUM',
            'xai_factors': scorecard.xai_factors if scorecard else [],
            'pest_flag': pest_flag
        }

    def __repr__(self):
        return f"Farmer('{self.name}', '{self.phone}')"

class Season(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer.id'), nullable=False)
    crop = db.Column(db.String(50))
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)

    # Relationships
    stages = db.relationship('LoanStage', backref='season', lazy=True, cascade="all, delete-orphan")
    contracts = db.relationship('Contract', backref='season', lazy=True, cascade="all, delete-orphan")
    scorecards = db.relationship('Scorecard', backref='season', lazy=True, cascade="all, delete-orphan")
    policies = db.relationship('Policy', backref='season', lazy=True, cascade="all, delete-orphan")
    iot_logs = db.relationship('IoTLog', backref='season', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"Season('{self.farmer.name}', '{self.crop}')"

class Plot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer.id'), nullable=False)
    geo_tag = db.Column(db.String(100))
    size = db.Column(db.Float) # CRITICAL for stage disbursement calculation

    def __repr__(self):
        return f"Plot('{self.farmer.name}', '{self.size} acres')"

class LoanStage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    stage_number = db.Column(db.Integer, nullable=False)
    stage_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='LOCKED') # LOCKED, UNLOCKED, PENDING, APPROVED, COMPLETED
    disbursement_amount = db.Column(db.Float, nullable=False)
    completed_date = db.Column(db.DateTime, nullable=True)

    @classmethod
    def get_initial_stages(cls, season_id):
        """Creates the initial 7 stages for a new loan season."""
        # The disbursement amount must be calculated based on a percentage of the total loan amount
        # For simplicity, we assume a total loan of $1000 per acre, which is tied to the Plot size.
        season = Season.query.get(season_id)
        if not season or not season.farmer.plots:
            raise Exception("Cannot create stages without a Season and Plot.")

        plot_size = season.farmer.plots[0].size
        total_loan = plot_size * 200 # Mock loan amount: $200 per acre

        # +++ UPDATED STAGE NAMES TO ALIGN WITH BRS +++
        stages_data = [
            ("Stage 1: Soil Test", 0.10 * total_loan, 'UNLOCKED'), # 10%
            ("Stage 2: Inputs (Seed/Fertilizer)", 0.35 * total_loan, 'LOCKED'), # 35%
            ("Stage 3: Insurance Premium", 0.05 * total_loan, 'LOCKED'), # 5%
            ("Stage 4: Weeding/Maintenance", 0.15 * total_loan, 'LOCKED'), # 15%
            ("Stage 5: Pest Control (Conditional)", 0.10 * total_loan, 'LOCKED'), # 10%
            ("Stage 6: Packaging", 0.15 * total_loan, 'LOCKED'), # 15%
            ("Stage 7: Transport/Marketing", 0.10 * total_loan, 'LOCKED'), # 10%
        ]

        # Ensure total is $200 * plot_size
        stages = []
        for i, (name, amount, status) in enumerate(stages_data):
            stages.append(cls(
                season_id=season_id,
                stage_number=i + 1,
                stage_name=name,
                status=status,
                disbursement_amount=amount
            ))
        return stages

class FileUpload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer.id'), nullable=False)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    stage_number = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(50), nullable=False) # e.g., 'soil_test', 'photo_evidence'
    file_name = db.Column(db.String(255))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)

class Contract(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    state = db.Column(db.String(50), nullable=False) # DRAFT, ACTIVE, STAGE_1_PENDING, STAGE_1_COMPLETED, etc.
    hash_value = db.Column(db.String(255), nullable=False) # Mock Smart Contract Hash
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Scorecard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    risk_band = db.Column(db.String(20), nullable=False)
    xai_factors = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Policy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    policy_id = db.Column(db.String(50), unique=True)
    triggers = db.Column(db.JSON) # e.g., {"rainfall": "<10mm", "pest_flag": "True"}
    status = db.Column(db.String(20), default='PENDING') # PENDING, ACTIVE, CLAIMED

class IoTLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    data = db.Column(db.JSON) # Mock sensor data (e.g., {'ph': 7.0, 'moisture': 25, 'pest_detected': True})

# --- UTILITY FUNCTIONS ---

def transition_contract_state(season_id, new_state, data=None):
    """Simulates a smart contract state transition and logs the event/hash."""
    contract = Contract.query.filter_by(season_id=season_id).order_by(Contract.timestamp.desc()).first()
    if not contract:
        # For initial contract creation
        initial_hash = hashlib.sha256(f"{season_id}_{new_state}_{data or ''}_{datetime.utcnow()}".encode()).hexdigest()
        new_contract_log = Contract(season_id=season_id, state=new_state, hash_value=initial_hash)
        db.session.add(new_contract_log)
        db.session.commit()
        return

    # Generate new hash based on the previous hash, new state, and timestamp (Immutable Audit Trail)
    new_hash_input = f"{contract.hash_value}_{new_state}_{data or ''}_{datetime.utcnow()}"
    new_hash = hashlib.sha256(new_hash_input.encode()).hexdigest()

    # Log the new state transition
    new_contract_log = Contract(
        season_id=season_id,
        state=new_state,
        hash_value=new_hash,
        timestamp=datetime.utcnow()
    )
    db.session.add(new_contract_log)
    db.session.commit()

def calculate_score_and_xai(season):
    """Mocks the AI scoring engine and XAI explanation."""

    # CRITICAL: This now uses the Plot size correctly from the Season/Farmer relation.
    if not season.farmer.plots:
        return 50, 'MEDIUM', []

    plot_size = season.farmer.plots[0].size
    stage_count = len(season.stages)
    completed_stages = sum(1 for s in season.stages if s.status == 'COMPLETED')

    # Mock XAI Factors (Federated Learning Mock)
    xai_factors = [
        {"factor": "KYC Completion (Base)", "weight": 50},
        {"factor": "Land Size (Acres)", "weight": plot_size * 2},
        {"factor": "Stages Completed Ratio", "weight": (completed_stages / max(1, stage_count)) * 30},
        {"factor": "Soil Quality Score (Mock)", "weight": 10},
        {"factor": "Age (Younger +)", "weight": 5 if season.farmer.age < 40 else -5},
    ]

    base_score = 50
    total_boost = sum(f['weight'] for f in xai_factors)

    # Normalize score to 0-100 scale (Mock logic)
    # The initial score is 50. Add/subtract from there.
    score = min(100, max(0, base_score + (total_boost / 10)))

    if score >= 75:
        risk_band = 'LOW'
    elif score >= 50:
        risk_band = 'MEDIUM'
    else:
        risk_band = 'HIGH'

    # Re-map XAI weights to the final score contribution for display
    display_xai = [
        {"factor": f['factor'], "weight": f['weight'] / 10} for f in xai_factors
    ]
    display_xai.insert(0, {"factor": "Base Score", "weight": 50})

    return round(score, 1), risk_band, display_xai

# --- FLASK APP AND ROUTES ---

def create_app(test_config=None):
    app = Flask(__name__)

    # --- Configuration ---
    app.config['SQLALCHEMY_DATABASE_URI'] = SQLITE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'dev_secret_key'

    # Initialize Extensions
    db.init_app(app)
    # Set CORS to allow frontend access
    CORS(app, resources={r"/api/*": {"origins": VERCEL_ORIGIN if VERCEL_ORIGIN != "*" else "*"}})

    # --- API ENDPOINTS ---

    @app.route('/api/farmer/register', methods=['POST'])
    def register_farmer():
        data = request.get_json()

        try:
            # 1. Create Farmer
            farmer = Farmer(
                name=data['name'],
                phone=data['phone'],
                id_document=data.get('id_document', 'N/A'),
                gender=data.get('gender', 'N/A'),
                age=int(data.get('age', 30)),
                next_of_kin='N/A' # Mocked for simplicity
            )
            db.session.add(farmer)
            db.session.flush() # Get farmer ID before commit

            # 2. Create Plot (Needed for stage/score calc)
            plot = Plot(farmer_id=farmer.id, geo_tag=data.get('geo_tag', '0.0,0.0'), size=float(data.get('land_size', 1.0)))
            db.session.add(plot)

            # 3. Create Season
            season = Season(farmer_id=farmer.id, crop=data['crop'], end_date=datetime.utcnow() + timedelta(days=180))
            db.session.add(season)
            db.session.flush() # Get season ID

            # 4. Create Loan Stages
            initial_stages = LoanStage.get_initial_stages(season.id)
            db.session.add_all(initial_stages)

            # 5. Create Contract (DRAFT -> ACTIVE)
            transition_contract_state(season.id, 'DRAFT', data='Initial Registration')
            transition_contract_state(season.id, 'ACTIVE', data='Contract Signed')

            # 6. Create Scorecard
            score, risk_band, xai = calculate_score_and_xai(season)
            scorecard = Scorecard(season_id=season.id, score=score, risk_band=risk_band, xai_factors=xai)
            db.session.add(scorecard)

            db.session.commit()
            return jsonify({'message': 'Farmer registered successfully.', 'farmer_id': farmer.id}), 201

        except Exception as e:
            db.session.rollback()
            print(f"Registration Error: {e}", file=sys.stderr)
            return jsonify({'message': f'Failed to register farmer. {str(e)}'}), 400

    @app.route('/api/farmer/<int:farmer_id>/status', methods=['GET'])
    def get_farmer_status(farmer_id):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404

        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found for farmer'}), 404

        latest_contract = season.contracts[-1] if season.contracts else None
        latest_policy = season.policies[-1] if season.policies else None

        status_data = {
            'farmer_id': farmer.id,
            'name': farmer.name,
            'phone': farmer.phone,
            'crop': season.crop,
            'current_status': farmer.current_status,
            'stages': [
                {
                    'stage_number': s.stage_number,
                    'stage_name': s.stage_name,
                    'status': s.status,
                    'disbursement_amount': s.disbursement_amount
                } for s in season.stages
            ],
            'uploads': [
                {
                    'stage_number': u.stage_number,
                    'file_type': u.file_type,
                    'file_name': u.file_name,
                    'upload_date': u.upload_date.isoformat()
                } for u in farmer.uploads
            ],
            'contract_state': latest_contract.state if latest_contract else 'N/A',
            'contract_hash': latest_contract.hash_value if latest_contract else 'N/A',
            # +++ ADDED FULL CONTRACT HISTORY FOR AUDIT TRAIL MODAL +++
            'contract_history': [
                {
                    'timestamp': c.timestamp.isoformat(),
                    'state': c.state,
                    'hash': c.hash_value
                } for c in sorted(season.contracts, key=lambda c: c.timestamp)
            ] if season.contracts else [],
            'policy_id': latest_policy.policy_id if latest_policy else None,
        }
        return jsonify(status_data)

    @app.route('/api/admin/farmers', methods=['GET'])
    def get_all_farmers():
        farmers = Farmer.query.all()
        farmer_list = []
        for f in farmers:
            season = f.current_season
            stages_completed = sum(1 for s in season.stages if s.status == 'COMPLETED') if season else 0
            score = f.current_status['score']
            farmer_list.append({
                'id': f.id,
                'name': f.name,
                'phone': f.phone,
                'stages_completed': stages_completed,
                'score': score
            })
        return jsonify(farmer_list)

    @app.route('/api/farmer/<int:farmer_id>/upload', methods=['POST'])
    def upload_file(farmer_id):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404
        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found'}), 404

        data = request.get_json()
        stage_number = data['stage_number']
        file_type = data['file_type']
        file_name = data['file_name']
        soil_data = data.get('soil_data', {})

        # Check if the stage is UNLOCKED
        stage = LoanStage.query.filter_by(season_id=season.id, stage_number=stage_number).first()
        if not stage or stage.status != 'UNLOCKED':
            return jsonify({'message': f'Stage {stage_number} is not ready for upload. Status: {stage.status if stage else "N/A"}'}), 400

        # 1. Mock File Upload
        upload = FileUpload(
            farmer_id=farmer_id,
            season_id=season.id,
            stage_number=stage_number,
            file_type=file_type,
            file_name=file_name
        )
        db.session.add(upload)

        # 2. Update Stage Status
        stage.status = 'PENDING'

        # 3. Handle Soil Test Data (Mock Scoring Update)
        if file_type == 'soil_test' and soil_data:
            # Mock Soil Quality Scoring: Higher pH/nutrients give better mock score
            soil_score_boost = 0
            if soil_data.get('ph', 6) > 6.5:
                soil_score_boost += 5

            # Re-calculate score and update scorecard
            scorecard = season.scorecards[-1]
            if scorecard:
                scorecard.xai_factors = scorecard.xai_factors or []
                # Find and update the "Soil Quality Score (Mock)" factor
                for factor in scorecard.xai_factors:
                    if factor['factor'] == 'Soil Quality Score (Mock)':
                        factor['weight'] += soil_score_boost * 10
                        break

                new_score, new_risk, new_xai = calculate_score_and_xai(season)
                scorecard.score = new_score
                scorecard.risk_band = new_risk
                scorecard.xai_factors = new_xai
                db.session.add(scorecard)
                transition_contract_state(season.id, f'STAGE_{stage_number}_SOIL_TEST_UPDATE', data=f'Score Boost: {soil_score_boost}')

        # 4. Update Contract State
        transition_contract_state(season.id, f'STAGE_{stage_number}_PENDING', data=f'{file_type} uploaded')

        db.session.commit()
        return jsonify({'message': f'Upload successful for Stage {stage_number}. Status updated to PENDING Field Officer approval.'})

    @app.route('/api/farmer/<int:farmer_id>/trigger', methods=['POST'])
    def manual_trigger(farmer_id):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404
        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found'}), 404

        # Find next UNLOCKED or PENDING stage
        next_stage = LoanStage.query.filter(LoanStage.season_id == season.id, LoanStage.status.in_(['UNLOCKED', 'PENDING'])).order_by(LoanStage.stage_number).first()

        if not next_stage:
            return jsonify({'message': 'No further stages require a manual trigger or are unlocked.'})

        # --- REMOVED SPECIAL AUTO-TRIGGER FOR STAGE 3 ---
        # Stage 3 will now follow the standard approval/disbursement flow.

        return jsonify({'message': f'Stage {next_stage.stage_number} requires an action (Upload/Approval) before manual trigger is relevant.'})

    @app.route('/api/field-officer/approve/<int:farmer_id>/<int:stage_number>', methods=['POST'])
    def approve_stage(farmer_id, stage_number):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404
        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found'}), 404

        stage = LoanStage.query.filter_by(season_id=season.id, stage_number=stage_number, status='PENDING').first()

        if not stage:
            return jsonify({'message': f'Stage {stage_number} not found or not in PENDING status.'}), 400

        # 1. Update Stage Status
        stage.status = 'APPROVED'

        # 2. Update Contract State
        transition_contract_state(season.id, f'STAGE_{stage_number}_APPROVED', data='Field Officer Approval')

        db.session.commit()
        return jsonify({'message': f'Stage {stage_number} approved successfully. Ready for lender disbursement.'})

    @app.route('/api/lender/disburse/<int:farmer_id>/<int:stage_number>', methods=['POST'])
    def disburse_funds(farmer_id, stage_number):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404
        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found'}), 404

        stage = LoanStage.query.filter_by(season_id=season.id, stage_number=stage_number, status='APPROVED').first()

        if not stage:
            return jsonify({'message': f'Stage {stage_number} not found or not in APPROVED status.'}), 400

        # 1. Update Stage Status
        stage.status = 'COMPLETED'
        stage.completed_date = datetime.utcnow()

        # +++ ADDED AUTOMATIC POLICY CREATION ON STAGE 3 DISBURSEMENT +++
        # 2a. If Stage 3 (Insurance) is completed, create and bind the policy
        if stage.stage_number == 3:
            policy = Policy.query.filter_by(season_id=season.id).first()
            if not policy:
                policy = Policy(
                    season_id=season.id,
                    policy_id=f"POL-{farmer.id}-{datetime.utcnow().year}",
                    triggers=json.dumps({"rainfall": "<10mm"}), # Mock triggers
                    status='PENDING'
                )
                db.session.add(policy)

            policy.status = 'ACTIVE'
            transition_contract_state(season.id, 'POLICY_ACTIVE', data=f'Policy {policy.policy_id} Bound after Premium Disbursement')

        # 2b. Unlock Next Stage (If applicable)
        next_stage_number = stage_number + 1
        next_stage = LoanStage.query.filter_by(season_id=season.id, stage_number=next_stage_number, status='LOCKED').first()

        # Skip the conditional Stage 5 if no pest event has been logged (Mock Logic)
        if next_stage and next_stage.stage_number == 5 and not farmer.current_status['pest_flag']:
            # Skip Stage 5 and unlock Stage 6
            next_stage_number = 6
            next_stage = LoanStage.query.filter_by(season_id=season.id, stage_number=next_stage_number, status='LOCKED').first()

            # Log the skip in the contract
            transition_contract_state(season.id, 'STAGE_5_SKIPPED', data='No Pest Event Triggered')

        if next_stage:
            next_stage.status = 'UNLOCKED'

        # 3. Update Contract State
        transition_contract_state(season.id, f'STAGE_{stage_number}_COMPLETED', data=f'Disbursed ${stage.disbursement_amount}')

        # 4. Re-calculate Score (Federal Learning Mock)
        score, risk_band, xai = calculate_score_and_xai(season)
        scorecard = season.scorecards[-1]
        scorecard.score = score
        scorecard.risk_band = risk_band
        scorecard.xai_factors = xai
        db.session.add(scorecard)

        db.session.commit()
        return jsonify({'message': f'Funds disbursed for Stage {stage_number}. Status updated to COMPLETED.'})

    @app.route('/api/field-officer/trigger_pest/<int:farmer_id>', methods=['POST'])
    def trigger_pest_event(farmer_id):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404
        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found'}), 404

        # 1. Log Mock IoT Event with Pest Flag
        iot_log = IoTLog(
            season_id=season.id,
            data={'pest_detected': True, 'timestamp': datetime.utcnow().isoformat()}
        )
        db.session.add(iot_log)

        # 2. Force Unlock Stage 5 (Pest/Disease) if it is locked
        stage_5 = LoanStage.query.filter_by(season_id=season.id, stage_number=5).first()
        if stage_5 and stage_5.status == 'LOCKED':
            stage_5.status = 'UNLOCKED'

        # 3. Update Contract State
        transition_contract_state(season.id, 'PEST_EVENT_FLAGGED', data='Field Officer Mock Trigger')

        db.session.commit()
        return jsonify({'message': 'Pest event flagged. Stage 5 (Pest Control) unlocked for funding.'})

    # +++ NEW ENDPOINT FOR INSURER DASHBOARD TO FETCH RELEVANT FARMERS +++
    @app.route('/api/insurer/farmers', methods=['GET'])
    def get_insurer_farmers():
        # Find farmers who have reached or passed the insurance stage (Stage 3)
        farmers_with_insurance_stage = Farmer.query.join(Season).join(LoanStage).filter(LoanStage.stage_number >= 3).distinct().all()

        farmer_list = []
        for f in farmers_with_insurance_stage:
            season = f.current_season
            if season: # Ensure season exists
                score = f.current_status['score']
                policy = season.policies[-1] if season.policies else None
                farmer_list.append({
                    'id': f.id,
                    'name': f.name,
                    'policy_status': policy.status if policy else 'PENDING_GENERATION',
                    'score': score
                })
        return jsonify(farmer_list)

    @app.route('/api/insurer/bind/<int:farmer_id>', methods=['POST'])
    def bind_policy(farmer_id):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404
        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found'}), 404

        policy = Policy.query.filter_by(season_id=season.id).first()

        if policy and policy.status == 'ACTIVE':
            return jsonify({'message': 'Policy is already bound and active.'}), 400

        if not policy:
            policy = Policy(season_id=season.id, policy_id=f"POL-{farmer_id}-{datetime.utcnow().year}", triggers=json.dumps({"rainfall": "<10mm"}), status='PENDING')
            db.session.add(policy)

        # Mock binding process
        policy.status = 'ACTIVE'
        transition_contract_state(season.id, 'POLICY_ACTIVE', data=f'Policy {policy.policy_id} Bound')

        db.session.commit()
        return jsonify({'message': f'Policy {policy.policy_id} bound successfully and is ACTIVE.'})

    @app.route('/api/insurer/trigger/<int:farmer_id>', methods=['POST'])
    def check_insurance_trigger(farmer_id):
        farmer = Farmer.query.get(farmer_id)
        if not farmer:
            return jsonify({'message': 'Farmer not found'}), 404
        season = farmer.current_season
        if not season:
            return jsonify({'message': 'No active season found'}), 404

        data = request.get_json()
        rainfall = data.get('rainfall', 0)

        policy = Policy.query.filter_by(season_id=season.id, status='ACTIVE').first()
        if not policy:
            return jsonify({'message': 'No active insurance policy found to check triggers.'}), 400

        # Mock trigger check logic
        if rainfall < 10:
            policy.status = 'CLAIMED'
            transition_contract_state(season.id, 'INSURANCE_CLAIMED_DROUGHT', data=f'Rainfall was {rainfall}mm')
            db.session.commit()
            return jsonify({'message': 'Drought trigger met! Insurance claim process initiated.'})

        return jsonify({'message': 'No insurance triggers met at this time.'})

    @app.route('/api/iot/ingest', methods=['POST'])
    def ingest_iot_data():
        # This route is a mock for a sensor.
        # It won't be tied to a specific farmer
        # but to the current active farmer (ID 1) for the demo.
        farmer = Farmer.query.get(1)
        if not farmer or not farmer.current_season:
            return jsonify({'message': 'Cannot ingest IoT data: No mock farmer (ID 1) or season active.'}), 400

        data = request.get_json()

        # Mock logic to detect a pest event from high temp/low moisture
        pest_detected = data.get('temperature', 30) > 35 and data.get('moisture', 25) < 15

        log_data = {
            'ph': data.get('ph'),
            'moisture': data.get('moisture'),
            'temperature': data.get('temperature'),
            'pest_detected': pest_detected
        }

        iot_log = IoTLog(season_id=farmer.current_season.id, data=log_data)
        db.session.add(iot_log)

        if pest_detected:
            # Auto-trigger the pest event logic if detected by IoT
            stage_5 = LoanStage.query.filter_by(season_id=farmer.current_season.id, stage_number=5).first()
            if stage_5 and stage_5.status == 'LOCKED':
                stage_5.status = 'UNLOCKED'
                transition_contract_state(farmer.current_season.id, 'PEST_EVENT_AUTO_TRIGGER', data='IoT Sensor Alert')

        db.session.commit()
        return jsonify({'message': f"IoT data ingested. Pest detected: {pest_detected}."})

    @app.route('/api/report/farmer/<int:farmer_id>', methods=['GET'])
    def generate_farmer_report(farmer_id):
        farmer = Farmer.query.get(farmer_id)
        if not farmer or not farmer.current_season:
            return jsonify({'message': 'Farmer or active Season not found'}), 404

        season = farmer.current_season
        scorecard = season.scorecards[-1] if season.scorecards else None

        # --- PDF GENERATION LOGIC ---
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            Story = []

            # 1. Header
            Story.append(Paragraph("GENFIN AFRICA - Farmer Impact Report", styles['h1']))
            Story.append(Paragraph(f"Farmer: {farmer.name} (ID: {farmer.id})", styles['h2']))
            Story.append(Paragraph(f"Crop: {season.crop} | Land Size: {farmer.plots[0].size} acres", styles['h3']))
            Story.append(Spacer(1, 12))

            # 2. AI Proficiency Score
            Story.append(Paragraph("AI Farmer Proficiency Score", styles['h3']))
            score = scorecard.score if scorecard else 50
            risk = scorecard.risk_band if scorecard else 'MEDIUM'
            Story.append(Paragraph(f"Score: <b>{score}</b> (Risk Band: <b>{risk}</b>)", styles['Normal']))
            Story.append(Spacer(1, 6))

            # XAI Factors Table
            xai_data = [['Factor', 'Contribution (Mock Weight)']]
            if scorecard and scorecard.xai_factors:
                for f in scorecard.xai_factors:
                    xai_data.append([f['factor'], f['weight']])

            table_xai = Table(xai_data, colWidths=[350, 150])
            table_xai.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            Story.append(Paragraph("Score Explainability (XAI)", styles['h4']))
            Story.append(table_xai)
            Story.append(Spacer(1, 18))

            # 3. Loan Stage Progress
            Story.append(Paragraph("Loan Disbursement Timeline", styles['h3']))
            stage_data = [['Stage', 'Amount', 'Status', 'Date Completed']]
            total_disbursed = 0

            for s in season.stages:
                stage_data.append([
                    f"Stage {s.stage_number}: {s.stage_name}",
                    f"${s.disbursement_amount:,.2f}",
                    s.status,
                    s.completed_date.strftime("%Y-%m-%d") if s.completed_date else "N/A"
                ])
                if s.status == 'COMPLETED':
                    total_disbursed += s.disbursement_amount

            table_stages = Table(stage_data, colWidths=[200, 100, 100, 100])
            table_stages.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            Story.append(table_stages)
            Story.append(Spacer(1, 6))
            Story.append(Paragraph(f"<b>Total Disbursed: ${total_disbursed:,.2f}</b>", styles['h4']))
            Story.append(Spacer(1, 18))

            # 4. Contract Audit Trail
            Story.append(Paragraph("Smart Contract Audit Trail (Immutable Log)", styles['h3']))
            contract_data = [['Timestamp', 'State Transition', 'Hash (First 10 Chars)']]

            # Sort contracts by timestamp ascending
            sorted_contracts = sorted(season.contracts, key=lambda c: c.timestamp)

            for c in sorted_contracts:
                contract_data.append([
                    c.timestamp.strftime("%Y-%m-%d %H:%M"),
                    c.state,
                    c.hash_value[:10] + '...'
                ])

            table_contract = Table(contract_data, colWidths=[150, 150, 200])
            table_contract.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            Story.append(table_contract)
            Story.append(Spacer(1, 18))

            # 5. Disclaimer
            Story.append(Paragraph("--- DISCLAIMER ---", styles['h4']))
            Story.append(Paragraph("This report is generated for demonstration purposes only and uses synthetic data and mock APIs.", styles['Italic']))

            doc.build(Story)
            pdf_value = buffer.getvalue()
            buffer.close()

            response = make_response(pdf_value)
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename=report_farmer_{farmer_id}.pdf'
            return response

        except Exception as e:
            print(f"ERROR in generate_farmer_report for farmer {farmer_id}: {e}", file=sys.stderr)
            return jsonify({'message': 'Internal Server Error during report generation.', 'error_details': str(e)}), 500

    # --- UTILITY AND COMMAND-LINE FUNCTIONS ---
    @app.cli.command('init-db')
    def init_db_command():
        """Resets and re-initializes the database schema without mock data."""
        with app.app_context():
            print("Resetting database...", file=sys.stderr)
            db.drop_all()
            db.create_all()
            print("✅ Database tables dropped and recreated without any mock data.", file=sys.stderr)
            # --- REMOVED MOCK FARMER CREATION TO ALLOW FOR A CLEAN DATABASE START ---

    return app

# --- WSGI and MAIN ENTRY POINT ---
app = create_app()

if __name__ == '__main__':
    # You must run 'flask init-db' from the terminal once before running the app
    # Or you can uncomment the line below for quick testing, but it's less standard.
    # with app.app_context():
    #     db.create_all()
    app.run(debug=True)
