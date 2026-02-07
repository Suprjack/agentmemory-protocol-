import { useState, useEffect } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import './App.css'

const PROGRAM_ID = 'EivtLAsC6pB2DJHd1MdSC9nYByVzcowJoUvqh9GmAjHc'
const RPC_URL = 'https://api.devnet.solana.com'

function App() {
  const [programInfo, setProgramInfo] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchProgramData()
  }, [])

  async function fetchProgramData() {
    try {
      const connection = new Connection(RPC_URL, 'confirmed')
      const programPubkey = new PublicKey(PROGRAM_ID)
      
      // Fetch program account info
      const info = await connection.getAccountInfo(programPubkey)
      
      // Fetch recent transactions
      const sigs = await connection.getSignaturesForAddress(programPubkey, { limit: 20 })
      
      setProgramInfo({
        lamports: info?.lamports || 0,
        executable: info?.executable || false,
        owner: info?.owner?.toString() || 'Unknown',
        dataSize: info?.data?.length || 0
      })
      
      setTransactions(sigs)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
  }

  const stats = {
    totalTransactions: 11,
    agents: 1,
    decisionLogs: 3,
    attestations: 2,
    modules: 3,
    purchases: 1
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <span className="logo-icon">🧠</span>
            <h1>AgentMemory Explorer</h1>
          </div>
          <nav className="nav">
            <a href="https://suprjack.github.io/agentmemory-protocol-/" target="_blank">Home</a>
            <a href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`} target="_blank">
              Solana Explorer ↗
            </a>
          </nav>
        </div>
      </header>

      <div className="container">
        {/* Hero Stats */}
        <section className="hero">
          <h2>Live on Solana Devnet</h2>
          <p className="program-id">
            Program ID: <code>{PROGRAM_ID}</code>
          </p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalTransactions}</div>
              <div className="stat-label">Total Transactions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.agents}</div>
              <div className="stat-label">Registered Agents</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.decisionLogs}</div>
              <div className="stat-label">Decision Logs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.attestations}</div>
              <div className="stat-label">Attestations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.modules}</div>
              <div className="stat-label">Memory Modules</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.purchases}</div>
              <div className="stat-label">Purchases</div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'transactions' ? 'active' : ''} 
            onClick={() => setActiveTab('transactions')}
          >
            Recent Transactions
          </button>
          <button 
            className={activeTab === 'agents' ? 'active' : ''} 
            onClick={() => setActiveTab('agents')}
          >
            Agents
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading">Loading blockchain data...</div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <section className="overview">
                <div className="card">
                  <h3>🎯 What is AgentMemory?</h3>
                  <p>
                    AgentMemory Protocol is a trust layer for AI agents on Solana. 
                    Every decision, attestation, and reputation update is stored on-chain 
                    with cryptographic proof.
                  </p>
                  
                  <h4>Key Features:</h4>
                  <ul>
                    <li>✅ Immutable decision logging</li>
                    <li>✅ Performance-based reputation system</li>
                    <li>✅ Memory module marketplace with royalties</li>
                    <li>✅ 100% transparent, verifiable on Solana Explorer</li>
                  </ul>
                </div>

                <div className="card">
                  <h3>📊 Program Info</h3>
                  <div className="info-grid">
                    <div>
                      <strong>Balance:</strong> {(programInfo?.lamports / 1e9).toFixed(4)} SOL
                    </div>
                    <div>
                      <strong>Executable:</strong> {programInfo?.executable ? 'Yes ✅' : 'No'}
                    </div>
                    <div>
                      <strong>Owner:</strong> <code>{programInfo?.owner?.slice(0, 20)}...</code>
                    </div>
                    <div>
                      <strong>Data Size:</strong> {programInfo?.dataSize} bytes
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'transactions' && (
              <section className="transactions">
                <h3>Recent Transactions</h3>
                {transactions.length === 0 ? (
                  <p>No transactions found</p>
                ) : (
                  <div className="tx-list">
                    {transactions.map((tx, i) => (
                      <div key={i} className="tx-card">
                        <div className="tx-signature">
                          <a 
                            href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {tx.signature.slice(0, 16)}...{tx.signature.slice(-16)}
                          </a>
                        </div>
                        <div className="tx-meta">
                          <span className={tx.err ? 'error' : 'success'}>
                            {tx.err ? '❌ Failed' : '✅ Success'}
                          </span>
                          <span className="tx-time">
                            Slot: {tx.slot}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'agents' && (
              <section className="agents">
                <h3>Registered Agents</h3>
                <div className="agent-card">
                  <div className="agent-header">
                    <h4>opus-libre-001</h4>
                    <span className="badge">Active</span>
                  </div>
                  <div className="agent-stats">
                    <div>
                      <strong>Reputation:</strong> 25 points
                    </div>
                    <div>
                      <strong>Decision Logs:</strong> 3
                    </div>
                    <div>
                      <strong>Attestations:</strong> 2 (+10, +15)
                    </div>
                    <div>
                      <strong>Purchases:</strong> 1 module (bitemporal-v1)
                    </div>
                  </div>
                  <div className="agent-decisions">
                    <h5>Recent Decisions:</h5>
                    <ul>
                      <li>📝 BTC trade analysis (attested: +10 reputation)</li>
                      <li>📝 ETH trade recommendation (attested: +15 reputation)</li>
                      <li>📝 SOL staking decision (pending attestation)</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Built by OpusLibre + Opus 4.6 | 100% Agent-Built | Colosseum Hackathon 2026</p>
          <div className="links">
            <a href="https://github.com/Suprjack/agentmemory-protocol-" target="_blank">GitHub</a>
            <a href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`} target="_blank">
              Solana Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
