# C Code Complexity Analyzer

A modern web application that analyzes C programming code using AI-powered complexity metrics through OpenRouter's Google Gemini 2.5 Flash model.

## Features

- **File Upload**: Drag & drop or click to select .c files
- **AI Analysis**: Uses Google Gemini 2.5 Flash model for intelligent code analysis
- **Complexity Metrics**: Provides comprehensive complexity analysis including:
  - **LOC**: Lines of executable code (excluding comments, blanks, and includes)
  - **Cyclomatic Complexity**: Decision points + 1
  - **Cognitive Complexity**: Cognitive complexity score
  - **Halstead Complexity**: Halstead complexity metric
- **Analysis Notes**: AI-generated insights about the code
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Real-time Validation**: Ensures proper JSON responses from AI

## Prerequisites

1. **OpenRouter API Key**: You need an API key from [OpenRouter](https://openrouter.ai/keys)
2. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge with ES6+ support
3. **Internet Connection**: Required to communicate with OpenRouter's API

## Setup Instructions

1. **Get API Key**:
   - Visit [OpenRouter](https://openrouter.ai/keys)
   - Sign up/Login and generate an API key
   - Copy the API key

2. **Open the Application**:
   - Open `c-complexity-analyzer.html` in your web browser
   - Enter your OpenRouter API key in the designated field

## Usage

1. **Input API Key**: Enter your OpenRouter API key in the top section
2. **Upload C File**: 
   - Click the upload area or drag & drop a .c file
   - Only .c files are supported
3. **Analyze Code**: Click the "Analyze Code Complexity" button
4. **View Results**: The AI will analyze your code and display:
   - Four metric cards showing complexity values
   - Analysis notes with insights

## How It Works

1. **File Processing**: Reads and displays the uploaded C code
2. **AI Prompt**: Sends a structured prompt to Google Gemini 2.5 Flash model
3. **JSON Response**: AI returns analysis in the exact JSON format specified
4. **Results Display**: Parses and displays the metrics in an attractive UI

## AI Prompt Structure

The application uses a carefully crafted prompt that ensures:
- Consistent JSON output format
- Proper integer values for all metrics
- Structured analysis notes
- No additional text or formatting

## API Configuration

- **Model**: `google/gemini-2.5-flash-image-preview:free`
- **Temperature**: 0.1 (for consistent results)
- **Max Tokens**: 1000
- **Endpoint**: OpenRouter's chat completions API

## Error Handling

The application handles various error scenarios:
- Invalid file types
- Missing API key
- Network errors
- Invalid AI responses
- JSON parsing errors

## Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Features Used**: ES6 classes, async/await, Fetch API, File API
- **CSS**: CSS Grid, Flexbox, CSS Variables, Animations

## Security Features

- API key is stored only in memory (not persisted)
- Secure HTTPS communication with OpenRouter
- Input validation and sanitization
- No local file storage

## Troubleshooting

### Common Issues:

1. **"Analysis failed" error**:
   - Check your API key is correct
   - Ensure you have sufficient OpenRouter credits
   - Verify internet connection

2. **File not uploading**:
   - Ensure file has .c extension
   - Check file size (should be reasonable)
   - Try refreshing the page

3. **No results displayed**:
   - Check browser console for errors
   - Verify API key is entered
   - Ensure .c file was selected

### Getting Help:

- Check browser console for detailed error messages
- Verify OpenRouter API key is valid
- Ensure .c file format is correct
- Check network connectivity

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (ES6+)
- **No Dependencies**: Self-contained application
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: WCAG compliant design elements

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the application.

---

**Note**: This application requires an active internet connection and valid OpenRouter API key to function. The AI analysis quality depends on the Google Gemini 2.5 Flash model's capabilities.
