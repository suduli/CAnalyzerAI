/**
 * CAnalyzerAI Chat Window Component
 * Provides an interactive chat interface for C code analysis and questions
 * 
 * Features:
 * - Draggable window (drag from header)
 * - Resizable dimensions
 * - Position and size persistence
 * - Mobile-friendly touch support
 * - Double-click header to reset position
 */

class ChatWindow {
  constructor() {
    // DOM elements
    this.chatContainer = document.getElementById('chatContainer');
    this.chatHeader = document.getElementById('chatHeader');
    this.chatBody = document.getElementById('chatBody');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.chatSendBtn = document.getElementById('chatSendBtn');
    this.chatToggleBtn = document.getElementById('chatToggleBtn');
    this.chatCloseBtn = document.getElementById('chatCloseBtn');
    this.chatMinimizeBtn = document.getElementById('chatMinimizeBtn');
    this.chatClearBtn = document.getElementById('chatClearBtn');
    this.chatResizeHandle = document.getElementById('chatResizeHandle');
    this.contextIndicator = document.getElementById('contextIndicator');
    this.contextText = document.getElementById('contextText');
    this.charCount = document.getElementById('charCount');

    // State management
    this.isVisible = false;
    this.isMinimized = false;
    this.isDragging = false;
    this.isResizing = false;
    this.dragOffset = { x: 0, y: 0 };
    this.resizeStartSize = { width: 0, height: 0 };
    this.resizeStartPos = { x: 0, y: 0 };
    this.conversationHistory = [];
    this.messageIdCounter = 0;
    this.isTyping = false;

    // Context data
    this.fileContext = null;
    this.analysisContext = null;

    // Position and size management
    this.currentSize = { width: 400, height: 600 };
    this.currentPosition = { x: 20, y: 20 }; // Default position from bottom-right

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupResize();
    this.setupDrag();
    this.updateStatus();
    this.loadConversationHistory();
    this.loadSavedPosition();
    
    // Set default size and position
    this.setChatDimensions(400, 600);
    
    // Start hidden by default
    this.chatContainer?.classList.add('hidden');
    this.chatToggleBtn?.classList.remove('hidden');
    
    console.log('💬 Chat Window initialized');
  }

