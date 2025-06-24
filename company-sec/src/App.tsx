import React, { useState } from 'react';
import { Plus, BarChart3, AlertTriangle, FileText, Shield, Target, Eye } from 'lucide-react';
import './App.css';
import { Risk } from './types/risk.types';
import { Threat, ThreatModel, AttackTree } from './types/threat.types';
import Dashboard from './components/Dashboard';
import RiskForm from './components/RiskForm';
import RiskList from './components/RiskList';
import RiskMatrix from './components/RiskMatrix';
import RiskCharts from './components/RiskCharts';
import ThreatForm from './components/ThreatForm';
import ThreatAssessment from './components/ThreatAssessment';
import StrideMatrix from './components/StrideMatrix';
import ThreatModelingDashboard from './components/ThreatModelingDashboard';
import AttackTreeVisualization from './components/AttackTreeVisualization';

type TabType = 'dashboard' | 'risks' | 'matrix' | 'charts' | 'threats' | 'stride' | 'attack-trees' | 'threat-intelligence';

const App: React.FC = () => {
  const [risks, setRisks] = useState<Risk[]>([
    {
      id: 'sample-1',
      name: 'Datenschutzverletzung',
      category: 'cybersecurity',
      probability: 3,
      impact: 5,
      description: 'Möglicher unbefugter Zugriff auf Kundendaten',
      mitigation: 'Erweiterte Verschlüsselung und Zugriffskontrollen implementieren',
      owner: 'IT-Sicherheitsteam',
      status: 'assessed',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'sample-2',
      name: 'Marktvolatilität',
      category: 'financial',
      probability: 4,
      impact: 3,
      description: 'Wirtschaftliche Unsicherheit beeinträchtigt Umsatzströme',
      mitigation: 'Umsatzquellen diversifizieren und Liquiditätsreserven aufrechterhalten',
      owner: 'Finanzvorstand',
      status: 'monitoring',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'sample-3',
      name: 'Lieferkettenstörung',
      category: 'operational',
      probability: 2,
      impact: 4,
      description: 'Mögliche Verzögerungen bei kritischen Lieferungen',
      mitigation: 'Ersatzlieferanten etablieren und Lagerbestände puffern',
      owner: 'Betriebsleiter',
      status: 'mitigated',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    }
  ]);
  
  // Threat modeling data
  const [threats, setThreats] = useState<Threat[]>([
    {
      id: 'threat-1',
      name: 'SQL Injection Angriff',
      description: 'Böswillige SQL-Befehle werden in Eingabefelder eingeschleust, um unbefugten Datenbankzugriff zu erlangen',
      category: 'data_breach',
      strideClassification: ['tampering', 'information_disclosure'],
      killChainPhase: 'exploitation',
      attackVector: 'network',
      complexity: 'medium',
      likelihood: 4,
      impact: {
        confidentiality: 'high',
        integrity: 'high',
        availability: 'low',
        financial: 50000,
        reputational: 'high',
        operational: 'medium'
      },
      riskScore: 7.2,
      cveReferences: ['CVE-2023-1234'],
      mitreTechniques: ['T1190'],
      affectedAssets: ['Kundendatenbank', 'Webanwendung'],
      affectedComponents: ['Web-Server', 'Datenbank'],
      mitigations: [],
      detectionMethods: [],
      status: 'identified',
      assignedTo: 'Security Team',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 'threat-2',
      name: 'Phishing E-Mail Kampagne',
      description: 'Gefälschte E-Mails, die Benutzer dazu verleiten, Anmeldedaten preiszugeben oder Malware zu installieren',
      category: 'social_engineering',
      strideClassification: ['spoofing', 'elevation_of_privilege'],
      killChainPhase: 'delivery',
      attackVector: 'social',
      complexity: 'low',
      likelihood: 5,
      impact: {
        confidentiality: 'medium',
        integrity: 'medium',
        availability: 'low',
        financial: 25000,
        reputational: 'medium',
        operational: 'high'
      },
      riskScore: 6.8,
      cveReferences: [],
      mitreTechniques: ['T1566'],
      affectedAssets: ['Benutzeranmeldedaten', 'E-Mail-System'],
      affectedComponents: ['E-Mail-Server', 'Endpunkte'],
      mitigations: [],
      detectionMethods: [],
      status: 'analyzing',
      assignedTo: 'IT Security',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18')
    }
  ]);

  const [sampleAttackTree] = useState<AttackTree>({
    id: 'attack-tree-1',
    goal: 'Kompromittierung der Kundendatenbank',
    root: {
      id: 'root',
      name: 'Kundendatenbank kompromittieren',
      type: 'OR',
      children: [
        {
          id: 'web-attack',
          name: 'Web-Anwendung angreifen',
          type: 'AND',
          children: [
            {
              id: 'sql-injection',
              name: 'SQL Injection ausführen',
              type: 'OR',
              children: [],
              leaf: {
                technique: 'SQL Injection über Login-Form',
                cost: 'low',
                skill_required: 'medium',
                time_required: 'hours',
                detection_difficulty: 'medium',
                success_probability: 0.7
              }
            },
            {
              id: 'bypass-auth',
              name: 'Authentifizierung umgehen',
              type: 'OR',
              children: [],
              leaf: {
                technique: 'Session Hijacking',
                cost: 'medium',
                skill_required: 'high',
                time_required: 'days',
                detection_difficulty: 'hard',
                success_probability: 0.4
              }
            }
          ]
        },
        {
          id: 'social-engineering',
          name: 'Social Engineering Angriff',
          type: 'AND',
          children: [
            {
              id: 'phishing',
              name: 'Phishing E-Mail senden',
              type: 'OR',
              children: [],
              leaf: {
                technique: 'Spear Phishing an Administratoren',
                cost: 'low',
                skill_required: 'low',
                time_required: 'hours',
                detection_difficulty: 'easy',
                success_probability: 0.6
              }
            },
            {
              id: 'credential-theft',
              name: 'Anmeldedaten stehlen',
              type: 'OR',
              children: [],
              leaf: {
                technique: 'Keylogger Installation',
                cost: 'medium',
                skill_required: 'medium',
                time_required: 'days',
                detection_difficulty: 'medium',
                success_probability: 0.5
              }
            }
          ]
        }
      ]
    },
    paths: [
      {
        id: 'path-1',
        nodes: ['root', 'web-attack', 'sql-injection'],
        total_cost: 'low',
        total_time: 'hours',
        success_probability: 0.7,
        detection_probability: 0.3
      },
      {
        id: 'path-2',
        nodes: ['root', 'social-engineering', 'phishing', 'credential-theft'],
        total_cost: 'medium',
        total_time: 'days',
        success_probability: 0.3,
        detection_probability: 0.6
      }
    ]
  });

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [showThreatForm, setShowThreatForm] = useState(false);
  const [editRisk, setEditRisk] = useState<Risk | null>(null);
  const [editThreat, setEditThreat] = useState<Threat | null>(null);

  const handleAddRisk = (risk: Risk) => {
    if (editRisk) {
      setRisks(prev => prev.map(r => r.id === risk.id ? risk : r));
      setEditRisk(null);
    } else {
      setRisks(prev => [...prev, risk]);
    }
  };

  const handleEditRisk = (risk: Risk) => {
    setEditRisk(risk);
    setShowRiskForm(true);
  };

  const handleDeleteRisk = (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Risiko löschen möchten?')) {
      setRisks(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleCloseForm = () => {
    setShowRiskForm(false);
    setEditRisk(null);
  };

  // Threat handlers
  const handleAddThreat = (threat: Threat) => {
    if (editThreat) {
      setThreats(prev => prev.map(t => t.id === threat.id ? threat : t));
      setEditThreat(null);
    } else {
      setThreats(prev => [...prev, threat]);
    }
  };

  const handleEditThreat = (threat: Threat) => {
    setEditThreat(threat);
    setShowThreatForm(true);
  };

  const handleDeleteThreat = (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Bedrohung löschen möchten?')) {
      setThreats(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleCloseThreatForm = () => {
    setShowThreatForm(false);
    setEditThreat(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard risks={risks} />;
      case 'risks':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Risikoregister</h2>
              <button className="button primary" onClick={() => setShowRiskForm(true)}>
                <Plus size={20} />
                Risiko hinzufügen
              </button>
            </div>
            <RiskList risks={risks} onEdit={handleEditRisk} onDelete={handleDeleteRisk} />
          </div>
        );
      case 'matrix':
        return (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Risikomatrix</h2>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ color: '#7f8c8d' }}>
                  Risikomatrix zeigt Wahrscheinlichkeit vs. Auswirkung. Zahlen in Zellen repräsentieren Anzahl der Risiken.
                </p>
              </div>
              <RiskMatrix risks={risks} />
            </div>
          </div>
        );
      case 'charts':
        return (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Risiko-Auswertungen</h2>
            <RiskCharts risks={risks} />
          </div>
        );
      case 'threats':
        return (
          <div>
            <ThreatModelingDashboard threats={threats} />
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Bedrohungsanalyse</h2>
                <button className="button primary" onClick={() => setShowThreatForm(true)}>
                  <Plus size={20} />
                  Bedrohung hinzufügen
                </button>
              </div>
              <ThreatAssessment 
                threats={threats} 
                onThreatSelect={handleEditThreat}
              />
            </div>
          </div>
        );
      case 'stride':
        return (
          <div>
            <StrideMatrix threats={threats} />
          </div>
        );
      case 'attack-trees':
        return (
          <div>
            <AttackTreeVisualization attackTree={sampleAttackTree} />
          </div>
        );
      case 'threat-intelligence':
        return (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Threat Intelligence</h2>
            <div className="card">
              <h3 className="card-title">Threat Intelligence Dashboard</h3>
              <p style={{ color: '#7f8c8d', marginTop: '1rem' }}>
                Diese Funktionalität wird in einer zukünftigen Version implementiert. 
                Hier werden aktuelle Bedrohungsinformationen, IOCs und Threat Actor Profile angezeigt.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Unternehmens-Risikoanalyse</h1>
      </header>

      <main className="main-content">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <AlertTriangle size={18} />
            Übersicht
          </button>
          <button
            className={`tab ${activeTab === 'risks' ? 'active' : ''}`}
            onClick={() => setActiveTab('risks')}
          >
            <FileText size={18} />
            Risikoregister
          </button>
          <button
            className={`tab ${activeTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('matrix')}
          >
            <BarChart3 size={18} />
            Risikomatrix
          </button>
          <button
            className={`tab ${activeTab === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveTab('charts')}
          >
            <BarChart3 size={18} />
            Auswertungen
          </button>
          <button
            className={`tab ${activeTab === 'threats' ? 'active' : ''}`}
            onClick={() => setActiveTab('threats')}
          >
            <Shield size={18} />
            Threat Modeling
          </button>
          <button
            className={`tab ${activeTab === 'stride' ? 'active' : ''}`}
            onClick={() => setActiveTab('stride')}
          >
            <Target size={18} />
            STRIDE
          </button>
          <button
            className={`tab ${activeTab === 'attack-trees' ? 'active' : ''}`}
            onClick={() => setActiveTab('attack-trees')}
          >
            <AlertTriangle size={18} />
            Attack Trees
          </button>
          <button
            className={`tab ${activeTab === 'threat-intelligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('threat-intelligence')}
          >
            <Eye size={18} />
            Threat Intel
          </button>
        </div>

        {renderTabContent()}
      </main>

      {showRiskForm && (
        <RiskForm
          onSubmit={handleAddRisk}
          onClose={handleCloseForm}
          editRisk={editRisk}
        />
      )}

      {showThreatForm && (
        <ThreatForm
          onSubmit={handleAddThreat}
          onClose={handleCloseThreatForm}
          editThreat={editThreat}
          availableAssets={['Kundendatenbank', 'Webanwendung', 'E-Mail-System', 'Benutzeranmeldedaten']}
          availableComponents={['Web-Server', 'Datenbank', 'E-Mail-Server', 'Endpunkte']}
        />
      )}
    </div>
  );
};

export default App;
