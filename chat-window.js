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
    // Chat elements
    this.chatContainer = document.getElementById('chatContainer');
    this.chatHeader = document.getElementById('chatHeader');
    this.chatBody = document.getElementById('chatBody');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.chatSendBtn = document.getElementById('chatSendBtn');
    this.chatToggleBtn = document.getElementById('chatToggleBtn');
    this.charCount = document.getElementById('charCount');

    // Control buttons
    this.chatClearBtn = document.getElementById('chatClearBtn');
    this.chatMinimizeBtn = document.getElementById('chatMinimizeBtn');
    this.chatCloseBtn = document.getElementById('chatCloseBtn');
    this.chatAttachBtn = document.getElementById('chatAttachBtn');

    // Status elements
    this.chatStatus = document.getElementById('chatStatus');
    this.chatStatusDot = document.getElementById('chatStatusDot');
    this.chatStatusText = document.getElementById('chatStatusText');

    // Context elements
    this.chatContextInfo = document.getElementById('chatContextInfo');
    this.contextIndicator = document.getElementById('contextIndicator');
    this.contextText = document.getElementById('contextText');

    // Resize handle
    this.chatResizeHandle = document.getElementById('chatResizeHandle');

    // Shortcut buttons
    this.shortcutBtns = document.querySelectorAll('.shortcut-btn');

    // State
    this.isMinimized = false;
    this.isVisible = false;
    this.currentFileContext = null;
    this.currentAnalysisContext = null;
    this.conversationHistory = [];
    this.isTyping = false;
    this.messageIdCounter = 0;

    // Resize state
    this.isResizing = false;
    this.startWidth = 400;
    this.startHeight = 600;
    this.minWidth = 320;
    this.maxWidth = 800;
    this.minHeight = 400;
    this.maxHeight = 800;

    // Drag state
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
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
    // Send message events
    this.chatSendBtn?.addEventListener('click', () => this.handleSendMessage());
    this.chatInput?.addEventListener('keydown', (e) => this.handleInputKeydown(e));
    this.chatInput?.addEventListener('input', () => this.handleInputChange());

    // Control button events
    this.chatClearBtn?.addEventListener('click', () => {
      console.log('💬 Clear button clicked');
      this.clearConversation();
    });
    this.chatMinimizeBtn?.addEventListener('click', () => {
      console.log('💬 Minimize button clicked');
      this.toggleMinimize();
    });
    this.chatCloseBtn?.addEventListener('click', () => {
      console.log('💬 Close button clicked');
      this.hide();
    });
    this.chatToggleBtn?.addEventListener('click', () => {
      console.log('💬 Toggle button clicked');
      this.show();
    });
    this.chatAttachBtn?.addEventListener('click', () => {
      console.log('💬 Attach button clicked');
      this.toggleContextAttachment();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

    // Shortcut button events
    this.shortcutBtns?.forEach(btn => {
      btn.addEventListener('click', () => this.handleShortcut(btn.dataset.shortcut));
    });

    // Auto-resize textarea
    this.chatInput?.addEventListener('input', () => this.autoResizeInput());

    // Theme change listener
    window.addEventListener('themechange', () => this.updateThemeStyles());

    // Listen for file upload events from main app
    window.addEventListener('fileUploaded', (e) => this.handleFileUploaded(e.detail));
    window.addEventListener('analysisCompleted', (e) => this.handleAnalysisCompleted(e.detail));
    
    // Window resize listener to keep chat visible
    window.addEventListener('resize', () => this.ensureVisiblePosition());

    // Focus management
    this.chatContainer?.addEventListener('keydown', (e) => this.handleDialogKeydown(e));
  }

  setupResize() {
    if (!this.chatResizeHandle) return;

    this.chatResizeHandle.addEventListener('mousedown', (e) => this.startResize(e));
    document.addEventListener('mousemove', (e) => this.handleResize(e));
    document.addEventListener('mouseup', () => this.stopResize());

    // Touch events for mobile
    this.chatResizeHandle.addEventListener('touchstart', (e) => this.startResize(e.touches[0]));
    document.addEventListener('touchmove', (e) => this.handleResize(e.touches[0]));
    document.addEventListener('touchend', () => this.stopResize());
  }

  setupDrag() {
    if (!this.chatHeader) return;

    // Check if device is mobile
    this.isMobile = this.detectMobile();

    // Mouse events
    this.chatHeader.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.handleDrag(e));
    document.addEventListener('mouseup', () => this.stopDrag());

    // Touch events for mobile
    this.chatHeader.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]));
    document.addEventListener('touchmove', (e) => {
      e.preventDefault(); // Prevent scrolling while dragging
      this.handleDrag(e.touches[0]);
    }, { passive: false });
    document.addEventListener('touchend', () => this.stopDrag());

    // Double-click to reset position
    this.chatHeader.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.chat-control-btn')) {
        this.resetPosition();
      }
    });

    // Prevent text selection while dragging
    this.chatHeader.addEventListener('selectstart', (e) => {
      if (this.isDragging) e.preventDefault();
    });
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  }

  startDrag(e) {
    // Don't start drag if clicking on buttons
    if (e.target.closest('.chat-control-btn')) return;
    
    this.isDragging = true;
    
    const rect = this.chatContainer.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    
    // Add dragging class for styling
    this.chatContainer.classList.add('dragging');
    this.chatHeader.style.cursor = 'grabbing';
    
    // Prevent text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    
    e.preventDefault();
  }

  handleDrag(e) {
    if (!this.isDragging) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const containerWidth = this.chatContainer.offsetWidth;
    const containerHeight = this.chatContainer.offsetHeight;

    // Adjust padding based on device type
    const padding = this.isMobile ? 5 : 10;

    // On mobile, be more restrictive to prevent going off-screen
    let constrainedX, constrainedY;
    
    if (this.isMobile && viewportWidth <= 768) {
      // On small screens, allow minimal movement
      constrainedX = Math.max(0, Math.min(viewportWidth - containerWidth, x));
      constrainedY = Math.max(0, Math.min(viewportHeight - containerHeight, y));
    } else {
      // On desktop, allow more freedom with padding
      constrainedX = Math.max(padding, Math.min(viewportWidth - containerWidth - padding, x));
      constrainedY = Math.max(padding, Math.min(viewportHeight - containerHeight - padding, y));
    }

    // Update position
    this.setChatPosition(constrainedX, constrainedY);
  }

  stopDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // Remove dragging class
    this.chatContainer.classList.remove('dragging');
    this.chatHeader.style.cursor = 'grab';
    
    // Restore text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    // Save position
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
      this.currentPosition.x = parseInt(savedX, 10);
      this.currentPosition.y = parseInt(savedY, 10);
      
      // Apply saved position
      if (this.chatContainer) {
        this.chatContainer.style.right = `${this.currentPosition.x}px`;
        this.chatContainer.style.bottom = `${this.currentPosition.y}px`;
      }
    }
  }

  startResize(e) {
    this.isResizing = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startWidth = parseInt(getComputedStyle(this.chatContainer).width, 10);
    this.startHeight = parseInt(getComputedStyle(this.chatContainer).height, 10);
    document.body.style.cursor = 'nw-resize';
    e.preventDefault();
  }

  handleResize(e) {
    if (!this.isResizing) return;

    const deltaX = this.startX - e.clientX;
    const deltaY = e.clientY - this.startY;

    const newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.startWidth + deltaX));
    const newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, this.startHeight + deltaY));

    this.setChatDimensions(newWidth, newHeight);
  }

  stopResize() {
    this.isResizing = false;
    document.body.style.cursor = 'default';
  }

  setChatDimensions(width, height) {
    if (!this.chatContainer) return;
    
    this.chatContainer.style.width = `${width}px`;
    this.chatContainer.style.height = `${height}px`;
    
    // Save dimensions
    localStorage.setItem('chat_width', width);
    localStorage.setItem('chat_height', height);
  }

  show() {
    if (!this.chatContainer) return;
    
    // Store the previously focused element for restoration later
    this.previouslyFocusedElement = document.activeElement;
    
    this.chatContainer.classList.remove('hidden');
    this.chatToggleBtn?.classList.add('hidden');
    this.isVisible = true;
    
    // Restore saved dimensions
    const savedWidth = localStorage.getItem('chat_width') || 400;
    const savedHeight = localStorage.getItem('chat_height') || 600;
    this.setChatDimensions(savedWidth, savedHeight);
    
    // Restore saved position
    this.loadSavedPosition();
    
    // Animate in
    anime({
      targets: this.chatContainer,
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: 300,
      easing: 'easeOutCubic'
    });

    // Focus input after animation and announce to screen readers
    setTimeout(() => {
      this.chatInput?.focus();
      this.announceToScreenReader('Chat window opened. Focus is now in the message input field.');
    }, 300);

    this.updateStatus();
    console.log('💬 Chat window opened');
  }

  hide() {
    if (!this.chatContainer) return;
    
    // Animate out
    anime({
      targets: this.chatContainer,
      opacity: [1, 0],
      scale: [1, 0.9],
      duration: 200,
      easing: 'easeInCubic',
      complete: () => {
        this.chatContainer.classList.add('hidden');
        this.chatToggleBtn?.classList.remove('hidden');
        this.isVisible = false;
        
        // Restore focus to previously focused element
        if (this.previouslyFocusedElement && this.previouslyFocusedElement.isConnected) {
          this.previouslyFocusedElement.focus();
        } else {
          // Fallback to chat toggle button
          this.chatToggleBtn?.focus();
        }
        
        this.announceToScreenReader('Chat window closed.');
      }
    });

    console.log('💬 Chat window closed');
  }

  toggleMinimize() {
    if (!this.chatContainer || !this.chatMinimizeBtn) return;

    this.isMinimized = !this.isMinimized;

    if (this.isMinimized) {
      // Save current dimensions to restore later
      const currentWidth = parseInt(getComputedStyle(this.chatContainer).width, 10);
      const currentHeight = parseInt(getComputedStyle(this.chatContainer).height, 10);
      localStorage.setItem('chat_width_before_min', String(currentWidth));
      localStorage.setItem('chat_height_before_min', String(currentHeight));

      // Minimize - hide body, keep header
      this.chatBody?.classList.add('hidden');
      this.chatContainer.classList.add('minimized');

      // Let CSS take over the height; clear inline height so !important can win
      this.chatContainer.style.height = '';

      this.chatMinimizeBtn.innerHTML = '<span class="chat-control-icon">🗖</span>';
      this.chatMinimizeBtn.title = 'Maximize chat';
    } else {
      // Maximize - show body
      this.chatBody?.classList.remove('hidden');
      this.chatContainer.classList.remove('minimized');

      // Restore previous dimensions if available, else use saved defaults
      const w = parseInt(localStorage.getItem('chat_width_before_min') || localStorage.getItem('chat_width') || '400', 10);
      const h = parseInt(localStorage.getItem('chat_height_before_min') || localStorage.getItem('chat_height') || '600', 10);
      this.setChatDimensions(w, h);

      this.chatMinimizeBtn.innerHTML = '<span class="chat-control-icon">⚊</span>';
      this.chatMinimizeBtn.title = 'Minimize chat';
    }

    console.log(`💬 Chat window ${this.isMinimized ? 'minimized' : 'maximized'}`);
  }

  handleInputKeydown(e) {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Send message with Enter
        e.preventDefault();
        this.handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      // Close chat with Escape
      e.preventDefault();
      this.hide();
    }
  }

  handleGlobalKeydown(e) {
    // Global keyboard shortcuts
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      // Ctrl+Shift+C to open chat
      e.preventDefault();
      if (!this.isVisible) {
        this.show();
      } else {
        this.chatInput?.focus();
      }
    } else if (this.isVisible) {
      if (e.ctrlKey && e.key === 'l') {
        // Ctrl+L to clear conversation
        e.preventDefault();
        this.clearConversation();
      } else if (e.ctrlKey && e.key === 'm') {
        // Ctrl+M to minimize
        e.preventDefault();
        this.toggleMinimize();
      } else if (e.key === 'Escape' && !this.isMinimized) {
        // Escape to close (only if not minimized to avoid conflicts)
        e.preventDefault();
        this.hide();
      }
    }
  }

  handleDialogKeydown(e) {
    // Focus trap for dialog
    if (e.key === 'Tab') {
      this.handleTabKeyInDialog(e);
    }
  }

  handleTabKeyInDialog(e) {
    if (!this.isVisible || this.isMinimized) return;

    const focusableElements = this.chatContainer.querySelectorAll(
      'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  handleInputChange() {
    if (!this.chatInput || !this.charCount) return;
    
    const length = this.chatInput.value.length;
    const maxLength = parseInt(this.chatInput.getAttribute('maxlength'), 10) || 2000;
    
    this.charCount.textContent = `${length}/${maxLength}`;
    
    // Update send button state
    const isEmpty = length === 0;
    const isOverLimit = length > maxLength;
    
    if (this.chatSendBtn) {
      this.chatSendBtn.disabled = isEmpty || isOverLimit;
      this.chatSendBtn.classList.toggle('disabled', isEmpty || isOverLimit);
    }

    // Warning color for approaching limit
    if (length > maxLength * 0.9) {
      this.charCount.classList.add('warning');
    } else {
      this.charCount.classList.remove('warning');
    }
  }

  autoResizeInput() {
    if (!this.chatInput) return;
    
    // Reset height to calculate new height
    this.chatInput.style.height = 'auto';
    
    // Calculate new height (max 120px for about 5 lines)
    const newHeight = Math.min(this.chatInput.scrollHeight, 120);
    this.chatInput.style.height = `${newHeight}px`;
  }

  async handleSendMessage() {
    const message = this.chatInput?.value?.trim();
    if (!message || this.isTyping) return;

    console.log('💬 Sending message:', message);

    // Add user message to chat
    this.addMessage('user', message);
    
    // Clear input
    this.chatInput.value = '';
    this.handleInputChange();
    this.autoResizeInput();

    // Set typing state
    this.setTypingState(true);
    this.updateStatus('processing');

    try {
      // Prepare context
      const context = this.prepareContext();
      
      // Send to AI API
      const response = await this.sendToAI(message, context);
      
      // Only add message if not streaming (streaming handles its own message creation)
      if (response.metadata && !response.metadata.streaming) {
        this.addMessage('assistant', response.content, response.metadata);
      }
      
      this.updateStatus('ready');
    } catch (error) {
      console.error('💬 Error sending message:', error);
      
      // Provide helpful error messages based on the error type
      let errorMessage = `Sorry, I encountered an error: ${error.message}`;
      
      if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the AI service. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'The request timed out. The AI service might be slow or unavailable.';
      } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed. Please check your API key in settings.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
      } else if (error.message.includes('Ollama')) {
        errorMessage = 'Ollama service is not running or unavailable. Please start Ollama or switch to another provider.';
      }
      
      this.addMessage('error', errorMessage);
      this.updateStatus('error');
      this.announceToScreenReader('Error occurred while processing your message');
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
    messageElement.setAttribute('role', 'article');
    messageElement.setAttribute('aria-label', `${role === 'user' ? 'Your message' : role === 'assistant' ? 'Assistant response' : 'System message'} at ${this.formatTime(timestamp)}`);
    
    let messageHTML = '';
    
    if (role === 'user') {
      messageHTML = `
        <div class="message-avatar" aria-hidden="true">
          <span class="avatar-icon">👤</span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">You</span>
            <span class="message-time">${this.formatTime(timestamp)}</span>
          </div>
          <div class="message-text" role="text">${this.formatMessageContent(content)}</div>
        </div>
      `;
    } else if (role === 'assistant') {
      messageHTML = `
        <div class="message-avatar" aria-hidden="true">
          <span class="avatar-icon">🤖</span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">C Code Assistant</span>
            <span class="message-time">${this.formatTime(timestamp)}</span>
            ${metadata.model ? `<span class="message-model">${metadata.model}</span>` : ''}
          </div>
          <div class="message-text" role="text">${this.formatMessageContent(content)}</div>
          ${metadata.context ? `<div class="message-context">📎 Used: ${metadata.context}</div>` : ''}
        </div>
        <div class="message-actions" role="group" aria-label="Message actions">
          <button class="message-action-btn" onclick="chatWindow.copyMessage('${messageId}')" title="Copy message" aria-label="Copy this message to clipboard">
            <span class="action-icon" aria-hidden="true">📋</span>
          </button>
          <button class="message-action-btn" onclick="chatWindow.regenerateMessage('${messageId}')" title="Regenerate response" aria-label="Ask assistant to regenerate this response">
            <span class="action-icon" aria-hidden="true">🔄</span>
          </button>
        </div>
      `;
    } else if (role === 'error') {
      messageHTML = `
        <div class="message-avatar" aria-hidden="true">
          <span class="avatar-icon">⚠️</span>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-author">System</span>
            <span class="message-time">${this.formatTime(timestamp)}</span>
          </div>
          <div class="message-text error-text" role="alert">${this.formatMessageContent(content)}</div>
        </div>
      `;
    } else if (role === 'system') {
      messageHTML = `
        <div class="message-content system-content">
          <div class="message-text" role="text">${this.formatMessageContent(content)}</div>
        </div>
      `;
    }

    messageElement.innerHTML = messageHTML;
    
    // Add to conversation history
    this.conversationHistory.push({
      id: messageId,
      role,
      content,
      timestamp: timestamp.toISOString(),
      metadata
    });

    // Add to DOM with animation
    this.chatMessages.appendChild(messageElement);
    
    // Animate in
    anime({
      targets: messageElement,
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 300,
      easing: 'easeOutCubic'
    });

    // Scroll to bottom
    this.scrollToBottom();
    
    // Announce new messages to screen readers (but not system messages)
    if (role !== 'system' && role !== 'error') {
      const announcement = role === 'user' ? 
        'Your message sent' : 
        'New response from assistant received';
      setTimeout(() => this.announceToScreenReader(announcement), 500);
    } else if (role === 'error') {
      setTimeout(() => this.announceToScreenReader('Error message received'), 500);
    }
    
    // Save conversation
    this.saveConversationHistory();
  }

  formatMessageContent(content) {
    if (!content) return '';
    
    // Convert markdown-style formatting to HTML
    let formatted = content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    return formatted;
  }

  formatTime(timestamp) {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  scrollToBottom() {
    if (!this.chatMessages) return;
    
    // Smooth scroll to bottom
    this.chatMessages.scrollTo({
      top: this.chatMessages.scrollHeight,
      behavior: 'smooth'
    });
  }

  setTypingState(isTyping) {
    this.isTyping = isTyping;
    
    if (isTyping) {
      this.showTypingIndicator();
    } else {
      this.hideTypingIndicator();
    }
  }

  showTypingIndicator() {
    // Remove existing typing indicator
    this.hideTypingIndicator();
    
    const typingElement = document.createElement('div');
    typingElement.className = 'chat-message typing-message';
    typingElement.id = 'typing-indicator';
    
    typingElement.innerHTML = `
      <div class="message-avatar">
        <span class="avatar-icon">🤖</span>
      </div>
      <div class="message-content">
        <div class="typing-indicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">Assistant is thinking...</span>
        </div>
      </div>
    `;
    
    this.chatMessages?.appendChild(typingElement);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
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
        // Try streaming first, fallback to non-streaming
        try {
          response = await this.streamFromOllama(model, systemPrompt, contextualMessage);
        } catch (streamError) {
          console.warn('Streaming failed, using standard response:', streamError);
          response = await this.standardOllamaRequest(model, systemPrompt, contextualMessage);
        }

      } else if (provider === 'openai') {
        response = await this.standardOpenAIRequest(model, systemPrompt, contextualMessage, apiKey);

      } else if (provider === 'openrouter') {
        response = await this.standardOpenRouterRequest(model, systemPrompt, contextualMessage, apiKey);

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
      throw error;
    }
  }

  async streamFromOllama(model, systemPrompt, contextualMessage) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${systemPrompt}\n\nUser: ${contextualMessage}`,
        stream: true
      }),
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    // Create a streaming message element
    const streamingMessageId = `msg-${++this.messageIdCounter}`;
    this.createStreamingMessage(streamingMessageId);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
              this.updateStreamingMessage(streamingMessageId, fullResponse);
            }
            if (data.done) {
              this.finalizeStreamingMessage(streamingMessageId, fullResponse);
              return fullResponse;
            }
          } catch (parseError) {
            console.warn('Failed to parse streaming chunk:', parseError);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (!fullResponse) {
      throw new Error('No response received from streaming');
    }

    return fullResponse;
  }

  async standardOllamaRequest(model, systemPrompt, contextualMessage) {
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
    return ollamaData.response || 'No response generated.';
  }

  async standardOpenAIRequest(model, systemPrompt, contextualMessage, apiKey) {
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
    return openaiData.choices?.[0]?.message?.content || 'No response generated.';
  }

  async standardOpenRouterRequest(model, systemPrompt, contextualMessage, apiKey) {
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
    return openrouterData.choices?.[0]?.message?.content || 'No response generated.';
  }

  createStreamingMessage(messageId) {
    const timestamp = new Date();
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message assistant-message streaming-message';
    messageElement.id = messageId;
    messageElement.setAttribute('role', 'article');
    messageElement.setAttribute('aria-label', `Assistant response streaming at ${this.formatTime(timestamp)}`);
    
    messageElement.innerHTML = `
      <div class="message-avatar" aria-hidden="true">
        <span class="avatar-icon">🤖</span>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-author">C Code Assistant</span>
          <span class="message-time">${this.formatTime(timestamp)}</span>
          <span class="streaming-indicator" aria-live="polite">Streaming...</span>
        </div>
        <div class="message-text streaming-text" role="text"></div>
      </div>
    `;
    
    this.chatMessages.appendChild(messageElement);
    this.scrollToBottom();
    
    // Add to conversation history (will be updated when finalized)
    this.conversationHistory.push({
      id: messageId,
      role: 'assistant',
      content: '',
      timestamp: timestamp.toISOString(),
      metadata: { streaming: true }
    });
  }

  updateStreamingMessage(messageId, content) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      const textElement = messageElement.querySelector('.streaming-text');
      if (textElement) {
        textElement.innerHTML = this.formatMessageContent(content);
        this.scrollToBottom();
      }
    }
  }

  finalizeStreamingMessage(messageId, finalContent) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      // Remove streaming classes and indicator
      messageElement.classList.remove('streaming-message');
      const streamingIndicator = messageElement.querySelector('.streaming-indicator');
      if (streamingIndicator) {
        streamingIndicator.remove();
      }
      
      const textElement = messageElement.querySelector('.streaming-text');
      if (textElement) {
        textElement.classList.remove('streaming-text');
        textElement.innerHTML = this.formatMessageContent(finalContent);
      }
      
      // Add message actions
      const messageContent = messageElement.querySelector('.message-content');
      if (messageContent) {
        const actionsHTML = `
          <div class="message-actions" role="group" aria-label="Message actions">
            <button class="message-action-btn" onclick="chatWindow.copyMessage('${messageId}')" title="Copy message" aria-label="Copy this message to clipboard">
              <span class="action-icon" aria-hidden="true">�</span>
            </button>
            <button class="message-action-btn" onclick="chatWindow.regenerateMessage('${messageId}')" title="Regenerate response" aria-label="Ask assistant to regenerate this response">
              <span class="action-icon" aria-hidden="true">🔄</span>
            </button>
          </div>
        `;
        messageContent.insertAdjacentHTML('afterend', actionsHTML);
      }
    }
    
    // Update conversation history
    const historyItem = this.conversationHistory.find(msg => msg.id === messageId);
    if (historyItem) {
      historyItem.content = finalContent;
      historyItem.metadata.streaming = false;
      historyItem.metadata.streamCompleted = new Date().toISOString();
    }
    
    this.saveConversationHistory();
    this.announceToScreenReader('Response completed');
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
- Include code snippets in \`backticks\` or \`\`\`code blocks\`\`\`
- Use bullet points for lists
- Highlight important points with **bold text**`;
  }

  buildContextualMessage(message, context) {
    let contextualMessage = message;

    if (context) {
      let contextInfo = '\n\n**Context:**\n';
      
      if (context.filename) {
        contextInfo += `• File: ${context.filename}\n`;
      }
      
      if (context.fileContent) {
        contextInfo += `• Code:\n\`\`\`c\n${context.fileContent.slice(0, 2000)}\n\`\`\`\n`;
      }
      
      if (context.analysis) {
        contextInfo += `• Analysis Results:\n`;
        if (context.analysis.static) {
          contextInfo += `  - Static: ${JSON.stringify(context.analysis.static)}\n`;
        }
        if (context.analysis.ai) {
          contextInfo += `  - AI: ${JSON.stringify(context.analysis.ai)}\n`;
        }
      }
      
      contextualMessage += contextInfo;
    }

    return contextualMessage;
  }

  prepareContext() {
    const context = {};

    // Add file context if available
    if (this.currentFileContext) {
      context.filename = this.currentFileContext.name;
      context.fileContent = this.currentFileContext.content;
    }

    // Add analysis context if available
    if (this.currentAnalysisContext) {
      context.analysis = this.currentAnalysisContext;
    }

    return Object.keys(context).length > 0 ? context : null;
  }

  toggleContextAttachment() {
    // This could show a modal or dropdown to select what context to include
    const hasFile = !!this.currentFileContext;
    const hasAnalysis = !!this.currentAnalysisContext;
    
    if (!hasFile && !hasAnalysis) {
      this.addMessage('system', 'No file or analysis context available. Upload and analyze a C file first.');
      return;
    }

    // For now, just show what context is available
    let contextSummary = '📎 **Available Context:**\n';
    
    if (hasFile) {
      contextSummary += `• **File**: ${this.currentFileContext.name} (${this.currentFileContext.size})\n`;
    }
    
    if (hasAnalysis) {
      contextSummary += `• **Analysis**: Static and AI results available\n`;
    }
    
    contextSummary += '\nContext is automatically included in your messages when available.';
    
    this.addMessage('system', contextSummary);
  }

  handleShortcut(shortcut) {
    const shortcuts = {
      explain: "Please explain this code section and its functionality:",
      optimize: "Can you suggest optimizations for this code?",
      test: "What test cases should I write for this code?"
    };

    const message = shortcuts[shortcut];
    if (message && this.chatInput) {
      this.chatInput.value = message;
      this.chatInput.focus();
      this.handleInputChange();
    }
  }

  handleFileUploaded(fileData) {
    this.currentFileContext = {
      name: fileData.name,
      content: fileData.content,
      size: this.formatFileSize(fileData.size)
    };

    this.updateContextDisplay();
    
    // Add system message about file upload
    this.addMessage('system', `📄 **File uploaded**: ${fileData.name}\n\nI now have access to your C code and can provide contextual analysis. Feel free to ask questions about this specific file!`);
    
    console.log('💬 File context updated:', this.currentFileContext.name);
  }

  handleAnalysisCompleted(analysisData) {
    this.currentAnalysisContext = analysisData;
    this.updateContextDisplay();
    
    // Add system message about analysis completion
    const summary = `🔬 **Analysis completed** for ${analysisData.filename || 'your file'}\n\n` +
                   `**Key metrics:**\n` +
                   `• Lines of Code: ${analysisData.static?.loc || 'N/A'}\n` +
                   `• Cyclomatic Complexity: ${analysisData.static?.c1 || 'N/A'}\n` +
                   `• AI Assessment: ${analysisData.ai?.loc || 'N/A'} LOC, Complexity ${analysisData.ai?.c1 || 'N/A'}\n\n` +
                   `I can now provide detailed insights about your code's complexity and structure!`;
    
    this.addMessage('system', summary);
    
    console.log('💬 Analysis context updated:', analysisData);
  }

  updateContextDisplay() {
    if (!this.contextText) return;

    let contextDisplay = 'No file loaded';
    
    if (this.currentFileContext) {
      contextDisplay = `📄 ${this.currentFileContext.name}`;
      
      if (this.currentAnalysisContext) {
        contextDisplay += ' (analyzed)';
      }
    }

    this.contextText.textContent = contextDisplay;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  announceToScreenReader(message) {
    // Create or use existing screen reader announcement area
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    
    // Clear and set new message
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }

  updateStatus(status = 'ready') {
    if (!this.chatStatusDot || !this.chatStatusText) return;

    const statuses = {
      ready: { color: '#39ff14', text: 'Ready', announcement: 'Chat assistant is ready' },
      processing: { color: '#ffa502', text: 'Processing...', announcement: 'Processing your request' },
      error: { color: '#ff4757', text: 'Error', announcement: 'An error occurred' },
      offline: { color: '#8892b0', text: 'Offline', announcement: 'Chat assistant is offline' }
    };

    const currentStatus = statuses[status] || statuses.ready;
    
    this.chatStatusDot.style.backgroundColor = currentStatus.color;
    this.chatStatusText.textContent = currentStatus.text;
    
    // Announce status changes to screen readers
    if (this.lastStatus !== status) {
      this.announceToScreenReader(currentStatus.announcement);
      this.lastStatus = status;
    }
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
      
      anime({
        targets: message,
        opacity: [1, 0],
        translateX: [0, -20],
        duration: 200,
        delay: index * 50,
        easing: 'easeInCubic',
        complete: () => message.remove()
      });
    });

    // Clear conversation history (keep welcome message)
    this.conversationHistory = this.conversationHistory.slice(0, 1);
    this.saveConversationHistory();

    console.log('💬 Conversation cleared');
  }

  copyMessage(messageId) {
    const message = this.conversationHistory.find(msg => msg.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content).then(() => {
        // Show temporary feedback
        this.showToast('Message copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy message:', err);
        this.showToast('Failed to copy message', 'error');
      });
    }
  }

  async regenerateMessage(messageId) {
    // Find the message and previous user message
    const messageIndex = this.conversationHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const userMessageIndex = messageIndex - 1;
    const userMessage = this.conversationHistory[userMessageIndex];
    
    if (!userMessage || userMessage.role !== 'user') return;

    // Remove the AI message from DOM and history
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      messageElement.remove();
    }
    
    this.conversationHistory.splice(messageIndex, 1);

    // Regenerate response
    this.setTypingState(true);
    this.updateStatus('processing');

    try {
      const context = this.prepareContext();
      const response = await this.sendToAI(userMessage.content, context);
      this.addMessage('assistant', response.content, response.metadata);
      this.updateStatus('ready');
    } catch (error) {
      console.error('💬 Error regenerating message:', error);
      this.addMessage('error', `Failed to regenerate response: ${error.message}`);
      this.updateStatus('error');
    } finally {
      this.setTypingState(false);
    }
  }

  showToast(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `chat-toast chat-toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: type === 'error' ? '#ff4757' : '#39ff14',
      color: type === 'error' ? '#fff' : '#000',
      padding: '12px 20px',
      borderRadius: '8px',
      zIndex: '10000',
      opacity: '0',
      transform: 'translateY(20px)',
      transition: 'all 0.3s ease'
    });

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
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
          ${messageData.metadata?.context ? `<div class="message-context">📎 Used: ${messageData.metadata.context}</div>` : ''}
        </div>
        <div class="message-actions">
          <button class="message-action-btn" onclick="chatWindow.copyMessage('${messageData.id}')" title="Copy message">
            <span class="action-icon">📋</span>
          </button>
          <button class="message-action-btn" onclick="chatWindow.regenerateMessage('${messageData.id}')" title="Regenerate response">
            <span class="action-icon">🔄</span>
          </button>
        </div>
      `;
    } else if (messageData.role === 'system') {
      messageHTML = `
        <div class="message-content system-content">
          <div class="message-text">${this.formatMessageContent(messageData.content)}</div>
        </div>
      `;
    }

    messageElement.innerHTML = messageHTML;
    this.chatMessages.appendChild(messageElement);
  }

  updateThemeStyles() {
    // Called when theme changes to update chat styling if needed
    console.log('💬 Theme changed, updating chat styles');
  }

  // Public API methods
  openChat() {
    this.show();
  }

  closeChat() {
    this.hide();
  }

  sendMessage(message) {
    if (this.chatInput) {
      this.chatInput.value = message;
      this.handleInputChange();
      this.handleSendMessage();
    }
  }

  setFileContext(fileData) {
    this.handleFileUploaded(fileData);
  }

  setAnalysisContext(analysisData) {
    this.handleAnalysisCompleted(analysisData);
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

  // Method to check if chat is at edge of screen and auto-adjust
  ensureVisiblePosition() {
    if (!this.chatContainer || !this.isVisible) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const containerWidth = this.chatContainer.offsetWidth;
    const containerHeight = this.chatContainer.offsetHeight;

    // Calculate current position in viewport coordinates
    const rightPos = this.currentPosition.x;
    const bottomPos = this.currentPosition.y;
    const leftPos = viewportWidth - rightPos - containerWidth;
    const topPos = viewportHeight - bottomPos - containerHeight;

    // Check if container is outside viewport
    const padding = 10;
    let needsAdjustment = false;
    let newX = leftPos;
    let newY = topPos;

    if (leftPos < padding) {
      newX = padding;
      needsAdjustment = true;
    } else if (leftPos + containerWidth > viewportWidth - padding) {
      newX = viewportWidth - containerWidth - padding;
      needsAdjustment = true;
    }

    if (topPos < padding) {
      newY = padding;
      needsAdjustment = true;
    } else if (topPos + containerHeight > viewportHeight - padding) {
      newY = viewportHeight - containerHeight - padding;
      needsAdjustment = true;
    }

    if (needsAdjustment) {
      this.setChatPosition(newX, newY);
      this.savePosition();
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