  bindEvents() {
    // Chat toggle
    this.chatToggleBtn?.addEventListener('click', () => this.openChat());
    
    // Chat controls
    this.chatCloseBtn?.addEventListener('click', () => this.closeChat());
    this.chatMinimizeBtn?.addEventListener('click', () => this.toggleMinimize());
    this.chatClearBtn?.addEventListener('click', () => this.clearConversation());
    
    // Message sending
    this.chatSendBtn?.addEventListener('click', () => this.handleSendMessage());
    this.chatInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });
    
    // Input handling
    this.chatInput?.addEventListener('input', () => this.updateCharCount());
    this.chatInput?.addEventListener('input', () => this.updateSendButtonState());
    
    // Shortcuts
    const shortcutBtns = document.querySelectorAll('.shortcut-btn');
    shortcutBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const shortcut = btn.dataset.shortcut;
        this.handleShortcut(shortcut);
      });
    });

    // File upload integration
    window.addEventListener('fileUploaded', (e) => {
      this.handleFileUploaded(e.detail);
    });

    // Analysis completion integration
    window.addEventListener('analysisCompleted', (e) => {
      this.handleAnalysisCompleted(e.detail);
    });

    // Double-click header to reset position
    this.chatHeader?.addEventListener('dblclick', () => this.resetPosition());

    // Prevent text selection during drag
    this.chatHeader?.addEventListener('selectstart', (e) => {
      if (this.isDragging) e.preventDefault();
    });
  }

  setupResize() {
    if (!this.chatResizeHandle) return;

    const startResize = (e) => this.startResize(e);
    const handleResize = (e) => this.handleResize(e);
    const stopResize = () => this.stopResize();

    this.chatResizeHandle.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    // Touch support
    this.chatResizeHandle.addEventListener('touchstart', startResize);
    document.addEventListener('touchmove', handleResize);
    document.addEventListener('touchend', stopResize);
  }

  setupDrag() {
    if (!this.chatHeader) return;

    const startDrag = (e) => this.startDrag(e);
    const handleDrag = (e) => this.handleDrag(e);
    const stopDrag = () => this.stopDrag();

    this.chatHeader.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);

    // Touch support for mobile
    this.chatHeader.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', handleDrag);
    document.addEventListener('touchend', stopDrag);
  }

  detectMobile() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  startDrag(e) {
    if (!this.chatContainer || this.isResizing) return;
    
    e.preventDefault();
    this.isDragging = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = this.chatContainer.getBoundingClientRect();
    this.dragOffset.x = clientX - rect.left;
    this.dragOffset.y = clientY - rect.top;
    
    this.chatContainer.classList.add('dragging');
    document.body.style.userSelect = 'none';
  }

  handleDrag(e) {
    if (!this.isDragging || !this.chatContainer) return;
    
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - this.dragOffset.x;
    const newY = clientY - this.dragOffset.y;
    
    this.setChatPosition(newX, newY);
  }

  stopDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.chatContainer?.classList.remove('dragging');
    document.body.style.userSelect = '';
    
    this.savePosition();
  }

  setChatPosition(x, y) {
    if (!this.chatContainer) return;
    
    // Convert to bottom-right positioning for consistency with original design
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const containerWidth = this.chatContainer.offsetWidth;
    const containerHeight = this.chatContainer.offsetHeight;
    
    const rightPos = viewportWidth - x - containerWidth;
    const bottomPos = viewportHeight - y - containerHeight;
    
    this.chatContainer.style.right = `${rightPos}px`;
    this.chatContainer.style.bottom = `${bottomPos}px`;
    this.chatContainer.style.left = 'auto';
    this.chatContainer.style.top = 'auto';
    
    // Update current position for saving
    this.currentPosition.x = rightPos;
    this.currentPosition.y = bottomPos;
  }

  savePosition() {
    localStorage.setItem('chat_position_x', this.currentPosition.x);
    localStorage.setItem('chat_position_y', this.currentPosition.y);
  }

  loadSavedPosition() {
    const savedX = localStorage.getItem('chat_position_x');
    const savedY = localStorage.getItem('chat_position_y');
    
    if (savedX !== null && savedY !== null) {
      this.currentPosition.x = parseInt(savedX);
      this.currentPosition.y = parseInt(savedY);
      
      if (this.chatContainer) {
        this.chatContainer.style.right = `${this.currentPosition.x}px`;
        this.chatContainer.style.bottom = `${this.currentPosition.y}px`;
      }
    }
  }

  startResize(e) {
    if (!this.chatContainer) return;
    
    e.preventDefault();
    e.stopPropagation();
    this.isResizing = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    this.resizeStartSize = {
      width: this.chatContainer.offsetWidth,
      height: this.chatContainer.offsetHeight
    };
    
    this.resizeStartPos = { x: clientX, y: clientY };
    
    this.chatContainer.classList.add('resizing');
    document.body.style.userSelect = 'none';
  }

  handleResize(e) {
    if (!this.isResizing || !this.chatContainer) return;
    
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - this.resizeStartPos.x;
    const deltaY = clientY - this.resizeStartPos.y;
    
    const newWidth = Math.max(300, this.resizeStartSize.width + deltaX);
    const newHeight = Math.max(400, this.resizeStartSize.height + deltaY);
    
    this.setChatDimensions(newWidth, newHeight);
  }

  stopResize() {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    this.chatContainer?.classList.remove('resizing');
    document.body.style.userSelect = '';
    
    // Save new dimensions
    localStorage.setItem('chat_width', this.currentSize.width);
    localStorage.setItem('chat_height', this.currentSize.height);
  }

  setChatDimensions(width, height) {
    if (!this.chatContainer) return;
    
    this.currentSize.width = width;
    this.currentSize.height = height;
    
    this.chatContainer.style.width = `${width}px`;
    this.chatContainer.style.height = `${height}px`;
  }

  show() {
    if (!this.chatContainer) return;
    
    this.chatContainer.classList.remove('hidden');
    this.chatToggleBtn?.classList.add('hidden');
    this.isVisible = true;
    
    // Focus on input
    setTimeout(() => {
      this.chatInput?.focus();
    }, 100);
    
    // Animate in
    if (window.anime) {
      anime({
        targets: this.chatContainer,
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 300,
        easing: 'easeOutCubic'
      });
    }
  }

  hide() {
    if (!this.chatContainer) return;
    
    const hideComplete = () => {
      this.chatContainer.classList.add('hidden');
      this.chatToggleBtn?.classList.remove('hidden');
      this.isVisible = false;
    };
    
    // Animate out
    if (window.anime) {
      anime({
        targets: this.chatContainer,
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 200,
        easing: 'easeInCubic',
        complete: hideComplete
      });
    } else {
      hideComplete();
    }
  }

  toggleMinimize() {
    if (!this.chatBody) return;
    
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      this.chatBody.style.display = 'none';
      this.chatResizeHandle.style.display = 'none';
      this.setChatDimensions(this.currentSize.width, 60);
    } else {
      this.chatBody.style.display = 'flex';
      this.chatResizeHandle.style.display = 'block';
      const savedHeight = localStorage.getItem('chat_height') || 600;
      this.setChatDimensions(this.currentSize.width, parseInt(savedHeight));
    }
  }

  resetPosition() {
    // Reset to default bottom-right position
    this.currentPosition = { x: 20, y: 20 };
    if (this.chatContainer) {
      this.chatContainer.style.right = '20px';
      this.chatContainer.style.bottom = '20px';
      this.chatContainer.style.left = 'auto';
      this.chatContainer.style.top = 'auto';
    }
    this.savePosition();
    console.log('💬 Chat position reset to default');
  }

  updateCharCount() {
    if (!this.chatInput || !this.charCount) return;
    
    const current = this.chatInput.value.length;
    const max = this.chatInput.maxLength || 2000;
    this.charCount.textContent = `${current}/${max}`;
    
    // Color coding
    if (current > max * 0.9) {
      this.charCount.style.color = '#ff6b6b';
    } else if (current > max * 0.7) {
      this.charCount.style.color = '#ffa726';
    } else {
      this.charCount.style.color = '';
    }
  }

  updateSendButtonState() {
    if (!this.chatSendBtn || !this.chatInput) return;
    
    const hasText = this.chatInput.value.trim().length > 0;
    const isNotTyping = !this.isTyping;
    
    this.chatSendBtn.disabled = !hasText || !isNotTyping;
  }

  async handleSendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isTyping) return;
    
    // Clear input and update UI
    this.chatInput.value = '';
    this.updateCharCount();
    this.updateSendButtonState();
    
    // Add user message
    this.addMessage('user', message);
    
    try {
      this.setTypingState(true);
      
      // Prepare context
      const context = this.buildContext();
      
      // Send to AI
      const response = await this.sendToAI(message, context);
      
      // Add AI response
      this.addMessage('assistant', response.content, response.metadata);
      
    } catch (error) {
      console.error('💬 Chat error:', error);
      this.addMessage('assistant', 'I apologize, but I encountered an error while processing your request. Please check your API configuration and try again.', {
        error: true,
        errorMessage: error.message
      });
    } finally {
      this.setTypingState(false);
    }
  }

  addMessage(role, content, metadata = {}) {
    if (!this.chatMessages) return;

    const messageId = `msg-${++this.messageIdCounter}`;
    const timestamp = new Date();
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${role}-message`;
    messageElement.id = messageId;
    
    let messageHTML = '';
    
    if (role === 'user') {
      messageHTML = `
        <div class="message-avatar">
          <span class="avatar-icon">👤</span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">You</span>
            <span class="message-time">${this.formatTime(timestamp)}</span>
          </div>
          <div class="message-text">${this.formatMessageContent(content)}</div>
        </div>
      `;
    } else if (role === 'assistant') {
      messageHTML = `
        <div class="message-avatar">
          <span class="avatar-icon">🤖</span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">C Code Assistant</span>
            <span class="message-time">${this.formatTime(timestamp)}</span>
            ${metadata.model ? `<span class="message-model">${metadata.model}</span>` : ''}
          </div>
          <div class="message-text">${this.formatMessageContent(content)}</div>
          <div class="message-actions">
            <button class="message-action-btn" onclick="chatWindow.copyMessage('${messageId}')" title="Copy message">
              <span class="action-icon">📋</span>
            </button>
            <button class="message-action-btn" onclick="chatWindow.regenerateMessage('${messageId}')" title="Regenerate response">
              <span class="action-icon">🔄</span>
            </button>
          </div>
        </div>
      `;
    }
    
    messageElement.innerHTML = messageHTML;
    this.chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    
    // Save to conversation history
    const messageData = {
      id: messageId,
      role,
      content,
      metadata,
      timestamp: timestamp.toISOString()
    };
    
    this.conversationHistory.push(messageData);
    this.saveConversationHistory();
    
    // Animate message in
    if (window.anime) {
      anime({
        targets: messageElement,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 300,
        easing: 'easeOutCubic'
      });
    }
    
    console.log(`💬 Added ${role} message:`, content.slice(0, 50));
  }

  buildSystemPrompt() {
    return `You are a helpful C programming assistant integrated into CAnalyzerAI, a code analysis tool. Your role is to:

1. **Analyze C code** - Help users understand complexity, structure, and potential issues
2. **Explain concepts** - Clarify C programming concepts, syntax, and best practices  
3. **Suggest improvements** - Recommend optimizations, refactoring, and better approaches
4. **Generate test cases** - Help create unit tests and test scenarios
5. **Debug assistance** - Help identify and fix bugs or logic errors

**Guidelines:**
- Be concise but thorough in explanations
- Focus on practical, actionable advice
- When analyzing code, consider complexity, readability, performance, and maintainability
- Use code examples when helpful
- If you don't have enough context, ask clarifying questions
- Always consider C-specific best practices and common pitfalls

**Response Format:**
- Use clear, structured responses
- Format code snippets with proper syntax highlighting when possible
- Provide step-by-step explanations for complex topics
- Include relevant examples and alternatives when appropriate`;
  }

  buildContextualMessage(message, context) {
    let contextualMessage = message;
    
    if (context) {
      if (context.file) {
        contextualMessage += `\n\n**Current File Context:**\n`;
        contextualMessage += `- File: ${context.file.name}\n`;
        contextualMessage += `- Size: ${this.formatFileSize(context.file.size)}\n`;
        if (context.file.content) {
          contextualMessage += `- Content:\n\`\`\`c\n${context.file.content.slice(0, 2000)}${context.file.content.length > 2000 ? '\n... (truncated)' : ''}\n\`\`\`\n`;
        }
      }
      
      if (context.analysis) {
        contextualMessage += `\n**Analysis Results:**\n`;
        contextualMessage += `- Lines of Code: ${context.analysis.loc}\n`;
        contextualMessage += `- Cyclomatic Complexity: ${context.analysis.complexity}\n`;
        if (context.analysis.functions && context.analysis.functions.length > 0) {
          contextualMessage += `- Functions: ${context.analysis.functions.map(f => f.name).join(', ')}\n`;
        }
      }
    }
    
    return contextualMessage;
  }

  buildContext() {
    const context = {};
    
    if (this.fileContext) {
      context.file = this.fileContext;
    }
    
    if (this.analysisContext) {
      context.analysis = this.analysisContext;
    }
    
    return Object.keys(context).length > 0 ? context : null;
  }

  async sendToAI(message, context) {
    const provider = localStorage.getItem('cai_provider') || 'ollama';
    const apiKey = localStorage.getItem('cai_api_key') || '';
    const model = localStorage.getItem('selectedModel') || 'deepseek-r1:latest';

    console.log('💬 Sending to AI:', { provider, model: model.slice(0, 20) });

    // Prepare the prompt with context
    const systemPrompt = this.buildSystemPrompt();
    const contextualMessage = this.buildContextualMessage(message, context);

    try {
      let response, data;

      if (provider === 'ollama') {
        const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: `${systemPrompt}\n\nUser: ${contextualMessage}`,
            stream: false
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!ollamaResponse.ok) {
          throw new Error(`Ollama error: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
        }

        const ollamaData = await ollamaResponse.json();
        response = ollamaData.response || 'No response generated.';

      } else if (provider === 'openai') {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: contextualMessage }
            ],
            max_tokens: 1500,
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json().catch(() => ({}));
          throw new Error(`OpenAI error: ${openaiResponse.status} ${errorData.error?.message || openaiResponse.statusText}`);
        }

        const openaiData = await openaiResponse.json();
        response = openaiData.choices?.[0]?.message?.content || 'No response generated.';

      } else if (provider === 'openrouter') {
        const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'CAnalyzerAI Chat'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: contextualMessage }
            ],
            max_tokens: 1500,
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!openrouterResponse.ok) {
          const errorData = await openrouterResponse.json().catch(() => ({}));
          throw new Error(`OpenRouter error: ${openrouterResponse.status} ${errorData.error?.message || openrouterResponse.statusText}`);
        }

        const openrouterData = await openrouterResponse.json();
        response = openrouterData.choices?.[0]?.message?.content || 'No response generated.';

      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      return {
        content: response,
        metadata: {
          model,
          provider,
          timestamp: new Date().toISOString(),
          context: context ? Object.keys(context).join(', ') : undefined
        }
      };

    } catch (error) {
      console.error('💬 AI API Error:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  setTypingState(isTyping) {
    this.isTyping = isTyping;
    this.updateSendButtonState();
    
    if (isTyping) {
      this.showTypingIndicator();
    } else {
      this.hideTypingIndicator();
    }
  }

  showTypingIndicator() {
    if (!this.chatMessages) return;
    
    // Remove existing typing indicator
    const existing = this.chatMessages.querySelector('.typing-indicator');
    if (existing) existing.remove();
    
    const typingElement = document.createElement('div');
    typingElement.className = 'chat-message assistant-message typing-indicator';
    typingElement.innerHTML = `
      <div class="message-avatar">
        <span class="avatar-icon">🤖</span>
      </div>
      <div class="message-content">
        <div class="typing-animation">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    this.chatMessages.appendChild(typingElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = this.chatMessages?.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  handleShortcut(shortcut) {
    const shortcuts = {
      explain: "Please explain this code section in detail, including its purpose, how it works, and any potential improvements.",
      optimize: "Analyze this code for optimization opportunities. Suggest improvements for performance, memory usage, and readability.",
      test: "Generate unit test cases for this code. Include edge cases and potential error scenarios.",
      debug: "Help me debug this code. Look for potential bugs, logic errors, or issues that might cause problems.",
      review: "Perform a comprehensive code review. Check for best practices, coding standards, and potential issues."
    };
    
    const prompt = shortcuts[shortcut];
    if (prompt && this.chatInput) {
      this.chatInput.value = prompt;
      this.updateCharCount();
      this.updateSendButtonState();
      this.chatInput.focus();
    }
  }

  setFileContext(fileData) {
    this.fileContext = fileData;
    this.updateContextDisplay();
    console.log('💬 File context updated:', fileData.name);
  }

  setAnalysisContext(analysisData) {
    this.analysisContext = analysisData;
    this.updateContextDisplay();
    console.log('💬 Analysis context updated');
  }

  handleFileUploaded(fileData) {
    this.setFileContext(fileData);
    
    // Add a system message about the file
    if (this.isVisible) {
      this.addMessage('assistant', `📄 File "${fileData.name}" has been loaded (${this.formatFileSize(fileData.size)}). I can now provide context-aware analysis and help with this specific code.`, {
        system: true,
        fileContext: true
      });
    }
  }

  handleAnalysisCompleted(analysisData) {
    this.setAnalysisContext(analysisData);
    
    // Add a system message about the analysis
    if (this.isVisible) {
      this.addMessage('assistant', `🔍 Analysis completed! The code has ${analysisData.loc} lines with a cyclomatic complexity of ${analysisData.complexity}. I can now help you understand the results or suggest improvements.`, {
        system: true,
        analysisContext: true
      });
    }
  }

  updateContextDisplay() {
    if (!this.contextText || !this.contextIndicator) return;
    
    let contextInfo = '';
    let hasContext = false;
    
    if (this.fileContext) {
      contextInfo += `📄 ${this.fileContext.name}`;
      hasContext = true;
    }
    
    if (this.analysisContext) {
      if (hasContext) contextInfo += ' • ';
      contextInfo += `🔍 Analysis Results`;
      hasContext = true;
    }
    
    if (!hasContext) {
      contextInfo = 'No file loaded';
    }
    
    this.contextText.textContent = contextInfo;
    this.contextIndicator.classList.toggle('has-context', hasContext);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatMessageContent(content) {
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/\n/g, '<br>');
  }

  updateStatus(status = 'ready') {
    // Update chat status indicator if needed
    console.log('💬 Status updated:', status);
  }

  clearConversation() {
    if (!this.chatMessages) return;

    // Confirm with user
    if (this.conversationHistory.length > 1) { // More than just welcome message
      if (!confirm('Are you sure you want to clear the conversation history?')) {
        return;
      }
    }

    // Clear messages except system welcome message
    const messages = this.chatMessages.querySelectorAll('.chat-message');
    messages.forEach((message, index) => {
      if (index === 0) return; // Keep welcome message
      
      if (window.anime) {
        anime({
          targets: message,
          opacity: [1, 0],
          translateX: [0, -20],
          duration: 200,
          delay: index * 50,
          easing: 'easeInCubic',
          complete: () => message.remove()
        });
      } else {
        message.remove();
      }
    });

    // Clear conversation history (keep welcome message)
    this.conversationHistory = this.conversationHistory.slice(0, 1);
    this.saveConversationHistory();

    console.log('💬 Conversation cleared');
  }

  copyMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const messageText = messageElement.querySelector('.message-text');
    if (!messageText) return;
    
    // Get text content without HTML
    const text = messageText.textContent || messageText.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Message copied to clipboard', 'success');
    }).catch(() => {
      this.showToast('Failed to copy message', 'error');
    });
  }

  async regenerateMessage(messageId) {
    const messageIndex = this.conversationHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;
    
    // Get the user message that preceded this assistant message
    const userMessage = this.conversationHistory[messageIndex - 1];
    if (!userMessage || userMessage.role !== 'user') return;
    
    try {
      this.setTypingState(true);
      
      // Remove the old message from DOM and history
      const messageElement = document.getElementById(messageId);
      if (messageElement) messageElement.remove();
      this.conversationHistory.splice(messageIndex, 1);
      
      // Regenerate response
      const context = this.buildContext();
      const response = await this.sendToAI(userMessage.content, context);
      
      // Add new response
      this.addMessage('assistant', response.content, response.metadata);
      
    } catch (error) {
      console.error('💬 Regeneration error:', error);
      this.showToast('Failed to regenerate message', 'error');
    } finally {
      this.setTypingState(false);
    }
  }

  showToast(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `chat-toast chat-toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    if (window.anime) {
      anime({
        targets: toast,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 300,
        easing: 'easeOutCubic'
      });
    }
    
    // Remove after delay
    setTimeout(() => {
      if (window.anime) {
        anime({
          targets: toast,
          opacity: [1, 0],
          translateY: [0, -20],
          duration: 200,
          easing: 'easeInCubic',
          complete: () => toast.remove()
        });
      } else {
        toast.remove();
      }
    }, 3000);
  }

  saveConversationHistory() {
    try {
      localStorage.setItem('chat_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      console.warn('Failed to save conversation history:', error);
    }
  }

  loadConversationHistory() {
    try {
      const saved = localStorage.getItem('chat_history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
        
        // Restore messages to DOM (skip welcome message which is already there)
        this.conversationHistory.slice(1).forEach(msg => {
          this.addMessageToDOMOnly(msg);
        });
      }
    } catch (error) {
      console.warn('Failed to load conversation history:', error);
      this.conversationHistory = [];
    }
  }

  addMessageToDOMOnly(messageData) {
    // Add message to DOM without modifying conversation history
    if (!this.chatMessages) return;

    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${messageData.role}-message`;
    messageElement.id = messageData.id;
    
    const timestamp = new Date(messageData.timestamp);
    
    let messageHTML = '';
    
    if (messageData.role === 'user') {
      messageHTML = `
        <div class="message-avatar">
          <span class="avatar-icon">👤</span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">You</span>
            <span class="message-time">${this.formatTime(timestamp)}</span>
          </div>
          <div class="message-text">${this.formatMessageContent(messageData.content)}</div>
        </div>
      `;
    } else if (messageData.role === 'assistant') {
      messageHTML = `
        <div class="message-avatar">
          <span class="avatar-icon">🤖</span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">C Code Assistant</span>
            <span class="message-time">${this.formatTime(timestamp)}</span>
            ${messageData.metadata?.model ? `<span class="message-model">${messageData.metadata.model}</span>` : ''}
          </div>
          <div class="message-text">${this.formatMessageContent(messageData.content)}</div>
          <div class="message-actions">
            <button class="message-action-btn" onclick="chatWindow.copyMessage('${messageData.id}')" title="Copy message">
              <span class="action-icon">📋</span>
            </button>
            <button class="message-action-btn" onclick="chatWindow.regenerateMessage('${messageData.id}')" title="Regenerate response">
              <span class="action-icon">🔄</span>
            </button>
          </div>
        </div>
      `;
    }
    
    messageElement.innerHTML = messageHTML;
    this.chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  updateThemeStyles() {
    // Update chat styles based on current theme
    if (!this.chatContainer) return;
    
    const isDark = document.body.classList.contains('dark-theme');
    this.chatContainer.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  // Public API methods
  openChat() {
    this.show();
    console.log('💬 Chat opened');
  }

  closeChat() {
    this.hide();
    console.log('💬 Chat closed');
  }

  sendMessage(message) {
    if (this.chatInput) {
      this.chatInput.value = message;
      this.updateCharCount();
      this.updateSendButtonState();
      this.handleSendMessage();
    }
  }
}

// Initialize chat window when DOM is ready
let chatWindow;

window.addEventListener('DOMContentLoaded', () => {
  chatWindow = new ChatWindow();
  
  // Make chat window globally accessible
  window.chatWindow = chatWindow;
  
  console.log('💬 Chat system initialized');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChatWindow };
} else if (typeof window !== 'undefined') {
  window.ChatWindow = ChatWindow;
}