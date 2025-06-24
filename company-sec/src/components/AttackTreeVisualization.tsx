import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Target, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { AttackTree, AttackNode, AttackLeaf } from '../types/threat.types';

interface AttackTreeVisualizationProps {
  attackTree: AttackTree;
  onNodeSelect?: (nodeId: string) => void;
}

interface TreeNodeProps {
  node: AttackNode;
  depth: number;
  onToggle: (nodeId: string) => void;
  onSelect?: (nodeId: string) => void;
  expandedNodes: Set<string>;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  depth, 
  onToggle, 
  onSelect, 
  expandedNodes 
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isLeaf = !!node.leaf;

  const getNodeTypeColor = (type: string) => {
    return type === 'AND' ? '#3498db' : '#e74c3c';
  };

  const getSkillLevelColor = (skill: string) => {
    const colors = {
      low: '#27ae60',
      medium: '#f39c12', 
      high: '#e74c3c',
      expert: '#8e44ad'
    };
    return colors[skill as keyof typeof colors] || '#7f8c8d';
  };

  const getCostLevelIcon = (cost: string) => {
    const levels = {
      low: 1,
      medium: 2,
      high: 3,
      very_high: 4
    };
    const level = levels[cost as keyof typeof levels] || 1;
    return '€'.repeat(level);
  };

  return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      <div
        className="attack-node"
        onClick={() => {
          if (hasChildren) onToggle(node.id);
          if (onSelect) onSelect(node.id);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.75rem',
          margin: '0.25rem 0',
          backgroundColor: isLeaf ? '#f8f9fa' : '#ffffff',
          border: `2px solid ${isLeaf ? '#dee2e6' : getNodeTypeColor(node.type)}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {hasChildren && (
            <span style={{ marginRight: '0.5rem', color: '#7f8c8d' }}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          
          {!hasChildren && !isLeaf && (
            <span style={{ marginRight: '0.5rem', color: '#7f8c8d' }}>
              <Target size={16} />
            </span>
          )}

          {isLeaf && (
            <span style={{ marginRight: '0.5rem', color: '#e74c3c' }}>
              <AlertTriangle size={16} />
            </span>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: '600', 
              color: isLeaf ? '#495057' : '#2c3e50',
              marginBottom: isLeaf ? '0.25rem' : 0
            }}>
              {node.name}
              {!isLeaf && (
                <span style={{ 
                  marginLeft: '0.5rem',
                  padding: '0.125rem 0.375rem',
                  backgroundColor: getNodeTypeColor(node.type),
                  color: 'white',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {node.type}
                </span>
              )}
            </div>

            {isLeaf && node.leaf && (
              <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <DollarSign size={14} />
                    <span>Kosten: {getCostLevelIcon(node.leaf.cost)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} />
                    <span>Zeit: {node.leaf.time_required}</span>
                  </div>
                  
                  <div>
                    <span style={{ 
                      color: getSkillLevelColor(node.leaf.skill_required),
                      fontWeight: '500'
                    }}>
                      Skill: {node.leaf.skill_required}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#28a745' }}>
                      Erfolg: {(node.leaf.success_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Technik: {node.leaf.technique}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AttackTreeVisualization: React.FC<AttackTreeVisualizationProps> = ({ 
  attackTree, 
  onNodeSelect 
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([attackTree.root.id]));
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const handleToggle = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelect = (nodeId: string) => {
    if (onNodeSelect) onNodeSelect(nodeId);
  };

  const expandAll = () => {
    const getAllNodeIds = (node: AttackNode): string[] => {
      const ids = [node.id];
      if (node.children) {
        node.children.forEach(child => {
          ids.push(...getAllNodeIds(child));
        });
      }
      return ids;
    };
    
    setExpandedNodes(new Set(getAllNodeIds(attackTree.root)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set([attackTree.root.id]));
  };

  const getTreeStatistics = () => {
    const countNodes = (node: AttackNode): { total: number, leaves: number, and: number, or: number } => {
      let stats = { total: 1, leaves: 0, and: 0, or: 0 };
      
      if (node.leaf) {
        stats.leaves = 1;
      }
      
      if (node.type === 'AND') stats.and = 1;
      if (node.type === 'OR') stats.or = 1;
      
      if (node.children) {
        node.children.forEach(child => {
          const childStats = countNodes(child);
          stats.total += childStats.total;
          stats.leaves += childStats.leaves;
          stats.and += childStats.and;
          stats.or += childStats.or;
        });
      }
      
      return stats;
    };
    
    return countNodes(attackTree.root);
  };

  const stats = getTreeStatistics();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Attack Tree: {attackTree.goal}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="button" onClick={expandAll} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              Alle erweitern
            </button>
            <button className="button" onClick={collapseAll} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              Alle reduzieren
            </button>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>
              {stats.total}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
              Gesamt Knoten
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {stats.leaves}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
              Angriffstechniken
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3498db' }}>
              {stats.and}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
              AND Knoten
            </div>
          </div>
          
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
              {stats.or}
            </div>
            <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
              OR Knoten
            </div>
          </div>
        </div>

        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#6c757d'
        }}>
          <strong>Legende:</strong> 
          <span style={{ margin: '0 1rem' }}>
            <span style={{ color: '#3498db', fontWeight: 'bold' }}>AND</span> = Alle Bedingungen müssen erfüllt sein
          </span>
          <span style={{ margin: '0 1rem' }}>
            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>OR</span> = Eine Bedingung muss erfüllt sein
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem', maxHeight: '600px', overflowY: 'auto' }}>
        <TreeNode
          node={attackTree.root}
          depth={0}
          onToggle={handleToggle}
          onSelect={handleSelect}
          expandedNodes={expandedNodes}
        />
      </div>

      {attackTree.paths && attackTree.paths.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Kritische Angriffspfade</h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {attackTree.paths.slice(0, 3).map((path, index) => (
              <div
                key={path.id}
                className="card"
                style={{ 
                  padding: '1rem',
                  border: selectedPath === path.id ? '2px solid #3498db' : '1px solid #e0e0e0'
                }}
                onClick={() => setSelectedPath(path.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ margin: 0 }}>Pfad {index + 1}</h5>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#7f8c8d' }}>
                    <span>Erfolg: {(path.success_probability * 100).toFixed(0)}%</span>
                    <span>Erkennung: {(path.detection_probability * 100).toFixed(0)}%</span>
                    <span>Zeit: {path.total_time}</span>
                  </div>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                  {path.nodes.length} Schritte erforderlich
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>
        {`
          .attack-node:hover {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transform: translateY(-1px);
          }
        `}
      </style>
    </div>
  );
};

export default AttackTreeVisualization;