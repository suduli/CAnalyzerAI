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
   * Parse C code into basic blocks with improved function detection
   * @param {string} code - C source code
   */
  parseCodeIntoBlocks(code) {
    // Split code into lines and remove comments
    const lines = code.split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//') && !line.startsWith('/*'))
      .map(line => line.replace(/\/\*.*?\*\//g, '').trim())
      .filter(line => line);

    // Create initial basic block
    let currentBlock = {
      id: 0,
      statements: [],
      successors: [],
      predecessors: [],
      type: 'entry'
    };
    
    this.nodes.push(currentBlock);
    this.entryNode = currentBlock;
    
    let blockId = 1;
    let braceDepth = 0;
    let inFunction = false;
    let functionName = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip preprocessor directives
      if (line.startsWith('#')) continue;
      
      // Detect function definitions
      const functionMatch = line.match(/^(\w+)\s+(\w+)\s*\([^)]*\)\s*\{?$/);
      if (functionMatch) {
        // Close previous block if it has statements
        if (currentBlock.statements.length > 0) {
          const nextBlock = {
            id: blockId++,
            statements: [],
            successors: [],
            predecessors: [currentBlock.id],
            type: 'function_entry'
          };
          
          this.edges.push({
            from: currentBlock.id,
            to: nextBlock.id,
            type: 'sequential'
          });
          
          currentBlock.successors.push(nextBlock.id);
          this.nodes.push(nextBlock);
          currentBlock = nextBlock;
        }
        
        inFunction = true;
        functionName = functionMatch[2];
        currentBlock.statements.push(line);
        continue;
      }
      
      // Track brace depth
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceDepth += openBraces - closeBraces;
      
      // Check for control flow statements with improved detection
      if (this.isControlFlowStatement(line)) {
        // Add current line to current block
        currentBlock.statements.push(line);
        
        // Create new block for after the control flow statement
        const nextBlock = {
          id: blockId++,
          statements: [],
          successors: [],
          predecessors: [currentBlock.id],
          type: 'control_flow'
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
      } else {
        // Add statement to current block
        currentBlock.statements.push(line);
        
        // If we hit a return or exit statement, create a new block
        if (line.includes('return') || line.includes('exit(') || line.includes('break') || line.includes('continue')) {
          const nextBlock = {
            id: blockId++,
            statements: [],
            successors: [],
            predecessors: [currentBlock.id],
            type: 'exit'
          };
          
          this.edges.push({
            from: currentBlock.id,
            to: nextBlock.id,
            type: 'flow'
          });
          
          currentBlock.successors.push(nextBlock.id);
          this.nodes.push(nextBlock);
          currentBlock = nextBlock;
        }
      }
    }
    
    // Set exit node
    this.exitNode = currentBlock;
    this.exitNode.type = 'exit';
  }

  /**
   * Check if a line contains a control flow statement with improved detection
   * @param {string} line - Code line
   * @returns {boolean} True if line contains control flow statement
   */
  isControlFlowStatement(line) {
    // Enhanced control flow keywords with better pattern matching
    const controlFlowPatterns = [
      /\bif\s*\(/,           // if statements
      /\belse\s*\{/,         // else blocks
      /\bfor\s*\(/,          // for loops
      /\bwhile\s*\(/,        // while loops
      /\bdo\s*\{/,           // do-while loops
      /\bswitch\s*\(/,       // switch statements
      /\bcase\s+.*:/,        // case labels
      /\bdefault\s*:/,       // default case
      /\bgoto\s+\w+/,        // goto statements
      /\breturn\b/,          // return statements
      /\bbreak\b/,           // break statements
      /\bcontinue\b/,        // continue statements
      /\?\s*.*\s*:/,         // ternary operator
      /\|\||\&\&/,           // logical operators in conditions
    ];
    
    // Check if line matches any control flow pattern
    return controlFlowPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Build control flow graph from basic blocks with improved logic
   */
  buildControlFlowGraph() {
    // Connect blocks based on control flow analysis
    for (let i = 0; i < this.nodes.length; i++) {
      const currentBlock = this.nodes[i];
      
      // Analyze statements in current block to determine successors
      for (const statement of currentBlock.statements) {
        if (statement.includes('if')) {
          // If statement creates a branch
          this.createBranch(currentBlock, i);
          break; // Only process first control statement
        } else if (statement.includes('for') || statement.includes('while')) {
          // Loop creates a cycle
          this.createLoop(currentBlock, i);
          break; // Only process first control statement
        } else if (statement.includes('return') || statement.includes('break') || statement.includes('continue')) {
          // Exit statements
          this.createExit(currentBlock, i);
          break; // Only process first control statement
        }
      }
      
      // If no explicit control flow, connect to next block sequentially
      if (currentBlock.successors.length === 0 && i < this.nodes.length - 1) {
        const nextBlock = this.nodes[i + 1];
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
  }

  /**
   * Create a branch for if statements
   */
  createBranch(block, index) {
    // Create true and false branches
    const trueBlock = {
      id: this.nodes.length,
      statements: [],
      successors: [],
      predecessors: [block.id],
      type: 'branch_true'
    };
    
    const falseBlock = {
      id: this.nodes.length + 1,
      statements: [],
      successors: [],
      predecessors: [block.id],
      type: 'branch_false'
    };
    
    // Add edges for both branches
    this.edges.push(
      { from: block.id, to: trueBlock.id, type: 'true_branch' },
      { from: block.id, to: falseBlock.id, type: 'false_branch' }
    );
    
    block.successors.push(trueBlock.id, falseBlock.id);
    this.nodes.push(trueBlock, falseBlock);
  }

  /**
   * Create a loop structure
   */
  createLoop(block, index) {
    // Create loop body
    const loopBody = {
      id: this.nodes.length,
      statements: [],
      successors: [],
      predecessors: [block.id],
      type: 'loop_body'
    };
    
    // Add edge from loop header to body
    this.edges.push({
      from: block.id,
      to: loopBody.id,
      type: 'loop_entry'
    });
    
    // Add back edge from body to header (for loop continuation)
    this.edges.push({
      from: loopBody.id,
      to: block.id,
      type: 'loop_back'
    });
    
    block.successors.push(loopBody.id);
    loopBody.successors.push(block.id); // Back edge
    this.nodes.push(loopBody);
  }

  /**
   * Create exit connection
   */
  createExit(block, index) {
    // Connect to exit node if not already connected
    if (this.exitNode && !block.successors.includes(this.exitNode.id)) {
      this.edges.push({
        from: block.id,
        to: this.exitNode.id,
        type: 'exit'
      });
      block.successors.push(this.exitNode.id);
      this.exitNode.predecessors.push(block.id);
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