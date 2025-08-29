/**
 * Control Flow Graph Calculator for C code
 * Implements CFG construction and cyclomatic complexity calculation
 * according to the requirements in SRS.txt
 */

class CFGCalculator {
  constructor() {
    // Control flow graph representation
    this.nodes = [];
    this.edges = [];
    this.entryNode = null;
    this.exitNode = null;
    
    // Metrics
    this.metrics = {
      nodes: 0,
      edges: 0,
      connectedComponents: 0,
      regions: 0,
      cyclomaticComplexity: 0
    };
  }

  /**
   * Parse C code and build control flow graph
   * @param {string} code - C source code
   * @returns {object} CFG metrics and graph data
   */
  analyze(code) {
    try {
      // Reset previous analysis
      this.reset();
      
      // Parse code into basic blocks
      this.parseCodeIntoBlocks(code);
      
      // Build control flow graph
      this.buildControlFlowGraph();
      
      // Calculate metrics
      this.calculateMetrics();
      
      // Return results
      return {
        success: true,
        metrics: this.metrics,
        nodes: this.nodes,
        edges: this.edges,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        metrics: null,
        nodes: [],
        edges: [],
        error: error.message
      };
    }
  }

  /**
   * Reset the calculator for a new analysis
   */
  reset() {
    this.nodes = [];
    this.edges = [];
    this.entryNode = null;
    this.exitNode = null;
    
    this.metrics = {
      nodes: 0,
      edges: 0,
      connectedComponents: 0,
      regions: 0,
      cyclomaticComplexity: 0
    };
  }

  /**
   * Parse C code into basic blocks
   * @param {string} code - C source code
   */
  parseCodeIntoBlocks(code) {
    // This is a simplified implementation
    // In a real implementation, we would use a proper C parser
    
    // Split code into lines
    const lines = code.split(/\r?\n/);
    
    // Create initial basic block
    let currentBlock = {
      id: 0,
      statements: [],
      successors: [],
      predecessors: []
    };
    
    this.nodes.push(currentBlock);
    this.entryNode = currentBlock;
    
    // Simple parsing logic for demonstration
    let blockId = 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }
      
      // Add statement to current block
      currentBlock.statements.push(line);
      
      // Check for control flow statements
      if (this.isControlFlowStatement(line)) {
        // Create new block for after the control flow statement
        const nextBlock = {
          id: blockId++,
          statements: [],
          successors: [],
          predecessors: [currentBlock.id]
        };
        
        // Add edge from current block to next block
        this.edges.push({
          from: currentBlock.id,
          to: nextBlock.id,
          type: 'flow'
        });
        
        // Update block connections
        currentBlock.successors.push(nextBlock.id);
        this.nodes.push(nextBlock);
        currentBlock = nextBlock;
      }
    }
    
    // Set exit node
    this.exitNode = currentBlock;
  }

  /**
   * Check if a line contains a control flow statement
   * @param {string} line - Code line
   * @returns {boolean} True if line contains control flow statement
   */
  isControlFlowStatement(line) {
    // Check for control flow keywords
    const controlFlowKeywords = [
      'if', 'else', 'for', 'while', 'do', 
      'switch', 'case', 'default', 'goto',
      'return', 'break', 'continue'
    ];
    
    for (const keyword of controlFlowKeywords) {
      if (line.includes(keyword)) {
        // Simple check - in a real implementation we would need more precise parsing
        return true;
      }
    }
    
    return false;
  }

  /**
   * Build control flow graph from basic blocks
   */
  buildControlFlowGraph() {
    // This is a simplified implementation
    // In a real implementation, we would analyze the control flow structure
    
    // Connect blocks based on control flow statements
    for (let i = 0; i < this.nodes.length - 1; i++) {
      const currentBlock = this.nodes[i];
      const nextBlock = this.nodes[i + 1];
      
      // If there's no explicit edge, add a sequential flow edge
      if (!currentBlock.successors.includes(nextBlock.id)) {
        this.edges.push({
          from: currentBlock.id,
          to: nextBlock.id,
          type: 'sequential'
        });
        currentBlock.successors.push(nextBlock.id);
        nextBlock.predecessors.push(currentBlock.id);
      }
    }
  }

  /**
   * Calculate CFG metrics
   */
  calculateMetrics() {
    // Number of nodes
    this.metrics.nodes = this.nodes.length;
    
    // Number of edges
    this.metrics.edges = this.edges.length;
    
    // For simplicity, we assume 1 connected component
    // In a real implementation, we would calculate this properly
    this.metrics.connectedComponents = 1;
    
    // For simplicity, we estimate regions
    // In a real implementation, we would calculate this properly
    this.metrics.regions = Math.max(1, this.metrics.edges - this.metrics.nodes + 2);
    
    // Cyclomatic complexity: M = E - N + 2*P
    // Where E = edges, N = nodes, P = connected components
    this.metrics.cyclomaticComplexity = 
      this.metrics.edges - this.metrics.nodes + (2 * this.metrics.connectedComponents);
  }

  /**
   * Get detailed analysis report
   * @returns {object} Detailed analysis report
   */
  getReport() {
    return {
      summary: {
        totalNodes: this.metrics.nodes,
        totalEdges: this.metrics.edges,
        connectedComponents: this.metrics.connectedComponents,
        regions: this.metrics.regions,
        cyclomaticComplexity: this.metrics.cyclomaticComplexity
      },
      nodes: this.nodes.map(node => ({
        id: node.id,
        statementCount: node.statements.length,
        successors: node.successors,
        predecessors: node.predecessors
      })),
      edges: this.edges.map(edge => ({
        from: edge.from,
        to: edge.to,
        type: edge.type
      }))
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CFGCalculator;
}